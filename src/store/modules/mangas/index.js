/**
 * Mangas Store Module
 * Main entry point that combines all manga-related state, getters, actions, and mutations
 */

import storedb from "../../../amr/storedb"
import Manga from "../../../amr/manga"
import { mangaKey } from "../../../shared/utils"

// Import state and getters
import { state, getters } from "./mangas-state"

// Import mutations
import { mutations } from "./mangas-mutations"

// Import action modules
import { syncActions } from "./mangas-sync"
import { crudActions } from "./mangas-crud"
import { chapterActions } from "./mangas-chapters"
import { settingsActions } from "./mangas-settings"
import { readingActions } from "./mangas-reading"
import { updateActions } from "./mangas-update"

/**
 * Initialize mangas from database action
 */
const initActions = {
    /**
     * Retrieve manga list from DB, initialize the store
     */
    async initMangasFromDB({ commit, dispatch, rootState }) {
        await dispatch("mdFixLang")
        await storedb.getMangaList().then(async mangasdb => {
            console.log("[DEBUG] initMangasFromDB - loaded from database:", mangasdb.length, "mangas")
            if (mangasdb.length > 0) {
                console.log("[DEBUG] First manga from DB:", mangasdb[0].name, mangasdb[0].key)
            }
            await dispatch("updateLanguageCategories")
            commit(
                "setMangas",
                mangasdb.map(
                    mg =>
                        new Manga(
                            mg,
                            mangaKey({
                                url: mg.url,
                                mirror: mg.mirror,
                                language: mg.language,
                                rootState: { state: rootState }
                            })
                        )
                )
            )
        })
    }
}

/**
 * Combined actions from all modules
 */
const actions = {
    ...initActions,
    ...syncActions,
    ...crudActions,
    ...chapterActions,
    ...settingsActions,
    ...readingActions,
    ...updateActions
}

export default {
    state,
    getters,
    actions,
    mutations
}
