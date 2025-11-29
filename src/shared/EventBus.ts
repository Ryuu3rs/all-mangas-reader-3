/**
 * Shared EventBus singleton using mitt (Vue 3 compatible)
 *
 * This module provides a centralized event bus that can be used across
 * all contexts: popup, dashboard, reader, and components.
 *
 * Events used:
 * - multi-manga:select-manga, multi-manga:deselect-manga - Multi-selection
 * - multi-manga:show-multiselect, multi-manga:hide-multiselect - UI state
 * - multi-manga:select-all, multi-manga:select-unread, multi-manga:deselect-all
 * - multi-manga:open-latest:{key}, multi-manga:open-first-new:{key}
 * - multi-manga:refresh:{key}
 * - show-snackbar - Display snackbar messages
 * - open-bookmarks - Reader: open bookmarks popup
 * - thin-scan - Reader: thin scan detected
 * - go-next-chapter, go-previous-chapter - Reader navigation
 * - temporary-dialog - Reader: display temporary message
 * - pages-loaded, chapter-loaded, loaded-scan - Reader loading states
 * - go-to-scanurl - Reader: navigate to specific scan
 * - check-viewport - Reader: check visible pages
 * - offset-book - Reader: offset book mode first page
 */
import mitt, { Emitter, Handler } from "mitt"

// Define event types for better type safety
export type EventBusEvents = {
    // Multi-manga selection events
    "multi-manga:select-manga": string
    "multi-manga:deselect-manga": string
    "multi-manga:show-multiselect": void
    "multi-manga:hide-multiselect": void
    "multi-manga:select-all": void
    "multi-manga:select-unread": void
    "multi-manga:deselect-all": void
    // Snackbar
    "show-snackbar": { text: string; color?: string }
    // Reader events
    "open-bookmarks": unknown
    "thin-scan": unknown
    "go-next-chapter": unknown
    "go-previous-chapter": unknown
    "temporary-dialog": { message: string; duration: number }
    "pages-loaded": unknown
    "chapter-loaded": unknown
    "loaded-scan": unknown
    "go-to-scanurl": string
    "check-viewport": void
    "offset-book": unknown
    // Dynamic events (multi-manga with key suffix)
    [key: `multi-manga:open-latest:${string}`]: void
    [key: `multi-manga:open-first-new:${string}`]: void
    [key: `multi-manga:refresh:${string}`]: void
}

// Create the mitt emitter with typed events
const emitter: Emitter<EventBusEvents> = mitt<EventBusEvents>()

/**
 * EventBus interface with Vue 2 compatible API ($on, $off, $emit)
 * and direct mitt methods (on, off, emit)
 */
export interface IEventBus {
    // Vue 2 compatible API (for backwards compatibility)
    $on: <K extends keyof EventBusEvents>(event: K, handler: Handler<EventBusEvents[K]>) => void
    $off: <K extends keyof EventBusEvents>(event: K, handler?: Handler<EventBusEvents[K]>) => void
    $emit: <K extends keyof EventBusEvents>(
        event: K,
        ...args: EventBusEvents[K] extends void ? [] : [EventBusEvents[K]]
    ) => void
    // Direct mitt methods
    on: <K extends keyof EventBusEvents>(event: K, handler: Handler<EventBusEvents[K]>) => void
    off: <K extends keyof EventBusEvents>(event: K, handler?: Handler<EventBusEvents[K]>) => void
    emit: <K extends keyof EventBusEvents>(event: K, payload?: EventBusEvents[K]) => void
    // Access to all handlers
    all: Emitter<EventBusEvents>["all"]
}

/**
 * Shared EventBus singleton
 *
 * Usage:
 * ```typescript
 * import EventBus from "@/shared/EventBus"
 *
 * // Subscribe to events
 * EventBus.$on("show-snackbar", (payload) => { ... })
 *
 * // Emit events
 * EventBus.$emit("show-snackbar", { text: "Hello", color: "success" })
 * ```
 */
const EventBus: IEventBus = {
    // Vue 2 compatible API
    $on: (event, handler) => emitter.on(event, handler),
    $off: (event, handler) => emitter.off(event, handler),
    $emit: (event, ...args) => {
        const payload = args.length === 1 ? args[0] : args.length === 0 ? undefined : args
        emitter.emit(event, payload as never)
    },

    // Direct mitt methods
    on: (event, handler) => emitter.on(event, handler),
    off: (event, handler) => emitter.off(event, handler),
    emit: (event, payload) => emitter.emit(event, payload as never),

    // Access to all handlers (for debugging)
    all: emitter.all
}

export default EventBus

/**
 * Helper to create Vue plugin for EventBus
 * Provides $eventBus on globalProperties
 */
export function createEventBusPlugin() {
    return {
        install(app: { config: { globalProperties: Record<string, unknown> } }) {
            app.config.globalProperties.$eventBus = EventBus
        }
    }
}
