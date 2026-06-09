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

const SOURCE_ID = "mgeko"
const ORIGIN = "https://www.mgeko.cc"
const DOMAINS = ["mgeko.cc", "www.mgeko.cc"]

const BROWSER_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    Referer: ORIGIN + "/"
}

function extractChapterSlug(url: URL): string | undefined {
    if (!matchesSourceDomain(url.hostname, DOMAINS)) return undefined
    const match = url.pathname.match(/^\/reader\/en\/([^/]+)\/?$/)
    return match?.[1]
}

function extractMangaSlug(url: URL): string | undefined {
    if (!matchesSourceDomain(url.hostname, DOMAINS)) return undefined
    const match = url.pathname.match(/^\/comic\/([^/]+)\/?$/)
    return match?.[1]
}

// Parse slug like "manga-title-chapter-52-eng-li" into parts
function parseChapterSlug(slug: string): { mangaSlug: string; chapterNumber: string; mangaTitle: string } {
    const chapterMatch = slug.match(/^(.*)-chapter-(\d+(?:-\d+)?)-/)
    if (chapterMatch) {
        const mangaSlug = chapterMatch[1] ?? slug
        const raw = chapterMatch[2] ?? "1"
        const chapterNumber = raw.replace("-", ".")
        const mangaTitle = mangaSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        return { mangaSlug, chapterNumber, mangaTitle }
    }
    return { mangaSlug: slug, chapterNumber: "1", mangaTitle: slug.replace(/-/g, " ") }
}

function tryParseJsonArray(raw: string): string[] {
    try {
        const urls = JSON.parse(raw.replace(/'/g, '"')) as unknown[]
        return urls.filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    } catch {
        return []
    }
}

function extractImages(html: string): string[] {
    // JS variable: var chapImages = [...]
    const chapImagesMatch = html.match(/var\s+chapImages\s*=\s*(\[[\s\S]*?\]);/)
    if (chapImagesMatch) {
        const raw = chapImagesMatch[1]
        if (raw) {
            const images = tryParseJsonArray(raw)
            if (images.length > 0) return images
        }
    }

    // JS variable: var chapterImages = [...]
    const chapterImagesMatch = html.match(/var\s+chapterImages\s*=\s*(\[[\s\S]*?\]);/)
    if (chapterImagesMatch) {
        const raw = chapterImagesMatch[1]
        if (raw) {
            const images = tryParseJsonArray(raw)
            if (images.length > 0) return images
        }
    }

    // img tags from imgsrv CDN
    const imgsrvMatches = [...html.matchAll(/src="(https?:\/\/[^"]*imgsrv[^"]+)"/g)]
        .map(m => m[1])
        .filter((s): s is string => s !== undefined)
    if (imgsrvMatches.length > 0) return imgsrvMatches

    // Gallery blocks
    const galleryMatches = [
        ...html.matchAll(/<li[^>]*class="[^"]*blocks-gallery-item[^"]*"[\s\S]*?<img[^>]+src="(https?:\/\/[^"]+)"/g)
    ]
        .map(m => m[1])
        .filter((s): s is string => s !== undefined)
    if (galleryMatches.length > 0) return galleryMatches

    // Any img with CDN-like pattern
    const cdnMatches = [...html.matchAll(/src="(https?:\/\/(?:s\d+\.)?img[^"]+\.(?:jpg|png|webp))"/gi)]
        .map(m => m[1])
        .filter((s): s is string => s !== undefined)
    if (cdnMatches.length > 0) return cdnMatches

    return []
}

export const mgekoAdapter: SourceAdapter = {
    manifest: {
        id: SOURCE_ID,
        name: "Mgeko",
        domains: DOMAINS,
        languages: ["en"],
        capabilities: ["pages"],
        requestRateLimit: { requests: 3, intervalMs: 1000 },
        fixtureVersion: 1
    },

    match(url: URL): SourcePageMatch {
        if (extractChapterSlug(url)) return "chapter"
        if (extractMangaSlug(url)) return "manga"
        return "none"
    },

    async resolveManga(input: ResolveMangaInput, context: SourceContext): Promise<SourceManga> {
        const slug = input.url ? extractMangaSlug(input.url) : input.sourceMangaId
        if (!slug) throw new SourceError("invalid-input", "A valid Mgeko manga URL is required")
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
            url: `${ORIGIN}/comic/${slug}/`
        }
    },

    async listChapters(_input: ListChaptersInput, _context: SourceContext): Promise<SourceChapter[]> {
        throw new SourceError("invalid-input", "Mgeko chapter listing is not supported")
    },

    async resolveChapter(input: ResolveChapterInput, context: SourceContext): Promise<ResolvedChapter> {
        if (!input.url) throw new SourceError("invalid-input", "A chapter URL is required")
        const chapterSlug = extractChapterSlug(input.url)
        if (!chapterSlug) throw new SourceError("unsupported-url", "This chapter URL is not supported")

        const html = await context.request.getText(input.url, { headers: BROWSER_HEADERS })
        const imageUrls = extractImages(html)

        if (imageUrls.length === 0) {
            throw new SourceError("invalid-response", "No images found in chapter page")
        }

        const { mangaSlug, chapterNumber, mangaTitle } = parseChapterSlug(chapterSlug)
        const now = context.now()
        const mangaId = `${SOURCE_ID}:manga:${mangaSlug}`
        const chapterId = `${SOURCE_ID}:chapter:${chapterSlug}`

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
            sourceMangaId: mangaSlug,
            url: `${ORIGIN}/comic/${mangaSlug}/`
        }

        const chapter: SourceChapter = {
            id: chapterId,
            mangaId,
            sourceId: SOURCE_ID,
            sourceChapterId: chapterSlug,
            title: `Chapter ${chapterNumber}`,
            url: input.url.toString(),
            sortKey: parseFloat(chapterNumber) || 0,
            language: "en"
        }

        const pages = imageUrls.map((url, i) => ({
            id: `${chapterId}:page:${i + 1}`,
            url
        }))

        context.logger.debug("Resolved Mgeko chapter", { chapterId, pageCount: pages.length })

        return { manga, chapter, pages }
    }
}
