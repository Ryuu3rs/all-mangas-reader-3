import { reactive } from "vue"
import EventBus from "./EventBus"
import browser from "webextension-polyfill"
import pageData from "../state/pagedata"

/**
 * This file handles Scans Loading, (unique scan and all scans from a chapter)
 * and keeps the state of the current chapter scans
 *
 * IMPORTANT: Vue 3 reactivity change from Vue 2:
 * In Vue 2, objects added to a reactive array automatically became reactive.
 * In Vue 3, this is NOT the case - objects must be explicitly made reactive.
 * Each ScanLoader instance is wrapped in reactive() to ensure Vue detects
 * property changes like loading=false.
 */

/** Current chapter's scans state - wrapped in reactive() for Vue 3 */
export const scansProvider = {
    /** Current shared state of scans */
    state: reactive({
        scans: [], // list of scans [{url, loading, error, doublepage, scan HTMLImage}]
        scansMap: new Map(), // URL -> scan object for O(1) lookups (Performance Fix A)
        progress: 0, // percentage (0 - 100) loaded of the whole chapter
        loaded: false // top indicating all scans are loaded
    }),

    /**
     * Get a scan by URL with O(1) lookup instead of O(n) find()
     * @param {string} url - The scan URL to look up
     * @returns {ScanLoader|null} The scan object or null if not found
     */
    getScanByUrl(url) {
        return this.state.scansMap.get(url) || null
    },

    /**
     * Rebuild the scansMap from the scans array
     * Called when scans are initialized or modified
     */
    rebuildScansMap() {
        this.state.scansMap.clear()
        for (const scan of this.state.scans) {
            this.state.scansMap.set(scan.url, scan)
        }
    },

    /**
     * Init current state with a ScansProvider
     * @param {} scp the scans provider to load in current state
     */
    initWithProvider(scp) {
        // Clear existing scans and push new ones to maintain reactivity
        this.state.scans.length = 0
        this.state.scansMap.clear()
        this.state.scans.push(...scp.scans)
        // Rebuild the URL -> scan map for O(1) lookups
        this.rebuildScansMap()
        // Listen to state change
        scp.onloadchapter = () => EventBus.$emit("chapter-loaded")
        scp.onloadscan = () => {
            // change progress when scan loads
            const nbloaded = this.state.scans.reduce((acc, sc) => acc + (sc.loading ? 0 : 1), 0)
            this.state.progress = Math.floor((nbloaded / this.state.scans.length) * 100)
            this.state.loaded = nbloaded === this.state.scans.length
            EventBus.$emit("loaded-scan")
            if (this.state.scans.filter(sc => sc.thinscan).length > 0) {
                EventBus.$emit("thin-scan")
            }
        }
        // initialize state with provider values (scans already set above)
        this.state.progress = scp.progress
        this.state.loaded = scp.loaded
        if (this.state.loaded) {
            if (this.state.scans.filter(sc => sc.thinscan).length > 0) {
                EventBus.$emit("thin-scan")
            }
            EventBus.$emit("chapter-loaded")
        }
    },

    /** Initialize state with a whole list of scans urls */
    init(scansUrl, mirror, inorder = false) {
        if (!scansUrl || scansUrl.length === 0) return

        const scp = new ScansLoader(scansUrl, mirror)
        this.initWithProvider(scp)

        // initialize scans
        scp.load(inorder)
    }
}

/**
 * Create a ScansLoader, which loads scans in background
 */
export const ScansLoader = class {
    constructor(scansUrl, mirror) {
        this.scans = [] // list of scans [{url, loading, error, doublepage, scan HTMLImage}]
        this.loaded = false // top indicating all scans are loaded
        this.onloadchapter = () => {} // function to call when chapter is fully loaded
        this.onloadscan = () => {} // function to call when scan is loaded

        // initialize scans - wrap each ScanLoader in reactive() for Vue 3 reactivity
        // This is critical: Vue 3 doesn't auto-reactify objects added to reactive arrays
        this.scans.push(...scansUrl.map(url => reactive(new ScanLoader(url, mirror))))
    }

    /**
     * Load all scans with concurrency limit and priority (Performance Fix D & E)
     * @param {boolean} inorder - If true, load strictly in order (1 at a time)
     * @param {number} concurrency - Max concurrent requests (default 6, browser limit)
     * @param {number} startIndex - Starting page index for priority loading (default 0)
     * @param {number} priorityRadius - Number of pages around startIndex to load first (default 2)
     */
    async load(inorder = false, concurrency = 6, startIndex = 0, priorityRadius = 2) {
        if (inorder) {
            // Load scans strictly in order (1 at a time)
            for (const sc of this.scans) {
                await sc.load()
                this.onloadscan()
            }
        } else {
            // Performance Fix E: Priority loading
            // Load pages around the starting position first for faster time-to-first-image
            const priorityScans = []
            const remainingScans = []

            // Build priority queue: startIndex ± priorityRadius first
            for (let i = 0; i < this.scans.length; i++) {
                if (i >= startIndex - priorityRadius && i <= startIndex + priorityRadius) {
                    priorityScans.push(this.scans[i])
                } else {
                    remainingScans.push(this.scans[i])
                }
            }

            // Combined queue: priority scans first, then remaining
            const queue = [...priorityScans, ...remainingScans]
            const inProgress = new Set()

            const loadNext = async () => {
                if (queue.length === 0) return

                const sc = queue.shift()
                inProgress.add(sc)

                try {
                    await sc.load()
                    this.onloadscan()
                } finally {
                    inProgress.delete(sc)
                    // Start next load if queue not empty
                    if (queue.length > 0) {
                        loadNext()
                    }
                }
            }

            // Start initial batch of concurrent loads
            const initialBatch = Math.min(concurrency, queue.length)
            for (let i = 0; i < initialBatch; i++) {
                loadNext()
            }

            // Wait for all loads to complete
            await new Promise(resolve => {
                const checkComplete = setInterval(() => {
                    if (queue.length === 0 && inProgress.size === 0) {
                        clearInterval(checkComplete)
                        resolve()
                    }
                }, 50)
            })
        }
        this.loaded = true // done loading scans
        if (process.env.NODE_ENV === "development") {
            console.log("All " + this.scans.length + " scans have been loaded")
        }
        this.onloadchapter() // raise an event to notify that chapter has been loaded
    }
}

