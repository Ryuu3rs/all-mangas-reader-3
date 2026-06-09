import type { ReadingProgress } from "@amr/contracts"
import { db, saveProgress, saveResolvedChapter } from "../src/database"
import { runtimeRequestSchema, type RuntimeResponse } from "../src/runtime"
import { getSettings, updateSettings } from "../src/settings"
import { findSource, resolveChapterUrl } from "../src/sources"

function success<T>(data: T): RuntimeResponse<T> {
    return { ok: true, data }
}

function failure(error: unknown): RuntimeResponse {
    return {
        ok: false,
        error: {
            code: "REQUEST_FAILED",
            message: error instanceof Error ? error.message : "The request failed"
        }
    }
}

async function captureChapter(url: string) {
    const settings = await getSettings()
    const parsedUrl = new URL(url)
    const source = findSource(parsedUrl)

    if (!source || source.match(parsedUrl) !== "chapter") {
        return { supported: false as const }
    }

    if (!settings.autoAdd) {
        return { supported: true as const, added: false as const }
    }

    const resolved = await resolveChapterUrl(url)
    await saveResolvedChapter({
        manga: resolved.manga.manga,
        chapter: resolved.chapter,
        sourceUrl: resolved.chapter.url
    })

    await browser.action.setBadgeBackgroundColor({ color: "#2d8a61" })
    await browser.action.setBadgeText({ text: "ADD" })
    setTimeout(() => void browser.action.setBadgeText({ text: "" }), 4000)

    return { supported: true as const, added: true as const, manga: resolved.manga.manga }
}

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(() => {
        void getSettings()
    })

    browser.tabs.onUpdated.addListener((_tabId, changeInfo) => {
        if (!changeInfo.url) return
        void captureChapter(changeInfo.url).catch(error => {
            console.warn("[AMR] Automatic chapter capture failed", error)
        })
    })

    browser.runtime.onMessage.addListener((message, sender) => {
        return (async () => {
            try {
                const request = runtimeRequestSchema.parse(message)

                switch (request.type) {
                    case "library:list":
                        return success(await db.manga.orderBy("updatedAt").reverse().toArray())
                    case "library:remove":
                        await db.transaction("rw", db.manga, db.chapters, db.progress, async () => {
                            await db.manga.delete(request.mangaId)
                            await db.chapters.where("mangaId").equals(request.mangaId).delete()
                            await db.progress.where("mangaId").equals(request.mangaId).delete()
                        })
                        return success(null)
                    case "page:current": {
                        const tab = sender.tab ?? (await browser.tabs.query({ active: true, currentWindow: true }))[0]
                        const url = tab?.url
                        if (!url) return success({ supported: false })
                        const parsedUrl = new URL(url)
                        const source = findSource(parsedUrl)
                        return success({
                            supported: Boolean(source),
                            pageType: source?.match(parsedUrl) ?? "none",
                            url
                        })
                    }
                    case "page:capture":
                        return success(await captureChapter(request.url))
                    case "reader:resolve":
                        return success(await resolveChapterUrl(request.url))
                    case "reader:progress:get":
                        return success((await db.progress.get(request.chapterId)) ?? null)
                    case "reader:progress": {
                        const progress: ReadingProgress = {
                            mangaId: request.mangaId,
                            chapterId: request.chapterId,
                            pageIndex: request.pageIndex,
                            pageCount: request.pageCount,
                            completed: request.completed,
                            updatedAt: Date.now()
                        }
                        await saveProgress(progress)
                        return success(progress)
                    }
                    case "settings:get":
                        return success(await getSettings())
                    case "settings:update":
                        return success(
                            await updateSettings(
                                Object.fromEntries(
                                    Object.entries(request.settings).filter(([, value]) => value !== undefined)
                                ) as Partial<Awaited<ReturnType<typeof getSettings>>>
                            )
                        )
                }
            } catch (error) {
                return failure(error)
            }
        })()
    })
})
