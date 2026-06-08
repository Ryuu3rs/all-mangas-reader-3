import type { ChapterRecord, MangaRecord } from "@amr/contracts"

export type SourcePageMatch = "chapter" | "manga" | "none"

export type SourceManifest = {
    id: string
    name: string
    domains: string[]
    languages: string[]
}

export type ResolvedPage = {
    id: string
    url: string
}

export type ResolvedChapter = {
    manga: MangaRecord
    chapter: ChapterRecord
    pages: ResolvedPage[]
}

export interface SourceAdapter {
    readonly manifest: SourceManifest
    match(url: URL): SourcePageMatch
}

export function matchesSourceDomain(hostname: string, domains: readonly string[]): boolean {
    const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "")

    return domains.some(domain => {
        const normalizedDomain = domain.toLowerCase().replace(/\.$/, "")

        if (normalizedDomain.startsWith("*.")) {
            return normalizedHostname.endsWith(`.${normalizedDomain.slice(2)}`)
        }

        return normalizedHostname === normalizedDomain
    })
}
