# Changelog

All notable changes to this project will be documented in this file.

This file is designed to be parsed by [changelog-parser](https://www.npmjs.com/package/changelog-parser).
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The following sections are the standard sections to use, please stick with them for consistency

-   New Features
-   Changed Features
-   Removed Features
-   Bug Fixes
-   New Mirrors
-   Mirror Fixes
-   Disabled Mirrors
-   Notes - This is the catchall for anything that does not fit in the other sections.

## [4.0.4] - 2024-11-29

### New Mirrors

-   **Weeb Central**: Added new mirror to replace dead Manga4Life/MangaSee sites. Features search, chapter list, and image loading via HTMX-style API endpoints.

---

## [4.0.3] - 2024-11-29

### New Features

-   **Add by URL**: New feature to add manga from Cloudflare-protected sites by pasting the manga or chapter URL directly. Access via Import menu > "Add by URL". The extension auto-detects the mirror from the URL and fetches manga info.

---

## [4.0.2] - 2024-11-29

### Removed Features

-   **Legacy Mirror Code Cleanup**: Removed 17 unused legacy JavaScript implementation files (ComiCake, FoolSlide, FunMangaAbs, GenkanAbs, Madara, MangaStream_1_1_4Abs, MangakakalotAbs, MangastreamAbs, MyMangaReaderCMS, NextJs, ReadMangaAbs, PlatinumCrown, ShadowTrad, RizzScans, MangaDemon, EarlyManga, AstraScans)

### Mirror Fixes

-   **GD Scans**: Fixed chapter dropdown not populating - switched to modern `/ajax/chapters/` endpoint
-   **UToon**: Fixed chapter dropdown - removed restrictive `:contains('Chapter')` selector that was filtering out chapters
-   **Manhwa Top**: Fixed chapter dropdown not populating - switched to modern `/ajax/chapters/` endpoint

---

## [4.0.1] - 2024-11-29

### New Features

-   **Quick Category Button**: Added a folder icon button directly in the manga action buttons row for one-click category assignment (no longer need to expand options first)

### Bug Fixes

-   **Notification Click**: Fixed clicking desktop notifications not opening the chapter - now falls back to manga page if chapter URL unavailable

---

## [4.0.0] - 2024-11-29

### 🎉 ALL MANGAS READER 4.0 - The Revival

A complete overhaul of All Mangas Reader. This release represents a major cleanup and modernization effort, removing dead sites and fixing broken readers to deliver a lean, working extension.

### Bug Fixes

-   **Database Persistence**: Fixed Vue 3 Proxy objects causing DataCloneError in IndexedDB - mangas now persist correctly
-   **BroadcastChannel**: Fixed "Proxy object could not be cloned" error when syncing Vuex mutations
-   **Promise Handling**: Fixed typo `(resolve, result)` → `(resolve, reject)` in 9 Promise constructors in storedb.js
-   **Protocol-relative URLs**: Fixed image URLs starting with `//` not loading in extension context (MangaHere, FanFox)

### Mirror Fixes

-   **MangaHere/FanFox**: Fixed dm5_key extraction from packed JavaScript, added request queue to prevent rate limiting
-   **Batoto**: Added battwo.com domain, updated chapter selectors, improved batoPass deobfuscation with Infinity trick handling
-   **MangaPark**: Fixed chapter_url regex to match new URL format (`/title/.../ID-chapter-...` instead of `/title/.../ID-ch-...`)
-   **MangaReaderTo**: Improved reading ID extraction with multiple fallback methods
-   **Dm5**: Implemented chapterfun.ashx API with p,a,c,k,e,d JavaScript unpacking for image loading
-   **FMTeam**: Fixed http→https protocol and null check for chapter page detection
-   **MangaHub**: Marked as Cloudflare-protected (reader works when visiting site directly)

### Disabled Mirrors

The following mirrors have been marked as search-disabled due to Cloudflare protection (reader still works):

-   Dragon Tea, Webtoon.xyz, ManhwaHentai, Kun Manga, ManhuaFast, Manytoon, Setsu Scans, Manhuaus
-   Kiryuu, Scantrad Union, Manhwa18.com, MangaKawaii, Like Manga, Sad Scans

### Removed Features

Removed ~70 dead mirror implementations that are no longer online:

-   **Madara-based (35)**: MangaKomi, 247Manga, AstralLibrary, ChibiManga, ComicKiba, ImmortaUpdates, IsekaiScans, LeviatanScans, LilyManga, Manga347, MangaCultivator, MangaGreat, MangaSy, MangazukiMe, Manhuas, MixedManga, MMScans, RandomTrans, ResetScans, Sawamics, SKScans, TopManhua, TritiniaScans, TwilightScans, UltManga, UnemployedScans, ComicDom, Manga1stOnline, GourmetScans, ShadowTrad, DarkScan, CreepyScans, HariManga, NightComic, Mangalek, PlatinumCrown, MangaBob
-   **MangaStream-based (6)**: Komikstation, Ngomik, Westmanga, Komikav, Komicast, ReaperScans
-   **FoolSlide-based (1)**: EvilFlowers
-   **MyMangaReaderCMS (2)**: Komikid, ScanFR
-   **Standalone (20)**: FunManga, ReadMNG, Manga4Life, MangaSee, ScyllaScans, DisasterScans, ZaHardTop, UnionLeitor, SeriManga, ReadM, ManhwaFreak, MangaDemon, MangaHasu, MangaFreak, MangaAlArab, LugnicaScan, EpsilonScan, BananaScan, FanComics, MangaBTT

### Notes

-   Total active mirrors reduced from ~120 to ~50
-   Confirmed working mirrors: MangaDex, MangaBuddy, ManhuaPlus, Asura Scans, MangaHere, FanFox, Dynasty Scans, and more
-   Users can still add manga from Cloudflare-blocked sites by visiting the site directly in browser

---

## [3.1.0] - 2024-11-26

### 🚀 MAJOR VERSION: Complete Modernization

This release represents a complete modernization of All Mangas Reader, bringing the codebase up to current web standards.

### New Features

-   **Vue 3**: Complete migration from Vue 2.7 to Vue 3.5 with Composition API support
-   **Vuetify 3**: Full migration from Vuetify 2 to Vuetify 3.8 with Material Design 3
-   **TypeScript**: Key modules converted to TypeScript for better type safety
-   **Testing**: Added Vitest testing framework with 28+ unit tests
-   **CI/CD**: Added GitHub Actions for automated testing and releases
-   **MDI SVG Icons**: Icons now use SVG paths (no external font loading required)

### Changed Features

-   **Webpack 5**: Updated build system with better tree-shaking and performance
-   **Code Splitting**: Large monolithic files split into focused modules
    -   `mangas.js` (1338 lines) → 11 focused modules
    -   `sync-manager.js` (502 lines) → 3 modules
    -   Extracted keyboard shortcuts helper from AmrReader.vue
-   **Vue 3 Syntax**: Updated all components for Vue 3 compatibility
    -   `beforeDestroy` → `beforeUnmount`
    -   `slot-scope` → `v-slot`
    -   EventBus using `mitt` library
-   **Vuetify 3 Syntax**: Updated all Vuetify components
    -   `v-on="on"` → `v-bind="props"` for activator slots
    -   `dense` → `density="compact"`
    -   Updated color class syntax

### Bug Fixes

-   Fixed `newManga` variable used before declaration in mangas.js
-   Fixed undefined `reject` in storedb.js
-   Fixed memory leaks (missing clearInterval, removeEventListener)
-   Fixed Vue 3 reactivity issues in reader state objects
-   Fixed thin scan dialog being removed by DOM cleanup

### Notes

-   Node.js 18+ or 20+ required (dropped support for Node 14/16)
-   If upgrading from V2: Export data first, install V3, then import
-   Original V2 repository: https://github.com/alysson-souza/all-mangas-reader-2

---

## [3.0.3] - 2024-08-25

### Bug Fixes

-   Fixed an issue with search bar having a white background when in dark mode

### Mirror Fixes

-   Reset Scans - New domain
-   Manga Reader - Disabled non english chapters from getting picked up for now because it breaks the chapter list
-   Asura Comics - A bunch of changes to site design and url scheme
-   Luminous Scans - New domain
-   Read Comic Online - Fix for image loading (Credit @Jay)
-   Reaper Scans - New website, looks like this might actually work now o.o
-   Fan Comics - New domain
-   Night Scans - New domain

### New Mirrors

-   UToon - https://utoon.net/
-   Drake Comic - https://drakecomic.com/
-   Cypher Scans - https://cypherscans.xyz/

### New Features

-   I have added an experimental way to support novels by faking images to Reaper Scans. This is a test to see if I can do this without rewriting many parts of the extension to support text. This is best used in webtoon mode and I may look into ways to force it for these. For anyone interested try it out and give me feedback on discord as I fine tune this.

### Notes

-   I have finally gotten around to working on the website. Currently I just copy/pasted the orignal website but I plan on working on it more later to change it. I adjusted the links in amr for my server
-   I created a patreon and adjusted the links, I put this off for a long time but decided to end up doing it after all. My commitment to mainting this stays the same no matter the result of this as I use this extension extensively myself so keeping it maintained is also for my own use

## [3.0.2] - 2024-07-12

### New Features

-   Added a simple server and mirror for testing various different errors on so we can control when they happen and work on notifications/fixes for common problems

### Changed Features

-   I have re-enabled the error icons for series that have errors, and started added some different error messages in to identify the issue. More error codes will follow

### Mirror Fixes

-   Manga Galaxy - Fixed issue with single digit chapters
-   Reset Scans - New domain
-   Flame Scans - New domain
-   Nice Oppai - Changed language to Thai instead of english
-   FM Team - Change language to French instead of english
-   Manga Freak - Changed domains, possible issue with cloudflare
-   Read Comic Online - Changed image encryption and fix for alternative image source (Credit @jaygitsby)
-   Manga Hasu - New domain
-   Surya Toon - Extra chapter being picked up
-   Many Toon - Changed image source
-   Manhwa Freak - New domain. The old one still works but they will be shutting it down so migration to the new site is advised
-   Read Comic Online - Fixed an issue recognizing chapter pages
-   HyperDex - New domain

### New Mirrors

-   Fire Scans - https://firescans.xyz/

## Disabled Mirrors

-   Toonily.Net
-   Leveler Scans
-   Manga 1st - Warnings from both uBlock and antivirus software about this site, will not bypass to check if it is still active and I advise no one to read from it
-   Manga Dods
-   Manga Lab - Warning about expired security certificate
-   Read Manhua
-   Alpha Scans - Warning from vpn about security certificate validation
-   Cosmic Scans - The website says they are closed

## [3.0.1] - 2024-05-26

### Mirror Fixes

-   Toonily.com - Fixed image loading

### New_Mirrors

-   Manga Park - https://mangapark.net
-   Manga Reader.to - https://mangareader.to/home
-   Fan Comics - https://www.mgeko.com
-   Manga BTT - https://manhwabtt.com
-   Manga Budddy - https://mangabuddy.com/home

## [3.0.0] - 2024-05-19

### Notes

-   The extension has been rewritten to be compatible with manifest V3, this was a major overhaul that has been going on for a while. Unfortunately that means getting a complete changelog is going to be near impossible but I will try to get as many as I can included in this

### New Features

-   A log for gist sync errors has been added

### Removed Features

-   Removed error marking for fetching series list, will enable when bugs are worked out

### New Mirrors

-   Like Manga - https://likemanga.io
-   Surya Toon - https://suryatoon.com
-   Dark Scan - https://dark-scan.com/
-   Creepy Scans - https://creepyscans.com/
-   Hari Manga - https://harimanga.com
-   Manga Galaxy - https://mangagalaxy.me
-   SeiManga - https://seimanga.me
-   Reaper Scans (Fake) - https://reaper-scans.com
-   Animated Glitched Comics - https://agscomics.com

### Mirror Fixes

-   Asura - Domain changed
-   Scylla Scans - Changed website
-   Immortal Updates - Domain changed
-   Manga Clash - Domain changed
-   Top Manhua - Domain changed
-   Luminous Scans - Domain changed
-   Rizz Comics - Domain changed
-   Manhwa Freak - Domain changed
-   Immortal Updates - Domain changed
-   Manga Clash - Domain changed
-   Top Manhua - Domain changed
-   Void Scans - Domain changed
-   Reset Scans - Domain changed
-   Zero Scans - Domain changed
-   Manga Hub - Api added for fetching images
-   Mint Manga - Fix getting chapter urls
-   Read M - Domain changed
-   Disaster Scans - Domain changed
-   Night Scans - Domain changed
-   Manga Fox - Random image failure fixes
