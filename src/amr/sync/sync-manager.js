import { ThrottleError } from "../storage/error/ToManyRequests"
import GistStorage from "../storage/gist-storage"
import BrowserStorage from "../storage/browser-storage"
import { createLocalStorage } from "../storage/local-storage"
import { getAppLogger } from "../../shared/AppLogger"
import { SyncTracker } from "./SyncTracker"
import { shouldSkipSync, shouldSyncToLocal, processUpdatesToLocal, processUpdatesToRemote } from "./sync-operations"
import { deleteMangaFromRemote, setToRemote, fixLang } from "./sync-remote-actions"

const remoteStorages = {
    GistStorage,
    BrowserStorage
}

const defaultConfig = {
    syncInterval: 30 * 1000,
    syncEnabled: 0,
    gistSyncEnabled: 0
}

class SyncManager {
    /**
     * @param logger
     * @param {SyncTracker} syncTracker
     */
    constructor(logger, syncTracker) {
        this.logger = logger
        /**
         * remoteStorages
         * @type {(Storage)[]}
         */
        this.remoteStorages = []
        this.syncTracker = syncTracker
    }

    init(config, vuexStore, dispatch) {
        this.config = { ...defaultConfig, ...config }
        this.vuexStore = vuexStore
        this.localStorage = createLocalStorage(dispatch)
        this.dispatch = dispatch
        for (const storage of this.getStorageConf()) {
            if (storage.config.enabled) {
                if (!this.remoteStorages.find(s => s.constructor.name === storage.name)) {
                    const store = new remoteStorages[storage.name](storage.config)
                    this.remoteStorages.push(store)
                }
            }
        }
        return this
    }

    async start() {
        await this.tsOpts()
        for (const storage of this.remoteStorages) {
            this.triggerSync(storage.constructor.name)
            storage.syncInterval = setInterval(this.triggerSync.bind(this, storage.constructor.name), storage.interval)
        }
    }

    stop() {
        for (const storage of this.remoteStorages) {
            clearInterval(storage.syncInterval)
            this.remoteStorages = []
        }
        // unset watcher
        this.dispatch("setOption", { key: "isSyncing", value: 0 })
    }

    getStorageConf() {
        const configs = Object.keys(this.config)
        const triggerList = []

        configs
            .filter(conf => conf.toLowerCase().includes("syncenabled"))
            .map(p => p.replace(/syncEnabled|SyncEnabled/, ""))
            .forEach(v => {
                const confObj = {}
                configs
                    .filter(c => {
                        if (v === "") {
                            return c === "syncEnabled"
                        } else {
                            return c.includes(v)
                        }
                    })
                    .forEach(c => {
                        if (c === v + "syncEnabled" || c === v + "SyncEnabled") {
                            confObj.enabled = this.config[c]
                        } else {
                            confObj[c] = this.config[c]
                        }
                    })

                triggerList.push({
                    name: v === "" ? "BrowserStorage" : v.charAt(0).toUpperCase() + v.substr(1) + "Storage",
                    config: confObj
                })
            })
        return triggerList
    }
    /**
     * Start the sync subprocess
     * @param {String} storageName
     */
    async triggerSync(storageName) {
        const storage = this.remoteStorages.find(store => store.constructor.name === storageName)
        if (!storage) {
            return
        }

        const name = storage.name
        const isUpdating = this.vuexStore.options.isUpdatingChapterLists
        const isConverting = this.vuexStore.options.isConverting
        const isSyncing = this.vuexStore.options.isSyncing
        if (isUpdating || isConverting || isSyncing) {
            this.logger.debug(`[SYNC-${name}] Skipping sync due to chapter lists being updated`)
            return
        }

        if (storage.retryDate && storage.retryDate.getTime() > Date.now()) {
            const isoString = storage.retryDate.toISOString()
            this.logger.debug(`[SYNC-${name}] Skipping sync due to present retry date until ${isoString}`)
            return
        }

        this.logger.debug(`[SYNC-${name}] Starting sync`)
        await this.dispatch("setOption", { key: "isSyncing", value: 1 }) // Set watcher

        this.checkData(storage)
            .then(res => {
                this.logger.debug(`[SYNC-${name}] Done`)
                this.logger.debug(res)
            })
            .catch(e => {
                this.syncTracker.triggerLastSyncError(e)
                if (e instanceof ThrottleError) {
                    storage.retryDate = e.getRetryAfterDate()
                } else if (e instanceof Error) {
                    this.logger.error(`[SYNC-${name}] ${e.message}`)
                }
            })
            .finally(() => {
                this.dispatch("setOption", { key: "isSyncing", value: 0 })
            })
    }

