import browser from "webextension-polyfill"
import storedb from "../amr/storedb"
import { afterHostURL, formatMangaName, mangaKey, matchDomain, serializeVuexObject } from "../shared/utils"
import * as cheerio from "cheerio"
import { AppManga, AppStore, ChapterData, InfoResult, Mirror, MirrorImplementation } from "../types/common"
import { AppLogger } from "../shared/AppLogger"
import { MirrorLoader } from "../mirrors/MirrorLoader"
import { OptionStorage } from "../shared/OptionStorage"
import { NOT_HANDLED_MESSAGE } from "./background-util"
import { AllActions, SearchListAction } from "../types/action"

export class HandleManga {
    constructor(
        private store: AppStore,
        private logger: AppLogger,
        private mirrorLoader: MirrorLoader,
        private optionStorage: OptionStorage
    ) {}

    async handle(message: AllActions, sender): Promise<unknown> {
        switch (message.action) {
            case "mangaExists": {
                const key = this.getMangaKey(message)
                return Promise.resolve(this.store.state.mangas.all.find(manga => manga.key === key) !== undefined)
            }
            case "mangaInfos": {
                const key = this.getMangaKey(message)
                const mg = this.store.state.mangas.all.find(manga => manga.key === key)
                return mg
                    ? {
                          key: mg.key,
                          read: mg.read /* Read top */,
                          display: mg.display /* Display mode of the old reader */,
                          layout: mg.layout /* Layout for the new reader */,
                          lastchapter: mg.lastChapterReadURL /* last read chapter (the most advanced one) */,
                          currentChapter: mg.currentChapter /* last read chapter, last chapter page opened */,
                          // @TODO seems like typo, was "mg.currentScanUrlm"
                          currentScanUrl: mg.currentScanUrl /* last viewed page in currentChapter */,
                          webtoon: mg.webtoon || false /* webtoon mode */,
                          displayName: mg.displayName,
                          zoom: mg.zoom || 100 /* zoom level */
                      }
                    : null
            }
            case "saveCurrentState":
                return this.store.dispatch("saveCurrentState", message)
            case "readManga": {
                console.log("[DEBUG] handle-manga received readManga:", (message as any).name, (message as any).mirror)
                //count number of chapters read
                const nb = (await this.optionStorage.getKey("nb_read")) ?? 1
                const value = (typeof nb === "string" ? parseInt(nb) : nb) + 1
                await this.optionStorage.setKey("nb_read", value)
                this.logger.debug("Read manga " + message.url)
                // call store method to update reading list appropriately
                const result = await this.store.dispatch("readManga", message)
                // Record chapter read in statistics
                await this.store.dispatch("recordChapterRead", {
                    mirror: (message as any).mirror,
                    chapterName: (message as any).lastChapterReadName,
                    mangaName: (message as any).name,
                    chapterUrl: (message as any).url
                })
                // Check for new achievements
                await this.store.dispatch("checkAchievements")
                console.log("[DEBUG] handle-manga readManga dispatch completed")
                return result
            }
            case "initMangasFromDB":
                return this.store.dispatch("initMangasFromDB", true)
            case "deleteManga":
                this.logger.debug("Delete manga key " + message.key)
                return this.store.dispatch("deleteManga", { key: message.key })
            //returns boolean telling if url is a chapter page, infos from page and list of images for prefetch of next chapter in content script
            case "getChapterData":
                return this.getChapterData(message, sender)
            case "getImageUrlFromPageUrl":
                return this.getImageUrlFromPageUrl(message)
            case "markMangaReadTop":
                return this.store.dispatch("markMangaReadTop", message)
            case "markMangaUpdateTop":
                return this.store.dispatch("markMangaUpdateTop", message)
            case "setDisplayMode":
                return this.store.dispatch("setMangaDisplayMode", message)
            case "setLayoutMode":
                return this.store.dispatch("setMangaLayoutMode", message)
            case "setWebtoonMode":
                return this.store.dispatch("setMangaWebtoonMode", message)
            case "setZoomMode":
                return this.store.dispatch("setMangaZoomMode", message)
            case "setDisplayName":
                return this.store.dispatch("setMangaDisplayName", message)
            case "setMangaChapter":
                return this.store
                    .dispatch("resetManga", message /*{ key: this.getMangaKey(message) }*/) // reset reading to first chapter
                    .then(() => this.store.dispatch("readManga", message)) // set reading to current chapter
            case "resetManga":
                return this.store.dispatch("resetManga", message /*{ key: this.getMangaKey(message) } */)
            case "removeCategoryFromManga":
                return this.store.dispatch("removeCategoryFromManga", message)
            case "addCategoryToManga":
                return this.store.dispatch("addCategoryToManga", message)
            case "importSamples":
                return this.store.dispatch("importSamples")
            case "recordReadingTime":
                return this.store.dispatch("recordReadingTime", {
                    duration: (message as any).duration,
                    mirror: (message as any).mirror,
                    chaptersRead: (message as any).chaptersRead || 0
                })
            case "refreshMangas":
                return this.store.dispatch("refreshMangas", message)
            case "updateChaptersLists":
                // updates all mangas lists (do it in background if called from popup because it requires jQuery)
                return this.store.dispatch("updateChaptersLists") // update is forced by default (mangas are updated even if chapters has been found recently (less than a week ago) and the pause for a week option is checked) but is done manually by the user (this case is called from options page or for timers page)
            case "searchList":
                return this.searchList(message as SearchListAction)
            case "getListChaps": {
                const key = this.getMangaKey(message)
                console.log("[DEBUG] getListChaps - looking for key:", key)
                const mgch = this.store.state.mangas.all.find(mg => mg.key === key)
                if (mgch !== undefined) {
                    const listChaps = mgch.listChaps
                    console.log(
                        "[DEBUG] getListChaps - found manga:",
                        mgch.name,
                        "listChaps length:",
                        listChaps?.length || 0
                    )
                    if (listChaps && listChaps.length > 0) {
                        console.log("[DEBUG] getListChaps - first chapter:", JSON.stringify(listChaps[0]))
                        // Serialize to plain array to avoid any Proxy issues
                        const plainListChaps = JSON.parse(JSON.stringify(listChaps))
                        console.log(
                            "[DEBUG] getListChaps - returning serialized listChaps, length:",
                            plainListChaps.length
                        )
                        return Promise.resolve(plainListChaps)
                    }
                    return Promise.resolve(listChaps)
                } else {
                    console.log("[DEBUG] getListChaps - manga not found in store")
                    return Promise.resolve(false)
                }
            }
            case "loadListChaps":
                return this.loadListChaps(message)
            case "storeListChaps":
                return this.storeListChaps(message)
            case "importMangas":
                return this.importMangas(message)
            default:
                return NOT_HANDLED_MESSAGE
        }
    }

