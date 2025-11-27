import { BaseMirror } from "./abstract/BaseMirror"
import { CurrentPageInfo, InfoResult, MirrorImplementation } from "../../types/common"
import { MirrorHelper } from "../MirrorHelper"
import MangaHereIcon from "../icons/mangahere-optimized.png"
import { extractListOfImages } from "../zjcdn"

export class MangaHere extends BaseMirror implements MirrorImplementation {
    constructor(amrLoader: MirrorHelper) {
        super(amrLoader)
    }

    mirrorName = "Manga Here"
    canListFullMangas = false
    mirrorIcon = MangaHereIcon
    languages = "en"
    domains = ["www.mangahere.cc", "m.mangahere.cc", "www.mangahere.co", "mangahere.cc"]
    home = "https://www.mangahere.cc/"
    chapter_url = /\/manga\/.*\/.+\/.*/

    private baseUrl = "https://www.mangahere.cc"

    // Rate limiting to prevent server from returning empty responses
    // Using a proper queue pattern - each request waits for ALL previous requests to complete
    private static requestQueue: Promise<unknown> = Promise.resolve()
    private static readonly REQUEST_DELAY_MS = 250 // 250ms delay between requests

    async getMangaList(search: string) {
        const doc = await this.mirrorHelper.loadPage("https://www.mangahere.cc/search?title=" + search, {
            nocache: true,
            preventimages: true
        })

        const $ = this.parseHtml(doc)

        const res: InfoResult[] = []

        $(".line-list ul .manga-list-4-item-title > a").each(function () {
            res.push([$(this).text().trim(), "https://www.mangahere.cc" + $(this).attr("href")])
        })
        return res
    }

    async getListChaps(urlManga: string) {
        let doc = await this.mirrorHelper.loadPage(urlManga, { nocache: true, preventimages: true })

        let $ = this.parseHtml(doc)
        if ($("#checkAdult").length > 0) {
            this.mirrorHelper.setCookie({
                // set the cookie on fanfox domain
                name: "isAdult",
                value: "1",
                path: "/",
                url: urlManga,
                domain: "www.mangahere.cc",
                expirationDate: new Date().getTime() + 24 * 60 * 60 * 1000
            })
            doc = await this.mirrorHelper.loadPage(urlManga, { nocache: true, preventimages: true })
            $ = this.parseHtml(doc)
        }
        const res = []
        $(".detail-main-list a").each(function () {
            let url = "https://www.mangahere.cc" + $(this).attr("href")
            url = url.substr(0, url.lastIndexOf("/") + 1)
            res.push([$(".title3", $(this)).text(), url])
        })
        return res
    }

    async getCurrentPageInfo(doc: string, curUrl: string): Promise<CurrentPageInfo> {
        const mga = this.queryHtml(doc, ".reader-header-title-1 a")
        return {
            name: mga.text(),
            currentMangaURL: this.baseUrl + mga.attr("href"),
            currentChapterURL: curUrl.substr(0, curUrl.lastIndexOf("/") + 1)
        }
    }

    async getListImages(doc: string, curUrl: string) {
        // Check if we have embedded list of images - look for the specific pattern with newImgs array
        // The pattern is: eval(function...) containing 'newImgs' and 'zjcdn' URLs
        // We need to be careful not to match the dm5_key eval which only contains the key
        if (doc.includes("eval(function") && doc.includes("newImgs") && doc.includes("zjcdn")) {
            const result = await extractListOfImages(doc)
            // Only use extracted images if we got valid URLs, not garbage
            if (result && result.length > 0 && result[0].includes("//")) {
                return result
            }
        }

        const lastpage = this.getVariable({ variableName: "imagecount", doc }),
            curl = curUrl.substr(0, curUrl.lastIndexOf("/") + 1),
            res = []
        for (let i = 1; i <= lastpage; i++) {
            res.push(curl + i + ".html")
        }
        return res
    }

