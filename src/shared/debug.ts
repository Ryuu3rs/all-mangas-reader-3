/**
 * Debug utility for AMR
 *
 * To enable debug logging:
 * - Set DEBUG_ENABLED to true below
 * - Or call window.AMR_DEBUG = true in browser console
 * - Or add ?debug=true to the URL
 */

// Extend Window interface for debug globals
declare global {
    interface Window {
        AMR_DEBUG?: boolean
        enableAMRDebug?: () => void
        disableAMRDebug?: () => void
    }
}

// Default debug state - set to true to enable debug logging
const DEBUG_ENABLED = false

/**
 * Check if debug mode is enabled
 * Checks multiple sources: file constant, window global, URL param
 */
function isDebugEnabled(): boolean {
    // Check file constant first
    if (DEBUG_ENABLED) return true

    // Check window global (can be set from browser console)
    if (typeof window !== "undefined" && window.AMR_DEBUG) return true

    // Check URL parameter
    if (typeof window !== "undefined" && window.location) {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get("debug") === "true") return true
    }

    return false
}

/**
 * Debug log - only logs if debug mode is enabled
 * @param args - Arguments to pass to console.log
 */
export function debugLog(...args: unknown[]): void {
    if (isDebugEnabled()) {
        console.log("[DEBUG]", ...args)
    }
}

/**
 * Debug warn - only logs if debug mode is enabled
 * @param args - Arguments to pass to console.warn
 */
export function debugWarn(...args: unknown[]): void {
    if (isDebugEnabled()) {
        console.warn("[DEBUG]", ...args)
    }
}

/**
 * Debug error - only logs if debug mode is enabled
 * @param args - Arguments to pass to console.error
 */
export function debugError(...args: unknown[]): void {
    if (isDebugEnabled()) {
        console.error("[DEBUG]", ...args)
    }
}

/**
 * Enable debug mode at runtime
 * Call this from browser console: enableAMRDebug()
 */
export function enableAMRDebug(): void {
    if (typeof window !== "undefined") {
        window.AMR_DEBUG = true
        console.log("[DEBUG] Debug mode enabled")
    }
}

/**
 * Disable debug mode at runtime
 * Call this from browser console: disableAMRDebug()
 */
export function disableAMRDebug(): void {
    if (typeof window !== "undefined") {
        window.AMR_DEBUG = false
        console.log("[DEBUG] Debug mode disabled")
    }
}

// Expose functions globally for console access
if (typeof window !== "undefined") {
    window.enableAMRDebug = enableAMRDebug
    window.disableAMRDebug = disableAMRDebug
}

export default {
    log: debugLog,
    warn: debugWarn,
    error: debugError,
    enable: enableAMRDebug,
    disable: disableAMRDebug,
    isEnabled: isDebugEnabled
}
