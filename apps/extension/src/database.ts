import type { ChapterRecord, MangaRecord, ReadingProgress } from "@amr/contracts"
import Dexie, { type EntityTable } from "dexie"

export type LibraryManga = MangaRecord & {
    sourceId: string
    sourceUrl: string
    latestChapterId?: string
    lastReadChapterId?: string
}

export class AmrDatabase extends Dexie {
    manga!: EntityTable<LibraryManga, "id">
    chapters!: EntityTable<ChapterRecord, "id">
    progress!: EntityTable<ReadingProgress, "chapterId">

    constructor() {
        super("all-mangas-reader")
        this.version(1).stores({
            manga: "id, normalizedTitle, sourceId, addedAt, updatedAt",
            chapters: "id, mangaId, sourceId, sortKey",
            progress: "chapterId, mangaId, updatedAt, completed"
        })
    }
}

export const db = new AmrDatabase()

export async function saveResolvedChapter(input: {
    manga: MangaRecord
    chapter: ChapterRecord
    sourceUrl: string
}): Promise<void> {
    await db.transaction("rw", db.manga, db.chapters, async () => {
        const existing = await db.manga.get(input.manga.id)
        const manga: LibraryManga = {
            ...input.manga,
            sourceId: input.chapter.sourceId,
            sourceUrl: input.sourceUrl,
            latestChapterId: input.chapter.id,
            ...(existing?.lastReadChapterId ? { lastReadChapterId: existing.lastReadChapterId } : {})
        }
        await db.manga.put(manga)
        await db.chapters.put(input.chapter)
    })
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
    await db.transaction("rw", db.progress, db.manga, async () => {
        await db.progress.put(progress)
        await db.manga.update(progress.mangaId, {
            lastReadChapterId: progress.chapterId,
            updatedAt: progress.updatedAt
        })
    })
}
