import { SourceRegistry, type SourceAdapter } from "@amr/source-sdk"
import { mangadexAdapter } from "./mangadex"

export { mangadexAdapter } from "./mangadex"

export const sourceAdapters: readonly SourceAdapter[] = [mangadexAdapter]
export const sourceRegistry = new SourceRegistry(sourceAdapters)