    async getImageUrlFromPage(urlImg: string) {
        console.log("[DEBUG] MangaHere getImageUrlFromPage called with:", urlImg)

        // Relative schema url, pass it back.
        if (urlImg.startsWith("//") || urlImg.startsWith("https://zjcdn")) {
            // "//zjcdn.mangahere.org/store/manga/39145/001.0/compressed/m000.jpg",
            console.log("[DEBUG] MangaHere returning zjcdn url directly:", urlImg)
            return urlImg
        }

        // Queue this request - wait for all previous requests to complete, then add delay
        // This serializes all requests to prevent rate limiting
        const previousRequest = MangaHere.requestQueue

        // Create the actual work function
        const doRequest = async (): Promise<string> => {
            // Wait for previous request to complete
            await previousRequest

            // Add delay between requests
            console.log("[DEBUG] MangaHere throttle: waiting", MangaHere.REQUEST_DELAY_MS, "ms before request")
            await new Promise(resolve => setTimeout(resolve, MangaHere.REQUEST_DELAY_MS))

            try {
                // loads the page containing the current scan
                console.log("[DEBUG] MangaHere loading page:", urlImg)
                const doc = await this.mirrorHelper.loadPage(urlImg, { crossdomain: true, redirect: "follow" })
                console.log("[DEBUG] MangaHere page loaded, length:", doc?.length)

                // Extract dm5_key from the HTML page
                // The key is embedded as a concatenated string like: \'\'+\'c\'+\'a\'+\'6\'+...+\'d\'
                // This is the same method used by MangaFox mirror
                let mkey = ""
                try {
                    // Method 1: Extract guidkey from concatenated string pattern (same as MangaFox)
                    const keyRegex = /(?:\\'\w{0,1}\\'\+{0,1}){10,}/
                    const keyMatch = doc.match(keyRegex)
                    if (keyMatch) {
                        const unparsedKey = keyMatch[0]
                        mkey = unparsedKey.replace(/[\\'\+]/g, "")
                        console.log("[DEBUG] MangaHere extracted key via concat pattern:", mkey)
                    }

                    // Method 2: If that fails, try to find the key in a script variable
                    if (!mkey) {
                        // Look for: var guidkey = '...'; or guidkey = "...";
                        const guidkeyMatch = doc.match(/guidkey\s*=\s*['"]([a-f0-9]+)['"]/i)
                        if (guidkeyMatch) {
                            mkey = guidkeyMatch[1]
                            console.log("[DEBUG] MangaHere extracted key via guidkey var:", mkey)
                        }
                    }

                    // Method 3: Try reading from #dm5_key input if it exists and has value
                    if (!mkey) {
                        const $ = this.parseHtml(doc)
                        const dm5KeyVal = $("#dm5_key").val()
                        if (dm5KeyVal && typeof dm5KeyVal === "string" && dm5KeyVal.length > 0) {
                            mkey = dm5KeyVal
                            console.log("[DEBUG] MangaHere extracted key via #dm5_key input:", mkey)
                        }
                    }
                } catch (e) {
                    console.error("[DEBUG] MangaHere failed to extract dm5_key from script:", e)
                }
                console.log("[DEBUG] MangaHere dm5_key:", mkey || "<empty string>")

                const curl = urlImg.substr(0, urlImg.lastIndexOf("/") + 1)
                let cid, curpage
                try {
                    cid = this.getVariable({ doc, variableName: "chapterid" })
                    curpage = this.getVariable({ doc, variableName: "imagepage" })
                } catch (e) {
                    console.error("[DEBUG] MangaHere failed to get chapterid/imagepage:", e)
                    return "error"
                }
                console.log("[DEBUG] MangaHere cid:", cid, "curpage:", curpage)

                const chapfunurl = curl + "chapterfun.ashx" // url to retrieve scan url

                // get scan url (this function seems to work only within DM5, perhaps a control on Referer)
                const queryParams = new URLSearchParams({
                    cid: cid,
                    page: curpage,
                    key: mkey
                })

                // get scan url (this function seems to work only within DM5, perhaps a control on Referer)
                const url = `${chapfunurl}?${queryParams}`
                console.log("[DEBUG] MangaHere chapterfun.ashx URL:", url)

                const data = await this.mirrorHelper.loadPage(url, {
                    nocontenttype: true,
                    credentials: "include", // Include cookies for authentication
                    headers: {
                        // Note: Referer and X-Requested-With are set by declarativeNetRequest rules
                    }
                })
                console.log("[DEBUG] MangaHere chapterfun.ashx response:", data?.substring(0, 200))

                // the retrieved data is packed through an obfuscator
                // dm5 is unpacking the images url through an eval, we can't do that in AMR due to CSP
                // we do it manually (below is the unpack function shipped with the data to decode)
                const unpack = function (p, a, c, k, e, d) {
                    e = function (c) {
                        return (
                            // @ts-ignore
                            (c < a ? "" : e(parseInt(c / a))) +
                            ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
                        )
                    }
                    if (!"".replace(/^/, String)) {
                        while (c--) d[e(c)] = k[c] || e(c)
                        k = [
                            function (e) {
                                return d[e]
                            }
                        ]
                        e = function () {
                            return "\\w+"
                        }
                        c = 1
                    }
                    while (c--) if (k[c]) p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c])
                    return p
                }

                // regexp to parse the arguments to pass to the unpack function, just parse the 4 first arguments
                const regexpargs = /'(([^\\']|\\')*)',([0-9]+),([0-9]+),'(([^\\']|\\')*)'/g
                const match = regexpargs.exec(data)
                console.log("[DEBUG] MangaHere regex match:", match ? "found" : "NOT FOUND")

                if (match) {
                    let sc = unpack(match[1], match[3], match[4], match[5].split("|"), 0, {}) // call the unpack function
                    sc = sc.replace(/\\'/g, "'") // unquote the result
                    console.log("[DEBUG] MangaHere unpacked script:", sc?.substring(0, 200))

                    // the result is another js function containing the data, we mimic here what it does
                    // retrieve the variables
                    const pix = this.mirrorHelper.getVariableFromScript("pix", sc)
                    let pvalue = this.mirrorHelper.getVariableFromScript("pvalue", sc) // array of scan urls (contains current one and next one)
                    console.log("[DEBUG] MangaHere pix:", pix, "pvalue:", pvalue)

                    pvalue = pvalue.map(img => pix + img) // mimic the returned function which rebuilds the url depending on its parts
                    console.log("[DEBUG] MangaHere final image URL:", pvalue[0])
                    return pvalue[0]
                }
                console.error("[DEBUG] MangaHere no match found in chapterfun data")
                return "error"
            } catch (e) {
                console.error("[DEBUG] MangaHere getImageUrlFromPage ERROR:", e)
                return "error"
            }
        }

        // Chain this request to the queue and return its result
        const requestPromise = doRequest()
        MangaHere.requestQueue = requestPromise.catch(() => {}) // Ensure queue continues even on error
        return requestPromise
    }

    isCurrentPageAChapterPage(doc, curUrl) {
        return this.queryHtml(doc, ".reader-main").length > 0
    }
}
