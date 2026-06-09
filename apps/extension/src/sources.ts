import { createBoundedRequestClient, type SourceContext } from "@amr/source-sdk"
import { sourceAdapters } from "@amr/sources"

export function findSource(url: URL) {
    return sourceAdapters.find(adapter => adapter.match(url) !== "none")
}

export async function resolveChapterUrl(url: string) {
    const parsedUrl = new URL(url)
    const source = findSource(parsedUrl)

    if (!source || source.match(parsedUrl) !== "chapter" || !("resolveChapter" in source)) {
        throw new Error("This chapter is not supported")
    }

    const request = createBoundedRequestClient({
        fetch: (requestUrl, init) => fetch(requestUrl, init),
        allowedOrigins: ["https://api.mangadex.org"],
        maxRequests: 10,
        maxResponseBytes: 10 * 1024 * 1024,
        timeoutMs: 20_000
    })
    const context: SourceContext = {
        request,
        now: () => Date.now(),
        logger: {
            debug: (message, details) => console.debug(`[AMR source] ${message}`, details),
            warn: (message, details) => console.warn(`[AMR source] ${message}`, details)
        }
    }

    return source.resolveChapter({ url: parsedUrl }, context)
}