    getMangaKey(message: any) {
        if (!message.url) {
            return undefined
        }
        return mangaKey({
            url: message.url,
            mirror: message.mirror,
            language: message.language,
            rootState: this.store
        })
    }

    /**
     * Loads chapters list
     * @param {*} message
     */
    async loadListChaps(message) {
        const impl = await this.mirrorLoader.getImpl(message.mirror)
        // Pass htmlContent if provided (for Cloudflare-protected sites)
        return impl.getListChaps(message.url, message.htmlContent)
    }

    /**
     * Store chapters list to database (for Cloudflare-protected sites)
     * Called from reader when chapters are fetched via content script
     * @param {*} message
     */
    /**
     * Store chapter list fetched from content script context (used for Cloudflare-protected sites).
     *
     * This is called when the reader successfully fetches chapters via the content script,
     * which has access to the user's authenticated session and can bypass Cloudflare protection.
     *
     * TODO: KNOWN ISSUE - Icon not displaying for Cloudflare-protected Madara sites (e.g., ToonClash/MangaClash)
     * The manga.updateError flag is set to 1 when background script XHR fails with 403 from Cloudflare.
     * Even though chapters are successfully fetched via content script and we attempt to clear
     * updateError here, the icon still shows as "cancel" in popup.html manga list view.
     *
     * What we've tried:
     * 1. Calling markNoUpdateError action to clear the flag
     * 2. Awaiting the markNoUpdateError dispatch before returning
     * 3. markNoUpdateError internally calls findAndUpdateManga to persist to IndexedDB
     * 4. Debug logs confirm this code path is reached
     *
     * Possible causes not yet investigated:
     * - Vue reactivity not triggering re-render in popup after store mutation
     * - IndexedDB persistence timing issues
     * - Popup loading stale data before update is persisted
     * - BroadcastChannel not syncing state between background and popup
     */
    async storeListChaps(message) {
        console.log("[DEBUG] storeListChaps called for:", message.url, "chapters:", message.listChaps?.length)
        const key = this.getMangaKey(message)
        if (!key) {
            console.log("[DEBUG] storeListChaps - could not generate manga key")
            return false
        }
        const manga = this.store.state.mangas.all.find(mg => mg.key === key)
        if (manga) {
            console.log(
                "[DEBUG] storeListChaps - found manga:",
                manga.name,
                "updateError:",
                manga.updateError,
                "updating listChaps"
            )
            this.store.commit("updateMangaListChaps", { key: key, listChaps: message.listChaps })

            // Clear the update error flag since chapters were successfully loaded
            // Always clear it when we successfully get chapters from content script
            // NOTE: This should fix the icon issue but currently doesn't work - see TODO above
            console.log("[DEBUG] storeListChaps - clearing updateError flag (was:", manga.updateError, ")")
            // markNoUpdateError action already calls findAndUpdateManga internally, so we just need to await it
            try {
                await this.store.dispatch("markNoUpdateError", manga)
                console.log(
                    "[DEBUG] storeListChaps - cleared updateError and persisted to database, new updateError:",
                    manga.updateError
                )
            } catch (e) {
                console.error("[DEBUG] storeListChaps - failed to clear updateError:", e)
            }
            return true
        } else {
            console.log("[DEBUG] storeListChaps - manga not found in store for key:", key)
            return false
        }
    }

