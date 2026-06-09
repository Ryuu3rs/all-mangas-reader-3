import type { SourceLinkRecord } from "@amr/contracts"
import { createBoundedRequestClient, type SourceContext, type SourceManga } from "@amr/source-sdk"
import { sourceAdapters } from "@amr/sources"
import type { LibraryManga } from "./database"

export function findSource(url: URL) {
    return sourceAdapters.find(adapter => adapter.match(url) !== "none")
}

function createSourceContext(): SourceContext {
    const request = createBoundedRequestClient({
        fetch: (requestUrl, init) => fetch(requestUrl, init),
        allowedOrigins: ["https://api.mangadex.org"],
        maxRequests: 10,
        maxResponseBytes: 10 * 1024 * 1024,
        timeoutMs: 20_000
    })
    return {
        request,
        now: () => Date.now(),
        logger: {
            debug: (message, details) => console.debug(`[AMR source] ${message}`, details),
            warn: (message, details) => console.warn(`[AMR source] ${message}`, details)
        }
    }
}

export async function resolveChapterUrl(url: string) {
    const parsedUrl = new URL(url)
    const source = findSource(parsedUrl)

    if (!source || source.match(parsedUrl) !== "chapter") {
        throw new Error("This chapter is not supported")
    }

    return source.resolveChapter({ url: parsedUrl }, createSourceContext())
}

export async function listMangaChapters(manga: LibraryManga, link: SourceLinkRecord) {
    const source = sourceAdapters.find(adapter => adapter.manifest.id === link.sourceId)
    if (!source || !link.sourceMangaId) throw new Error("The source link cannot be refreshed")
    const sourceManga: SourceManga = {
        manga,
        sourceId: link.sourceId,
        sourceMangaId: link.sourceMangaId,
        url: link.url
    }
    return source.listChapters(
        {
            manga: sourceManga,
            languages: link.language ? [link.language] : ["en"],
            limit: 500
        },
        createSourceContext()
    )
}
