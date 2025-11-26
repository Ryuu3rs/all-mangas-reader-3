/**
 * Remote sync actions for SyncManager
 * Handles operations that modify remote storage
 */
import { ThrottleError } from "../storage/error/ToManyRequests"
import * as syncUtils from "./utils"

/**
 * Delete a manga from remote storage (marks as deleted for sync)
 * @param {Object} context - Contains remoteStorages, syncTracker, logger
 * @param {string} key - Manga key to delete
 * @return {Promise<void>}
 */
export async function deleteMangaFromRemote(context, key) {
    const { remoteStorages, syncTracker, logger } = context
    for (const storage of remoteStorages) {
        await storage
            .delete(key, {
                key,
                ts: Math.round(Date.now() / 1000),
                deleted: syncUtils.DELETED
            })
            .catch(e => {
                syncTracker.triggerLastSyncError(e)
                if (e instanceof ThrottleError) {
                    storage.retryDate = e.getRetryAfterDate()
                    const later = storage.retryDate.getTime() - Date.now() + 2000
                    setTimeout(() => {
                        deleteMangaFromRemote(context, key)
                    }, later)
                } else if (e instanceof Error) {
                    logger.debug(`[SYNC-${storage.constructor.name.replace("Storage", "")}] ${e.message}`)
                }
            })
    }
}

/**
 * Set a manga property to remote storage
 * @param {Object} context - Contains remoteStorages, vuexStore, syncTracker, logger
 * @param {Manga} localManga
 * @param {string} mutatedKey
 * @param {Storage} remoteStorage - Optional specific storage to update
 * @return {Promise<void>}
 */
export async function setToRemote(context, localManga, mutatedKey, remoteStorage) {
    const { remoteStorages, vuexStore } = context
    if (vuexStore.options.isSyncing && !remoteStorage) {
        // retry in 5s if we are already syncing-in
        setTimeout(() => {
            setToRemote(context, localManga, mutatedKey, remoteStorage)
        }, 1000 * 5)
        return
    }
    if (remoteStorage) {
        await setToRemoteInternal(context, localManga, mutatedKey, remoteStorage)
    } else {
        for (const storage of remoteStorages) {
            await setToRemoteInternal(context, localManga, mutatedKey, storage)
        }
    }
}

/**
 * Internal implementation for setting manga to remote
 * @param {Object} context
 * @param {Manga} localManga
 * @param {string} mutatedKey
 * @param {Storage} storage
 */
async function setToRemoteInternal(context, localManga, mutatedKey, storage) {
    const { syncTracker, logger } = context
    // get remote Manga
    const remoteList = await storage.getAll()
    const remoteManga = remoteList.find(m => m.key === localManga.key)
    if (!remoteManga) {
        remoteList.push({ ...localManga, listChaps: [] })
    } else {
        if (mutatedKey === "ts") {
            // No remote manga (new manga to add)
            if (remoteManga.ts < localManga.ts) {
                // Mutations for:
                // resetManga, updateMangaLastChapter
                remoteManga.lastChapterReadURL = localManga.lastChapterReadURL
                remoteManga.lastChapterReadName = localManga.lastChapterReadName
                remoteManga.ts = localManga.ts
            }
        } else if (remoteManga[mutatedKey] !== localManga[mutatedKey]) {
            // Mutations for:
            // setMangaDisplayMode, setMangaLayoutMode, setMangaWebtoonMode
            // setMangaDisplayName, setMangaReadTop, setMangaUpdateTop, setMangaZoomMode
            remoteManga[mutatedKey] = localManga[mutatedKey]
            remoteManga.tsOpts = localManga.tsOpts
        } else {
            // skip if there's nothing to update
            return
        }
        // if manga was deleted and re-added it needs to be repopulated
        if (remoteManga.deleted === syncUtils.DELETED) {
            for (const rm in localManga) {
                remoteManga[rm] = localManga[rm]
            }
            delete remoteManga.deleted
            remoteManga.listChaps = []
        }
    }
    // save changes
    if (storage.isdb) {
        storage.set(remoteManga)
    } else {
        await storage.saveAll(remoteList).catch(e => {
            syncTracker.triggerLastSyncError(e)
            if (e instanceof ThrottleError) {
                storage.retryDate = e.getRetryAfterDate()
                const later = storage.retryDate.getTime() - Date.now() + 2000
                setTimeout(() => {
                    setToRemote(context, localManga, mutatedKey)
                }, later)
            } else if (e instanceof Error) {
                logger.debug(`[SYNC-${storage.constructor.name.replace("Storage", "")}] ${e.message}`)
            }
        })
    }
}

/**
 * Fix language keys in remote storage
 * @param {Object} context
 * @param {{oldManga: Manga, newManga: Manga}[]} payload
 */
export async function fixLang(context, payload) {
    const { remoteStorages, syncTracker, logger } = context
    for (const storage of remoteStorages) {
        const remoteList = await storage.getAll()
        /** Delete mangas with "wrong" keys */
        const updated = remoteList
            .map(mg => {
                const find = payload.find(p => p.oldManga.key === mg.key)
                if (!find) return mg
                return {
                    key: mg.key,
                    ts: Math.round(Date.now() / 1000),
                    deleted: syncUtils.DELETED
                }
            })
            /** Re-add them with the "fixed" key */
            .concat(payload.map(p => p.newManga))

        storage.saveAll(updated).catch(e => {
            syncTracker.triggerLastSyncError(e)
            if (e instanceof ThrottleError) {
                storage.retryDate = e.getRetryAfterDate()
                const later = storage.retryDate.getTime() - Date.now() + 2000
                setTimeout(() => {
                    fixLang(context, payload)
                }, later)
            } else if (e instanceof Error) {
                logger.debug(`[SYNC-${storage.constructor.name.replace("Storage", "")}] ${e.message}`)
            }
        })
    }
}