    /**
     * Search mangas on a mirror from search phrase
     */
    async searchList(message: SearchListAction) {
        const impl = await this.mirrorLoader.getImpl(message.mirror)
        // check if mirror can list all mangas
        if (!impl.canListFullMangas) {
            // let website search
            const list = await impl.getMangaList(message.search)
            return this.resultSearchFromArray(list, message.mirror)
        }

        // check if mirror list is in local db and filter
        const list = (await storedb.getListOfMangaForMirror(message.mirror)) as InfoResult[]
        if (list && list.length > 0) {
            // filter entries on search phrase
            return this.resultSearchFromArray(this.filterSearchList(list, message.search), message.mirror)
        }

        // retrieve from website
        const mangaList = await impl.getMangaList(message.search)

        storedb.storeListOfMangaForMirror(message.mirror, mangaList).catch(e => this.logger.error(e))
        return this.resultSearchFromArray(this.filterSearchList(mangaList, message.search), message.mirror)
    }
    /**
     * Convert array of array (standard result from implementation) in proper result
     */
    resultSearchFromArray(list: InfoResult[], mirror: string) {
        return list.map(arr => ({ url: arr[1], name: arr[0], mirror: mirror }))
    }
    /**
     * Return entries matching the search phrase from a list of results
     */
    filterSearchList(list: InfoResult[], search: string) {
        return list.filter(arr => formatMangaName(arr[0]).indexOf(formatMangaName(search)) !== -1)
    }
    /**
     * wait for Cloudflare browser integrity check to be done
     */
    async waitForCloudflare(tabId: number) {
        if (!(await this.executeCheck(tabId))) {
            return
        }

        return new Promise((resolve, reject) => {
            let tries = 0
            const interval = setInterval(async () => {
                if (!(await this.executeCheck(tabId))) {
                    clearInterval(interval)
                    return resolve(true)
                }
                tries++
                if (tries >= 40) {
                    clearInterval(interval)
                    return reject(new Error("Failed to pass Cloudflare after 40 tries"))
                }
            }, 500)
        })
    }

    async executeCheck(tabId: number) {
        const [first] = await browser.scripting.executeScript({
            target: { tabId },
            func: function () {
                return document.body.innerText
            }
        })

        if (first.error) {
            throw first.error
        }

        return first.result.match(/checking your browser before accessing/gim)
    }

