import {
    SourceError,
    matchesSourceDomain,
    type ListChaptersInput,
    type ResolveChapterInput,
    type ResolveMangaInput,
    type ResolvedChapter,
    type SourceAdapter,
    type SourceChapter,
    type SourceContext,
    type SourceManga,
    type SourcePageMatch
} from "@amr/source-sdk"

const SOURCE_ID = "mangaread"
const ORIGIN = "https://www.mangaread.org"
const DOMAINS = ["mangaread.org", "www.mangaread.org"]

const BROWSER_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    Referer: ORIGIN + "/"
}

function extractChapterSlugs(url: URL): { mangaSlug: string; chapterSlug: string } | undefined {
    if (!matchesSourceDomain(url.hostname, DOMAINS)) return undefined
    const match = url.pathname.match(/^\/manga\/([^/]+)\/(chapter-[^/]+)\//)
    if (!match) return undefined
    const mangaSlug = match[1]
    const chapterSlug = match[2]
    if (!mangaSlug || !chapterSlug) return undefined
    return { mangaSlug, chapterSlug }
}

function extractMangaSlug(url: URL): string | undefined {
    if (!matchesSourceDomain(url.hostname, DOMAINS)) return undefined
    const match = url.pathname.match(/^\/manga\/([^/]+)\/?$/)
    return match?.[1]
}

function captureGroup(match: RegExpMatchArray, index: number): string | undefined {
    const v = match[index]
    return typeof v === "string" ? v : undefined
}

function extractImages(html: string): string[] {
    // Lazy-loaded: data-src on wp-manga-chapter-img
    const dataSrcMatches = [
        ...html.matchAll(/class="[^"]*wp-manga-chapter-img[^"]*"[^>]*data-src="(https?:\/\/[^"]+)"/g)
    ]
        .map(m => captureGroup(m, 1))
        .filter((s): s is string => s !== undefined)
    if (dataSrcMatches.length > 0) return dataSrcMatches

    // Direct src on wp-manga-chapter-img
    const srcMatches = [...html.matchAll(/class="[^"]*wp-manga-chapter-img[^"]*"[^>]*src="(https?:\/\/[^"]+)"/g)]
        .map(m => captureGroup(m, 1))
        .filter((s): s is string => s !== undefined && !s.startsWith("data:"))
    if (srcMatches.length > 0) return srcMatches

    // Attributes in reverse order: src before class
    const altSrcMatches = [...html.matchAll(/src="(https?:\/\/[^"]+)"[^>]*class="[^"]*wp-manga-chapter-img[^"]*"/g)]
        .map(m => captureGroup(m, 1))
        .filter((s): s is string => s !== undefined && !s.startsWith("data:"))
    if (altSrcMatches.length > 0) return altSrcMatches

    // Script variable chapter_preloaded_images
    const scriptMatch = html.match(/var\s+chapter_preloaded_images\s*=\s*(\[[\s\S]*?\]);/)
    const scriptGroup = scriptMatch ? captureGroup(scriptMatch, 1) : undefined
    if (scriptGroup) {
        try {
            const urls = JSON.parse(scriptGroup) as unknown[]
            const images = urls.filter((u): u is string => typeof u === "string" && u.startsWith("http"))
            if (images.length > 0) return images
        } catch {
            // ignore
        }
    }

    return []
}

function extractMangaTitle(html: string, mangaSlug: string): string {
    // Title tag: "Chapter N - Manga Title - MangaRead.org"
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const titleText = titleMatch ? captureGroup(titleMatch, 1) : undefined
    if (titleText) {
        const parts = titleText.split(/\s*[-–|]\s*/)
        if (parts.length >= 3) {
            const title = parts.slice(1, -1).join(" - ").trim()
            if (title) return title
        }
    }
    return mangaSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function extractChapterNumber(chapterSlug: string): string {
    const match = chapterSlug.match(/chapter-(\d+(?:\.\d+)?)/i)
    return (match ? captureGroup(match, 1) : undefined) ?? "1"
}

export const mangareadAdapter: SourceAdapter = {
    manifest: {
        id: SOURCE_ID,
        name: "MangaRead",
        domains: DOMAINS,
        languages: ["en"],
        capabilities: ["pages"],
        requestRateLimit: { requests: 3, intervalMs: 1000 },
        fixtureVersion: 1
    },

    match(url: URL): SourcePageMatch {
        if (extractChapterSlugs(url)) return "chapter"
        if (extractMangaSlug(url)) return "manga"
        return "none"
    },

    async resolveManga(input: ResolveMangaInput, context: SourceContext): Promise<SourceManga> {
        const slug = input.url ? extractMangaSlug(input.url) : input.sourceMangaId
        if (!slug) throw new SourceError("invalid-input", "A valid MangaRead manga URL is required")
        const now = context.now()
        const title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        return {
            manga: {
                id: `${SOURCE_ID}:manga:${slug}`,
                title,
                normalizedTitle: title.toLowerCase(),
                authors: [],
                status: "unknown",
                addedAt: now,
                updatedAt: now
            },
            sourceId: SOURCE_ID,
            sourceMangaId: slug,
            url: `${ORIGIN}/manga/${slug}/`
        }
    },

    async listChapters(_input: ListChaptersInput, _context: SourceContext): Promise<SourceChapter[]> {
        throw new SourceError("invalid-input", "MangaRead chapter listing is not supported")
    },

    async resolveChapter(input: ResolveChapterInput, context: SourceContext): Promise<ResolvedChapter> {
        if (!input.url) throw new SourceError("invalid-input", "A chapter URL is required")
        const slugs = extractChapterSlugs(input.url)
        if (!slugs) throw new SourceError("unsupported-url", "This chapter URL is not supported")

        const html = await context.request.getText(input.url, { headers: BROWSER_HEADERS })
        const imageUrls = extractImages(html)

        if (imageUrls.length === 0) {
            throw new SourceError("invalid-response", "No images found in chapter page")
        }

        const mangaTitle = extractMangaTitle(html, slugs.mangaSlug)
        const chapterNumber = extractChapterNumber(slugs.chapterSlug)
        const now = context.now()
        const mangaId = `${SOURCE_ID}:manga:${slugs.mangaSlug}`
        const chapterId = `${SOURCE_ID}:chapter:${slugs.mangaSlug}:${slugs.chapterSlug}`

        const manga: SourceManga = {
            manga: {
                id: mangaId,
                title: mangaTitle,
                normalizedTitle: mangaTitle.toLocaleLowerCase("en"),
                authors: [],
                status: "unknown",
                addedAt: now,
                updatedAt: now
            },
            sourceId: SOURCE_ID,
            sourceMangaId: slugs.mangaSlug,
            url: `${ORIGIN}/manga/${slugs.mangaSlug}/`
        }

        const chapter: SourceChapter = {
            id: chapterId,
            mangaId,
            sourceId: SOURCE_ID,
            sourceChapterId: `${slugs.mangaSlug}:${slugs.chapterSlug}`,
            title: `Chapter ${chapterNumber}`,
            url: input.url.toString(),
            sortKey: parseFloat(chapterNumber) || 0,
            language: "en"
        }

        const pages = imageUrls.map((url, i) => ({
            id: `${chapterId}:page:${i + 1}`,
            url
        }))

        context.logger.debug("Resolved MangaRead chapter", { chapterId, pageCount: pages.length })

        return { manga, chapter, pages }
    }
}
