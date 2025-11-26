/**
 * Event bus using mitt (Vue 3 compatible)
 * Used for :
 *  - This way, we can open Bookmarks Popup from other components without including it in template
 *  - Detect and propagate thin scan (height > 3 * width)
 *  - Go to next / previous chapter
 *  - Display a temporary message
 *  - Notify chapter finished loading
 */
import mitt from "mitt"

const emitter = mitt()

// Create a Vue-compatible API wrapper for backwards compatibility
const EventBus = {
    $on: (event, handler) => emitter.on(event, handler),
    $off: (event, handler) => emitter.off(event, handler),
    $emit: (event, ...args) => emitter.emit(event, args.length === 1 ? args[0] : args),
    // For direct access to mitt methods
    on: (event, handler) => emitter.on(event, handler),
    off: (event, handler) => emitter.off(event, handler),
    emit: (event, payload) => emitter.emit(event, payload),
    all: emitter.all
}

export default EventBus