    /**
     * Test if the url matches a mirror implementation.
     * If so, inject content script to transform the page and the mirror implementation inside the tab
     */
    async matchUrlAndLoadScripts(url: string, tabId: number) {
        const mirror = this.getMir(url)
        if (mirror === null) {
            return null
        }

        // Store it as plain object, vuex object property String() can cause
        // it to be [object Object], due to chapter_url : {__ob__: Observer }
        // therefore load plain javascript object instead
        const mir = this.mirrorLoader.getMirror(mirror.mirrorName)
        if (!mir) {
            return null
        }

        this.logger.debug({
            url,
            tab: tabId,
            mir: mir.domains,
            chapter: mir.chapter_url
        })

        const chapterUrl = mir.chapter_url

        // check if we need to load preload (it could be annoying to have preload on each pages of the website)
        // websites which provide a chapter_url regexp will have their chapters with a preload
        // Reset lastIndex to avoid issues with the 'g' flag on regex - calling .test() on a
        // global regex maintains state and can return false on subsequent calls
        chapterUrl.lastIndex = 0
        if (!chapterUrl.test("/" + afterHostURL(url))) {
            this.logger.info({
                result: "Chapter url is not matching, skipping...",
                chapterUrl,
                url,
                afterUrl: "/" + afterHostURL(url)
            })
            return
        }

        try {
            // wait for cloudflare browser integrity check if needed
            await this.waitForCloudflare(tabId)
        } catch (e) {
            this.logger.error(e)
            return
        }

        // Load amr preload
        const loading = []
        loading.push(
            browser.scripting.insertCSS({
                target: { tabId },
                files: ["/reader/pre-loader.css"]
            })
        )

        const bgColor = this.store.state.options.darkreader === 0 ? "white" : "#424242"
        const iconUrl = browser.runtime.getURL("/icons/icon_128.png")

        function initAmr(imgSrc, bgColor) {
            const cover = document.createElement("div")
            cover.id = "amr-loading-cover"
            cover.style.backgroundColor = bgColor
            const img = document.createElement("img")
            img.src = imgSrc
            cover.appendChild(img)

            document.body.appendChild(cover)
            setTimeout(() => {
                try {
                    // @ts-ignore
                    cover.parentNode.remove(cover)
                } catch (e) {
                    // Intentionally swallowed - DOM cleanup failure is non-critical
                }
            }, 5000)

            return {
                success: true,
                message: "Loaded AMR with bg: " + bgColor
            }
        }

        loading.push(
            browser.scripting.executeScript({
                target: { tabId },
                func: initAmr,
                args: [iconUrl, bgColor]
            })
        )
        await Promise.all(loading)

        // Inject content scripts in matched tab
        const [libResult] = await browser.scripting.executeScript({
            target: { tabId },
            files: ["/reader/init-reading.js"]
        })
        this.logger.debug({ libResult })

        const [mirrorResult] = await browser.scripting.executeScript({
            target: { tabId },
            func: function (mirror) {
                return globalThis["amrLoadMirror"](mirror)
            },
            args: [mir]
        })
        this.logger.debug(mirrorResult)

        // doing that because content script is not vue aware,
        // the reactive vuex object needs to be converted to POJSO
        return serializeVuexObject(mir)
    }

    getMir(url): Mirror | null {
        let urlHostname = new URL(url).host
        if (urlHostname.startsWith("www.")) {
            urlHostname = urlHostname.substring(4, urlHostname.length)
        }
        for (const mir of this.store.state.mirrors.all) {
            if (mir.activated && mir.domains && !mir.disabled) {
                for (const domain of mir.domains) {
                    if (matchDomain(urlHostname, domain, this.store)) {
                        return mir
                    }
                }
            }
        }
        return null
    }

    /**
     * Send an event to the tab telling that url has been changed.
     * If it's done by AMR, nothing to do, if it's inner website navigation, load amr
     */
    async sendPushState(url: string, tabId: number) {
        if (url.includes("chrome://")) {
            return
        }
        browser.scripting
            .executeScript({
                target: { tabId },
                func: function () {
                    return globalThis["__armreader__"] === undefined
                }
            })
            .then(async ([injectResult]) => {
                if (injectResult.result === true) {
                    // Reader is not defined, load it
                    return this.matchUrlAndLoadScripts(url, tabId)
                }
                return browser.scripting.executeScript({
                    target: { tabId },
                    func: function () {
                        if (typeof globalThis["onPushState"] === "function") {
                            globalThis["onPushState"]()
                        }
                    }
                })
            })
            .catch(this.logger.error)
    }
    /**
     * Return the list of images urls from a chapter
     */
    async getChapterData(message, sender) {
        // Use HTML content passed from content script if available (avoids Cloudflare issues)
        // Otherwise, fetch the page (for loading subsequent chapters)
        const getHtmlDocument = async (): Promise<string> => {
            if (message.htmlContent) {
                return message.htmlContent
            }
            const resp = await fetch(message.url)
            return resp.text()
        }

        try {
            const htmlDocument = await getHtmlDocument()
            // loads the implementation code
            const impl = await this.mirrorLoader.getImpl(message.mirrorName)
            // Check if this is a chapter page
            const isChapter = impl.isCurrentPageAChapterPage(htmlDocument, message.url)
            let infos,
                imagesUrl: string[] = []
            if (isChapter) {
                // Retrieve information relative to current chapter / manga read
                infos = await impl.getCurrentPageInfo(htmlDocument, message.url).catch(e => {
                    console.error("Error while loading getCurrentPageInfo from url " + message.url)
                    console.error(e)
                })

                // retrieve images to load
                imagesUrl = await impl.getListImages(htmlDocument, message.url, sender).catch(e => {
                    console.error("Error while loading getListImages from url " + message.url)
                    console.error(e)
                    return []
                })
            }
            const body = cheerio.load(htmlDocument)
            let title = body("title" as string).text()
            try {
                if (typeof impl.getChapterTitle === "function") {
                    title = await impl.getChapterTitle(htmlDocument, message.url)
                }
            } catch (e) {
                console.error(e)
            }
            if (!title) {
                title = (infos?.name ? infos.name + " - " : "") + "Undefined Chapter"
            }

            return <ChapterData>{
                isChapter: !!isChapter,
                infos: infos,
                images: imagesUrl,
                title: title
            }
        } catch (e) {
            console.error("error while loading images from chapter " + message.url)
            console.error(e)
            return { images: null }
        }
    }