    /**
     * @param {Storage} storage
     * @returns {Promise<{local: Manga[], remote: Manga[]}>}
     */
    async checkData(storage) {
        this.logger.debug(`[SYNC-${storage.name}] Checking sync data`)
        const localList = await this.localStorage.loadMangaList()
        const remoteList = await storage.getAll()
        this.logger.debug(`[SYNC-${storage.name}] Comparing local and remote list`)
        const incoming = await processUpdatesToLocal(this.localStorage, localList, remoteList)
        const outgoing = await processUpdatesToRemote(this.logger, localList, remoteList, storage)
        this.logger.debug(`[SYNC-${storage.name}] Completed sync data check`)
        return { incoming, outgoing }
    }
    /**
     * @TODO too complex, refactor...
     */
    async tsOpts() {
        const local = await this.localStorage.loadMangaList()
        for (const storage of this.remoteStorages) {
            const remote = await storage.getAll()
            const d = Date.now()
            for (const localManga of local) {
                if (typeof localManga.tsOpts === "undefined") await this.dispatch("setMangaTsOpts", localManga, d)
            }
            let upgrade = false
            const upgradedRemote = remote.map(r => {
                if (typeof r.tsOpts === "undefined") {
                    r.tsOpts = d
                    upgrade = true
                }
                return r
            })
            if (!upgrade)
                return this.logger.debug(`[SYNC-${storage.constructor.name.replace("Storage", "")}] Nothing to update.`)
            if (storage.isdb) {
                storage.set(upgradedRemote)
            } else {
                await storage.saveAll(upgradedRemote).catch(e => {
                    this.syncTracker.triggerLastSyncError(e)
                    if (e instanceof ThrottleError) {
                        storage.retryDate = e.getRetryAfterDate()
                        const later = storage.retryDate.getTime() - Date.now() + 2000
                        setTimeout(() => {
                            this.tsOpts()
                        }, later)
                    } else if (e instanceof Error) {
                        this.logger.error(`[SYNC-${storage.constructor.name.replace("Storage", "")}] ${e.message}`)
                    }
                })
            }
        }
    }
    /**
     * Get context object for remote actions
     * @private
     */
    _getContext() {
        return {
            remoteStorages: this.remoteStorages,
            vuexStore: this.vuexStore,
            syncTracker: this.syncTracker,
            logger: this.logger
        }
    }

    /**
     * Can't actually delete it due to sync, need to mark it as deleted
     * Delegates to sync-remote-actions module
     * @param {string} key
     * @return {Promise<void>}
     */
    async deleteManga(key) {
        return deleteMangaFromRemote(this._getContext(), key)
    }

    /**
     * Change the value of a specified key
     * Delegates to sync-remote-actions module
     * @param {Manga} localManga
     * @param {string} mutatedKey
     * @param {Storage} remoteStorage
     * @return {Promise<void>}
     */
    async setToRemote(localManga, mutatedKey, remoteStorage) {
        return setToRemote(this._getContext(), localManga, mutatedKey, remoteStorage)
    }

    /**
     * Fix language keys in remote storage
     * Delegates to sync-remote-actions module
     * @param {{oldManga: Manga, newManga: Manga}[]} payload
     */
    async fixLang(payload) {
        return fixLang(this._getContext(), payload)
    }
}

let instance
/**
 * @TODO this should be only handled in background alone and interacted through
 * sending background messages, not part of any vuex store methods.
 * VUE App -> browser.runtime.sendMessage -> Background -> Handler -> SyncManager
 * @param {*} config
 * @param {*} vuexStore
 * @param {*} dispatch
 * @param {*} notificationManager only injected in background, until refactoring is done
 * @returns {SyncManager}
 */
export const getSyncManager = (config, vuexStore, dispatch, notificationManager = undefined) => {
    if (!instance) {
        const appLogger = getAppLogger(vuexStore.options)
        const syncTracker = new SyncTracker(appLogger, vuexStore.options, dispatch, notificationManager)
        instance = new SyncManager(appLogger, syncTracker)
    }
    if (config && vuexStore) {
        return instance.init(config, vuexStore, dispatch)
    } else {
        return instance
    }
}
