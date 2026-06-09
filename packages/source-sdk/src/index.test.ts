import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
    SourceError,
    SourceRegistry,
    createBoundedRequestClient,
    matchesSourceDomain,
    type SourceAdapter
} from "./index"

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

describe("createBoundedRequestClient", () => {
    it("validates JSON and enforces the request limit", async () => {
        const client = createBoundedRequestClient({
            fetch: async () => ({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ value: 7 })
            }),
            allowedOrigins: ["https://api.example.test"],
            maxRequests: 1,
            maxResponseBytes: 100,
            timeoutMs: 100
        })

        await expect(
            client.getJson(new URL("https://api.example.test/value"), z.object({ value: z.number() }))
        ).resolves.toEqual({ value: 7 })
        await expect(
            client.getJson(new URL("https://api.example.test/value"), z.object({ value: z.number() }))
        ).rejects.toMatchObject({ code: "request-limit" })
    })

    it("rejects unexpected origins and invalid payloads", async () => {
        const client = createBoundedRequestClient({
            fetch: async () => ({ ok: true, status: 200, text: async () => "{}" }),
            allowedOrigins: ["https://api.example.test"],
            maxRequests: 2,
            maxResponseBytes: 100,
            timeoutMs: 100
        })

        await expect(
            client.getJson(new URL("https://other.test/value"), z.object({ value: z.number() }))
        ).rejects.toBeInstanceOf(SourceError)
        await expect(
            client.getJson(new URL("https://api.example.test/value"), z.object({ value: z.number() }))
        ).rejects.toMatchObject({ code: "invalid-response" })
    })
})

describe("SourceRegistry", () => {
    const adapter = {
        manifest: {
            id: "test",
            name: "Test",
            domains: ["example.test"],
            languages: ["en"],
            capabilities: ["manga", "chapters", "pages"],
            requestRateLimit: { requests: 1, intervalMs: 1000 },
            fixtureVersion: 1
        },
        match: (url: URL) => (url.hostname === "example.test" ? "manga" : "none")
    } as SourceAdapter

    it("registers and matches adapters deterministically", () => {
        const registry = new SourceRegistry([adapter])

        expect(registry.get("test")).toBe(adapter)
        expect(registry.match(new URL("https://example.test/title/1"))).toBe(adapter)
        expect(registry.list()).toEqual([adapter])
    })

    it("rejects duplicate source IDs", () => {
        expect(() => new SourceRegistry([adapter, adapter])).toThrow("Source is already registered")
    })
})
