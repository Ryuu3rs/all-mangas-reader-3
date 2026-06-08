export type MangaId = string
export type ChapterId = string

export type MangaRecord = {
    id: MangaId
    title: string
    normalizedTitle: string
    coverUrl?: string
    addedAt: number
    updatedAt: number
}

export type ChapterRecord = {
    id: ChapterId
    mangaId: MangaId
    sourceId: string
    title: string
    url: string
    sortKey: number
}

export type ReadingProgress = {
    mangaId: MangaId
    chapterId: ChapterId
    pageIndex: number
    pageCount: number
    completed: boolean
    updatedAt: number
}
