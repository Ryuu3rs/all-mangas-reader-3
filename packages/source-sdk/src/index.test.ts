import { describe, expect, it } from "vitest"
import { matchesSourceDomain } from "./index"

describe("matchesSourceDomain", () => {
    it("matches exact domains without matching lookalikes", () => {
        expect(matchesSourceDomain("mangadex.org", ["mangadex.org"])).toBe(true)
        expect(matchesSourceDomain("fake-mangadex.org", ["mangadex.org"])).toBe(false)
    })

    it("matches wildcard subdomains but not the apex domain", () => {
        expect(matchesSourceDomain("uploads.mangadex.org", ["*.mangadex.org"])).toBe(true)
        expect(matchesSourceDomain("mangadex.org", ["*.mangadex.org"])).toBe(false)
    })

    it("normalizes case and a trailing dot", () => {
        expect(matchesSourceDomain("API.MANGADEX.ORG.", ["api.mangadex.org"])).toBe(true)
    })
})