    private async getImageUrlFromPageUrl(message: { mirror?: string; url: string }) {
        console.log("[DEBUG] getImageUrlFromPageUrl handler called for:", message.url, message.mirror)
        if (!message.mirror) {
            console.error("[DEBUG] getImageUrlFromPageUrl: mirror is required")
            return null
        }

        try {
            const impl = await this.mirrorLoader.getImpl(message.mirror)
            if (!impl) {
                console.error("[DEBUG] getImageUrlFromPageUrl: mirror impl not found:", message.mirror)
                return null
            }
            console.log("[DEBUG] Got mirror impl, calling getImageUrlFromPage")
            const result = await impl.getImageUrlFromPage(message.url)
            console.log("[DEBUG] getImageUrlFromPage result:", result)

            // If mirror returns "error" string, treat it as null
            if (result === "error" || !result) {
                console.error("[DEBUG] getImageUrlFromPageUrl: mirror returned error or null")
                return null
            }
            return result
        } catch (e) {
            console.error("[DEBUG] getImageUrlFromPageUrl ERROR:", e)
            return null
        }
    }

    /**
     * Imports a list of mangas (only the long async part is in there)
     * @param {*} message
     */
    async importMangas(message) {
        const importcat = message.importcat
        const imps = message.imports
        const cats = this.store.state.options.categoriesStates
        const catsToAdd = []
        if (imps.mangas && imps.mangas.length > 0) {
            // add default category if it does not existent
            if (importcat !== "") {
                if (-1 === cats.findIndex(cat => cat.name === importcat)) {
                    this.store.dispatch("addCategory", importcat)
                }
            }

            const readall = []
            let firstChapToImport = true
            for (const mg of imps.mangas) {
                // convert manga to something matching readManga requirements
                const readmg: Partial<AppManga> & { action?: string } = {
                    mirror: mg.m,
                    name: mg.n,
                    url: mg.u
                }
                if (mg.l) readmg.lastChapterReadURL = mg.l
                if (mg.r) readmg.read = mg.r
                if (mg.p) readmg.update = mg.p
                if (mg.d) readmg.display = mg.d
                if (mg.y) readmg.layout = mg.y
                if (mg.ut) readmg.upts = mg.ut
                if (mg.c) {
                    readmg.cats = mg.c
                    mg.c.forEach((cat: string) => {
                        if (-1 === cats.findIndex(c => c.name === cat) && !catsToAdd.includes(cat)) {
                            catsToAdd.push(cat)
                        }
                    })
                }
                if (mg.g) readmg.language = mg.g
                if (mg.dn) readmg.displayName = mg.dn
                if (mg.wt) readmg.webtoon = mg.wt
                if (mg.z) readmg.zoom = mg.z
                // add default category if specified
                if (importcat !== "") {
                    if (readmg.cats && readmg.cats.length > 0) readmg.cats.push(importcat)
                    else readmg.cats = [importcat]
                }
                readmg.action = "readManga"

                const mgimport = Promise.resolve(this.store.dispatch("readManga", readmg).catch(e => e))
                if (this.store.state.options.waitbetweenupdates === 0) {
                    if (this.store.state.options.savebandwidth === 1) {
                        await mgimport
                    } else {
                        readall.push(mgimport)
                    }
                } else {
                    if (firstChapToImport) {
                        await mgimport
                        firstChapToImport = false
                    } else {
                        await new Promise(resolve => {
                            setTimeout(async () => {
                                await mgimport
                                resolve(true)
                            }, 1000 * this.store.state.options.waitbetweenupdates)
                        })
                    }
                }
            }
            if (this.store.state.options.savebandwidth !== 1) {
                // read all mangas
                await Promise.all(readall)
            }

            if (catsToAdd.length > 0) {
                catsToAdd.forEach(cat => this.store.dispatch("addCategory", cat))
            }
        }
    }
}
