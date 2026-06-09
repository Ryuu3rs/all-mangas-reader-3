import { defineConfig } from "wxt"

export default defineConfig({
    manifestVersion: 3,
    modules: ["@wxt-dev/module-svelte"],
    manifest: ({ browser }) => ({
        name: "All Mangas Reader",
        description: "Read and track manga from supported websites.",
        permissions: ["alarms", "scripting", "storage", "tabs"],
        optional_host_permissions: [
            "https://mangadex.org/*",
            "https://api.mangadex.org/*",
            "https://uploads.mangadex.org/*"
        ],
        icons: {
            32: "/icons/icon_32.png",
            48: "/icons/icon_48.png",
            96: "/icons/icon_96.png",
            128: "/icons/icon_128.png"
        },
        browser_specific_settings:
            browser === "firefox"
                ? {
                      gecko: {
                          id: "all-mangas-reader@ryuu3rs.dev",
                          strict_min_version: "140.0",
                          data_collection_permissions: {
                              required: ["none"]
                          }
                      }
                  }
                : undefined
    })
})
