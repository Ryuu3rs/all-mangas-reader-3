import storedb from "../storedb"
import * as syncUtils from "../sync/utils"

/**
 * LocalStorage - Manages local IndexedDB storage for sync operations
 * Refactored to fix method shadowing issue where dispatch method was overwriting constructor property
 */
export class LocalStorage {
    /**
     * @param {object} indexedDb - IndexedDB interface (storedb)
     * @param {Function} dispatchFn - Vuex dispatch function
     */
    constructor(indexedDb, dispatchFn) {
        this.indexedDb = indexedDb
        this._dispatch = dispatchFn
        this.requests = 0
    }

    /**
     * Load all mangas from local storage
     * @returns {Promise<Array>} List of manga objects
     */
    async loadMangaList() {
        return this.indexedDb.getMangaList()
    }

    /**
     * Dispatch an action to the store (with silent flag by default)
     * @param {string} action - Action name
     * @param {object} payload - Action payload
     * @param {boolean} silent - Whether to skip sync back to remote (default: true)
     * @returns {Promise<void>}
     */
    dispatch(action, payload, silent = true) {
        return this._dispatch(action, payload, silent)
    }

    /**
     * Sync a manga from remote to local storage
     * Uses throttling to prevent overwhelming the database
     * @param {object} manga - Manga object to sync
     */
    syncLocal(manga) {
        this.requests = this.requests + 1
        setTimeout(() => {
            this.requests = this.requests - 1
            // Fixed: was checking manga.delete instead of manga.deleted
            if (manga.deleted === syncUtils.DELETED) {
                return this._dispatch("deleteManga", { key: manga.key }, true)
            }
            return this._dispatch("readManga", { ...manga, fromSite: 1, isSync: 1 })
        }, this.requests * 500)
    }
}

/**
 * Create a new LocalStorage instance
 * @param {Function} dispatch - Vuex dispatch function
 * @returns {LocalStorage}
 */
export const createLocalStorage = dispatch => new LocalStorage(storedb, dispatch)
