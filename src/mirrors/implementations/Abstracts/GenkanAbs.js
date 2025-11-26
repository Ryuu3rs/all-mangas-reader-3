/**
 * Abstract implementation for all sites based on "Powered by Genkan."
 */
globalThis["GenkanAbs"] = function (options) {
    this.default_options = {
        base_url: "",
        search_path: "comics?query=",
        series_list_selector: "div.row.mb-4 > div > div > div.list-content > div.list-body > a",
        chapter_list_selector: "div.card.p-4 > div > div",
        chapter_list_chapterno_selector: "span",
        chapter_list_chaptername_selector: "div > a.item-author.text-color",
        chapter_information_selector: "div.heading > h6",
        images_start: "window.chapterPages = ",
        images_end: ";window.nextChapter",
        images_include_base_url: true,
        chapter_page: "h6.page-section-title",
        chapter_information_title_url_parts: 5
    }
    this.options = Object.assign(this.default_options, options)
    this.mirrorName = "GenkanAbs"
    this.canListFullMangas = true

    this.getMangaList = async function (search) {
        const doc = await amr.loadPage(this.options.base_url + this.options.search_path + search, {
            nocache: true,
            preventimages: true
        })

        const res = []

        $(this.options.series_list_selector, doc).each(function () {
            res.push([$(this).text().trim(), $(this).attr("href")])
        })

        return res
    }

    this.getListChaps = async function (urlManga) {
        const doc = await amr.loadPage(urlManga, {
            nocache: true,
            preventimages: true
        })

        const res = []
        const self = this
        $(this.options.chapter_list_selector, doc).each(function () {
            const chapter_no = $(self.options.chapter_list_chapterno_selector, $(this))[0].innerText.trim()
            const chapter_name = $(self.options.chapter_list_chaptername_selector, $(this)).text().trim()
            const url = $(self.options.chapter_list_chaptername_selector, $(this)).attr("href")
            res.push([chapter_no + ": " + chapter_name, url])
        })
        return res
    }

    this.getInformationsFromCurrentPage = async function (doc, curUrl) {
        const parts = curUrl.split("/")
        return {
            name: $(this.options.chapter_information_selector, doc).text().trim(),
            currentMangaURL: parts.slice(0, this.options.chapter_information_title_url_parts).join("/"),
            currentChapterURL: curUrl
        }
    }

    this.getListImages = async function (doc, curUrl) {
        const res = []
        const base_url = this.options.base_url
        const self = this

        let tmp_script = doc.innerText.split(this.options.images_start)[1]
        tmp_script = tmp_script.split(this.options.images_end)[0]

        const matches = Array.from(tmp_script.matchAll(/["'](.*?)["']/g), m => m[1])

        matches.forEach(function (item) {
            const cleaned = item.replace(/\\/g, "")
            if (self.options.images_include_base_url) {
                res.push(base_url + cleaned)
            } else {
                res.push(cleaned)
            }
        })
        return res
    }

    this.getImageFromPageAndWrite = async function (urlImg, image) {
        $(image).attr("src", urlImg)
    }

    this.isCurrentPageAChapterPage = async function (doc, curUrl) {
        return $(this.options.chapter_page, doc).length > 0
    }
}

if (typeof registerAbstractImplementation === "function") {
    registerAbstractImplementation("GenkanAbs")
}