/**
 * Handle a scan load, keeps original Image object to clone to insert scan somewhere
 */
class ScanLoader {
    /**
     * Build the scan initial state
     * @param url {string}
     * @param mirror {{ mirrorName: string }}
     */
    constructor(url, mirror) {
        this.mirror = mirror

        /* url of the image, not necessarily the url of the picture but the one used to retrieve the picture */
        this.url = url

        /* is currently loading */
        this.loading = true

        /** is the scan rendering error **/
        this.error = false

        /** is the scan a double page **/
        this.doublepage = false

        /** is the scan super thin (height > 3 * width) **/
        this.thinscan = false

        /** Image containing the loaded scan, will be cloned to be displayed **/
        this.scan = document.createElement("img")

        /* Has an auto retry of errors been attempted */
        this.retried = false
    }
    /** Loads the scan */
    load() {
        this.loading = true
        this.error = false

        // The code below introduce a loading error for a quarter of the scans
        // think about updating the this.url at the bottom of the function and replace it with just url
        /*let url = this.url
        if (Math.floor(Math.random() * 4) === 2) {
            console.log("introduce error for scan url " + this.url)
            url = 'https://www.mangareader.net/fakeimage.jpg' //introduce an error 25% of the time
        }*/

        return new Promise(async (resolve, reject) => {
            console.log("[ScanLoader] Starting load for:", this.url)
            this.scan.addEventListener("load", () => {
                const img = this.scan
                if (!img) return
                console.log(
                    "[ScanLoader] Image loaded successfully:",
                    this.url,
                    "dimensions:",
                    img.width,
                    "x",
                    img.height
                )
                /** Check if scan is double page */
                if (img.width > img.height) {
                    this.doublepage = true
                }
                if (img.height >= 3 * img.width) {
                    // super thin scan, raise an event
                    this.thinscan = true
                }
                this.loading = false
                this.error = false
                console.log("[ScanLoader] Set loading=false for:", this.url)
                resolve()
            })
            const manageError = e => {
                console.error("[ScanLoader] Error loading image:", this.url)
                console.error(e)
                this.loading = false
                this.error = true
                // if (!this.retried) {
                //     this.retried = true
                //     this.load()
                // }
                resolve()
            }
            this.scan.addEventListener("error", e => {
                manageError(e)
            })
            try {
                // Load the scan using implementation method
                console.log("[ScanLoader] Sending getImageUrlFromPageUrl message for:", this.url)
                let imageUrl = await browser.runtime.sendMessage({
                    action: "getImageUrlFromPageUrl",
                    url: this.url,
                    mirror: this.mirror.mirrorName,
                    language: pageData.state.language
                })
                console.log("[ScanLoader] Got imageUrl:", imageUrl)

                // Check if we got a valid image URL
                if (!imageUrl || imageUrl === "error" || imageUrl === "null") {
                    console.error("[ScanLoader] Invalid imageUrl received:", imageUrl)
                    manageError(new Error("Failed to get image URL from mirror"))
                    return
                }

                // Normalize protocol-relative URLs (starting with //) to use https://
                // In extension context, protocol-relative URLs resolve incorrectly
                // (e.g., moz-extension://zjcdn.mangahere.org/... instead of https://...)
                if (imageUrl.startsWith("//")) {
                    imageUrl = "https:" + imageUrl
                    console.log("[ScanLoader] Normalized to:", imageUrl)
                }

                console.log("[ScanLoader] Setting scan.src to:", imageUrl)
                this.scan.src = imageUrl
            } catch (e) {
                manageError(e)
            }
        })
    }
}
