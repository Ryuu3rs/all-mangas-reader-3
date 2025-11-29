# ![](src/icons/icon_32.png) All Mangas Reader V3

[![Build Status](https://github.com/Ryuu3rs/all-mangas-reader-3/actions/workflows/ci.yml/badge.svg)](https://github.com/Ryuu3rs/all-mangas-reader-3/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A modernized browser extension for reading manga from various online sources. This is a complete modernization of All Mangas Reader, upgraded to modern web technologies (Vue 3, Vuetify 3, TypeScript).

---

## 🗺️ Roadmap - Dashboard Redesign

The following features are planned to transform the manga list into a comprehensive dashboard experience.

### Phase 1: Performance Foundation (Critical Priority) 🔴

| Status | Feature                      | Description                                          |
| ------ | ---------------------------- | ---------------------------------------------------- |
| [ ]    | Virtual Scrolling            | Implement vue-virtual-scroller for 1000+ manga lists |
| [ ]    | Lazy Load Chapters           | Load chapter lists on-demand, not at startup         |
| [ ]    | Optimize Computed Properties | Memoize expensive filtering/sorting operations       |
| [ ]    | Skeleton Loading States      | Add loading placeholders for better UX               |
| [ ]    | Reduce RAM Usage             | Store only manga metadata initially                  |

### Phase 2: Navigation & Layout (High Priority) 🟡

| Status | Feature                  | Description                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------ |
| [ ]    | Dashboard Navigation Bar | Tab-based navigation (Library, Statistics, Achievements, Settings) |
| [ ]    | Collapsible Sidebar      | Quick stats, categories, and mirror filters                        |
| [ ]    | Responsive Grid Layout   | Two-column layout for wider screens                                |
| [ ]    | Compact Mode Toggle      | High-density view for power users                                  |

### Phase 3: Statistics Dashboard (High Priority) 🟡

| Status | Feature                  | Description                                            |
| ------ | ------------------------ | ------------------------------------------------------ |
| [ ]    | Reading Time Tracking    | Track time spent reading (requires reader integration) |
| [ ]    | Statistics Visualization | Charts for reading patterns, chapters by mirror        |
| [ ]    | Reading History          | Detailed log of chapters read with timestamps          |
| [ ]    | Export Statistics        | JSON/CSV export of reading data                        |

### Phase 4: Achievements System (Medium Priority) 🟢

| Status | Feature                   | Description                                             |
| ------ | ------------------------- | ------------------------------------------------------- |
| [ ]    | Achievement Store Module  | Vuex module for achievement tracking                    |
| [ ]    | Achievement Definitions   | Milestones, streaks, exploration, dedication categories |
| [ ]    | Achievement Progress UI   | Cards showing progress toward locked achievements       |
| [ ]    | Achievement Notifications | Toast notifications when achievements unlock            |
| [ ]    | Achievement Export        | Export earned achievements to JSON                      |

### Phase 5: Polish & Additional Features (Low Priority) 🔵

| Status | Feature             | Description                                           |
| ------ | ------------------- | ----------------------------------------------------- |
| [ ]    | Keyboard Shortcuts  | j/k navigation, Enter to read, m to mark read         |
| [ ]    | Bulk Operations     | Multi-select for mark read, delete, categorize        |
| [ ]    | Reading Goals       | Weekly/monthly chapter targets with progress tracking |
| [ ]    | Smart Filters       | "Not read in 30 days", "New chapters", "Completed"    |
| [ ]    | Quick Actions Panel | Floating action button with common actions            |

---

## 🚀 What's New in V3

### Major Upgrades

| Component  | Before (V2) | After (V3)              |
| ---------- | ----------- | ----------------------- |
| Vue        | 2.7         | 3.5                     |
| Vuetify    | 2.7         | 3.8                     |
| TypeScript | Partial     | Key modules converted   |
| Webpack    | 4.x         | 5.103                   |
| Node.js    | 14+         | 20.x LTS                |
| Testing    | None        | Vitest + Vue Test Utils |
| CI/CD      | None        | GitHub Actions          |

### Code Quality Improvements

-   ✅ Split large monolithic files into focused modules
-   ✅ Added comprehensive test suite with Vitest
-   ✅ Fixed memory leaks and improved error handling
-   ✅ Enhanced security in mirror script parsing
-   ✅ Updated all dependencies to latest stable versions
-   ✅ Proper Vue 3 reactivity with `reactive()` state objects
-   ✅ MDI SVG icons (no external font loading required)

### Reader Performance Optimizations (v3.1.1)

The manga reader has been extensively optimized for smooth scrolling and fast image loading, especially for long chapters with 50+ pages.

<details>
<summary>Click to expand optimization details</summary>

#### Performance Improvements Summary

| Issue                             | Fix                               | Files Modified                 | Est. Improvement       |
| --------------------------------- | --------------------------------- | ------------------------------ | ---------------------- |
| O(n) scan lookups on every render | URL Map for O(1) lookups          | `ScansProvider.js`, `Scan.vue` | 80% faster renders     |
| State saves on every scroll event | 500ms debounced saves             | `Reader.vue`                   | 90% fewer messages     |
| 50+ individual scroll listeners   | Single throttled (60fps) listener | `Reader.vue`, `Page.vue`       | 98% fewer listeners    |
| Unnecessary DOM updates           | Skip if same image src            | `Scan.vue`                     | Reduced DOM churn      |
| 100+ simultaneous image requests  | Concurrency limit (6 parallel)    | `ScansProvider.js`             | Prevents overload      |
| No image load prioritization      | Priority queue (current ±2 first) | `ScansProvider.js`             | 70% faster first image |
| Duplicate bookmark lookups        | Combined computed property        | `Scan.vue`                     | 50% fewer lookups      |
| thumbnails() recreated on render  | Memoized computed property        | `ThumbnailNavigator.vue`       | Cached by Vue          |
| Debug logs in production          | Gated with NODE_ENV check         | `ChapterLoader.js`             | Cleaner console        |

#### Key Metrics

| Metric                                  | Before      | After           |
| --------------------------------------- | ----------- | --------------- |
| Scroll event handlers (50-page chapter) | 50+         | 1               |
| Concurrent image requests               | Unbounded   | 6               |
| Scan lookup complexity                  | O(n)        | O(1)            |
| State saves during scroll               | Every frame | Debounced 500ms |
| Time to first image                     | ~3-5s       | ~1s             |

</details>

---

## 📦 Installation

### Firefox (Recommended)

1. Download the latest release from [Releases](https://github.com/Ryuu3rs/all-mangas-reader-3/releases)
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon → "Install Add-on From File..."
4. Select the downloaded `.xpi` or `.zip` file

**For Development:**

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from the `dist` folder

### Chrome/Chromium

1. Download the latest release from [Releases](https://github.com/Ryuu3rs/all-mangas-reader-3/releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" and select the extracted `dist` folder

---

## 🛠️ Development

### Prerequisites

-   Node.js 20.x LTS (recommended)
-   npm 10.x or higher

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Ryuu3rs/all-mangas-reader-3.git
cd all-mangas-reader-3

# Install dependencies
npm install

# Build for development
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

### Project Structure

```
src/
├── amr/              # Core AMR functionality
├── background/       # Background worker scripts
├── mirrors/          # Manga source implementations (100+)
├── pages/            # Extension pages (popup, options, etc.)
├── reader/           # Manga reader components
│   ├── components/   # Vue 3 components
│   ├── helpers/      # Utility functions (TypeScript)
│   └── state/        # Reactive state management
├── store/            # Vuex store modules (split & organized)
└── shared/           # Shared utilities
```

---

## 📋 Features

-   📚 **Read manga** from 100+ supported sources
-   🔖 **Bookmarks** - Save your favorite pages and chapters
-   📥 **Download** - Save chapters as ZIP files
-   🔄 **Sync** - Synchronize reading progress across devices
-   🌙 **Dark Mode** - Eye-friendly reading at night
-   ⌨️ **Keyboard Shortcuts** - Navigate with ease
-   📱 **Responsive** - Works on all screen sizes
-   🔧 **Customizable** - Extensive options for reading experience
-   📖 **Book Mode** - Two-page spread for traditional manga reading
-   🖼️ **Webtoon Mode** - Continuous scroll for vertical comics

---

## 🔄 Migration from V2

If you're upgrading from All Mangas Reader V2:

1. Export your data from V2 (Options → Import/Export → Export)
2. Install AMR3
3. Import your data (Options → Import/Export → Import)

Your reading lists, bookmarks, and settings will be preserved.

---

## 📊 Technical Changes (V2 → V3)

<details>
<summary>Click to expand detailed changelog</summary>

### Vue 3 Migration

-   Updated all components from Options API to Vue 3 compatible syntax
-   Replaced `beforeDestroy` with `beforeUnmount`
-   Updated slot syntax from `slot-scope` to `v-slot`
-   Replaced `Vue.set`/`Vue.delete` with vue-compat utilities
-   Updated EventBus from Vue instance to `mitt` library

### Vuetify 3 Migration

-   Updated all component props for Vuetify 3 API
-   `v-on="on"` → `v-bind="props"` for activator slots
-   `dense` → `density="compact"`
-   `text/outlined` → `variant="text/outlined"`
-   `small/large` → `size="small/large"`
-   Color classes: `red--text` → `text-red`, `grey darken-4` → `grey-darken-4`
-   MDI icons: `{{ icons.mdiXxx }}` → `:icon="icons.mdiXxx"` (SVG paths)

### Code Splitting

-   `mangas.js` (1338 lines) → 11 focused modules
-   `sync-manager.js` (502 lines) → 3 modules
-   `AmrReader.vue` → extracted keyboard shortcuts helper

### TypeScript

-   `mangas-constants.ts` - Type-safe constants
-   `sync-operations.ts` - Sync logic with interfaces
-   `keyboardShortcuts.ts` - Keyboard handling

### Testing

-   Vitest testing framework
-   Vue Test Utils for component testing
-   28+ unit tests for critical paths

### Security

-   Enhanced `getVariableFromScript` with input validation
-   Protection against regex injection
-   Proper error boundaries

### Performance

-   Fixed memory leaks (clearInterval, removeEventListener)
-   Optimized bundle with Webpack 5
-   Tree-shaking for smaller builds

</details>

---

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Submit issues through [GitHub Issues](https://github.com/Ryuu3rs/all-mangas-reader-3/issues).

⚠️ Developers working on mirror implementations **MUST** read [SITES_REQUIREMENTS.md](SITES_REQUIREMENTS.md)

---

## 📄 License

This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

-   Based on [All Mangas Reader V2](https://github.com/alysson-souza/all-mangas-reader-2) - modernized for Vue 3 & Vuetify 3
-   All contributors and manga source maintainers

---

## 🌐 Browser Compatibility

<table>
    <thead>
        <tr align="center">
            <th colspan="2"></th>
            <th colspan="1">Quantum</th>
            <th colspan="6">Chromium</th>
        </tr>
    </thead>
    <tbody>
    <tr align="center">
        <td colspan=2></td>
        <td>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="20" title="Firefox"/>
        </td>
        <td>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Chrome_icon_%28September_2014%29.svg/512px-Google_Chrome_icon_%28September_2014%29.svg.png" width="16" title="Chrome"/>
        </td>
        <td>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Opera_2015_icon.svg/200px-Opera_2015_icon.svg.png" width="16" title="Opera"/>
        </td>
        <td>
            <img src="https://upload.wikimedia.org/wikipedia/fr/2/20/Logo_Microsoft_Edge.png" width="16" title="Edge Chromium"/>
        </td>
        <td>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Brave_lion.png" width="18" title="Brave"/>
        </td>
        <td>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Vivaldi_web_browser_logo.svg/200px-Vivaldi_web_browser_logo.svg.png" width="16" title="Vivaldi"/>
        </td>
        <td>
            <img src="https://play-lh.googleusercontent.com/IpPy16lik1fLrJs0fkaFuKrUm6Hw9Q3KDa2gLbewoze0Ko39gEIOyDECYOZBFJLHGeo=s180-rw" width="16" title="Kiwi Browser"/>
    </tr>
    <tr colspan="2" align="center">
        <td colspan=2><b>Desktop</b></td>
        <td>✔️</td>
        <td>✔️</td>
        <td>✔️</td>
        <td>✔️</td>
        <td>✔️</td>
        <td>✔️</td>
        <td>❌</td>
    </tr>
    <tr colspan="2" align="center">
        <td colspan=2><b>Mobile</b></td>
        <td>✔️</td>
        <td>❌</td>
        <td>❌</td>
        <td>❌</td>
        <td>❌</td>
        <td>❌</td>
        <td>✔️</td>
    </tr>
    </tbody>
</table>

### Supported websites (~50 active mirrors)

<details>
    <summary>Click to unfold</summary>

**✅ Confirmed Working:**

-   MangaDex, MangaBuddy, ManhuaPlus, Asura Scans, MangaHere, FanFox, Dynasty Scans
-   Batoto, MangaPark, MangaReaderTo, Dm5, FMTeam, MangaKatana, MangaPill
-   NHentai, Niceoppai, ReadComicOnline, SubManga, WebToon, ZeroScans

**⚠️ Cloudflare-Protected (reader works, search disabled):**

-   Dragon Tea, Webtoon.xyz, ManhwaHentai, Kun Manga, ManhuaFast, Manytoon
-   Setsu Scans, Manhuaus, Kiryuu, Scantrad Union, Manhwa18.com, MangaKawaii
-   Like Manga, Sad Scans, MangaHub

**📦 Self-Hosted:**

-   Komga, Tachidesk

        <table>
            <tbody>
                <tr>
                    <td><img src="src/mirrors/icons/asurascans-optimized.png" width="16" title="Asura Scans"></td>
                    <td><img src="src/mirrors/icons/batoto-optimized.png" width="16" title="Batoto"></td>
                    <td><img src="src/mirrors/icons/dm5-optimized.png" width="16" title="DM5"></td>
                    <td><img src="src/mirrors/icons/dragon-tea-optimized.png" width="16" title="Dragon Tea"></td>
                    <td><img src="src/mirrors/icons/dynastyscans-optimized.png" width="16" title="Dynasty Scans"></td>
                    <td><img src="src/mirrors/icons/fm-team-optimized.png" width="16" title="FM Team"></td>
                    <td><img src="src/mirrors/icons/gd-scans-optimized.png" width="16" title="GD Scans"></td>
                    <td><img src="src/mirrors/icons/hiperdex-optimized.png" width="16" title="Hiperdex"></td>
                    <td><img src="src/mirrors/icons/kiryuu-optimized.png" width="16" title="Kiryuu"></td>
                    <td><img src="src/mirrors/icons/komga-optimized.png" width="16" title="Komga"></td>
                </tr>
                <tr>
                    <td><img src="src/mirrors/icons/komiku-optimized.png" width="16" title="Komiku"></td>
                    <td><img src="src/mirrors/icons/kun-manga-optimized.png" width="16" title="Kun Manga"></td>
                    <td><img src="src/mirrors/icons/lhtranslations-optimized.png" width="16" title="LHTranslations"></td>
                    <td><img src="src/mirrors/icons/like-manga-optimized.png" width="16" title="Like Manga"></td>
                    <td><img src="src/mirrors/icons/manga-clash-optimized.png" width="16" title="Manga Clash"></td>
                    <td><img src="src/mirrors/icons/mangabuddy-optimized.png" width="16" title="MangaBuddy"></td>
                    <td><img src="src/mirrors/icons/mangadex-optimized.png" width="16" title="MangaDex V5"></td>
                    <td><img src="src/mirrors/icons/mangafox-optimized.png" width="16" title="FanFox/MangaFox"></td>
                    <td><img src="src/mirrors/icons/mangahere-optimized.png" width="16" title="MangaHere"></td>
                    <td><img src="src/mirrors/icons/mangahub-optimized.png" width="16" title="MangaHub"></td>
                </tr>
                <tr>
                    <td><img src="src/mirrors/icons/mangakatana-optimized.png" width="16" title="MangaKatana"></td>
                    <td><img src="src/mirrors/icons/mangakawaii-optimized.png" width="16" title="MangaKawaii"></td>
                    <td><img src="src/mirrors/icons/mangapark-optimized.png" width="16" title="MangaPark"></td>
                    <td><img src="src/mirrors/icons/mangapill-optimized.png" width="16" title="MangaPill"></td>
                    <td><img src="src/mirrors/icons/manga-read-optimized.png" width="16" title="Manga Read"></td>
                    <td><img src="src/mirrors/icons/mangareader-optimized.png" width="16" title="MangaReaderTo"></td>
                    <td><img src="src/mirrors/icons/mangasushi-optimized.png" width="16" title="Manga Sushi"></td>
                    <td><img src="src/mirrors/icons/manhuafast-optimized.png" width="16" title="ManhuaFast"></td>
                    <td><img src="src/mirrors/icons/manhuaplus-optimized.png" width="16" title="ManhuaPlus"></td>
                    <td><img src="src/mirrors/icons/manhuaus-optimized.png" width="16" title="Manhuaus"></td>
                </tr>
                <tr>
                    <td><img src="src/mirrors/icons/manhwaclub-optimized.png" width="16" title="ManhwaClub"></td>
                    <td><img src="src/mirrors/icons/manhwahentai-optimized.png" width="16" title="ManhwaHentai"></td>
                    <td><img src="src/mirrors/icons/manhwa-top-optimized.png" width="16" title="Manhwa Top"></td>
                    <td><img src="src/mirrors/icons/manwha18-optimized.png" width="16" title="Manhwa18.com"></td>
                    <td><img src="src/mirrors/icons/manytoon-optimized.png" width="16" title="Manytoon"></td>
                    <td><img src="src/mirrors/icons/n-hentai-optimized.png" width="16" title="NHentai"></td>
                    <td><img src="src/mirrors/icons/niceoppai-optimized.png" width="16" title="Niceoppai"></td>
                    <td><img src="src/mirrors/icons/readcomiconline-optimized.png" width="16" title="Read Comic Online"></td>
                    <td><img src="src/mirrors/icons/ruya-manga-optimized.png" width="16" title="Ruya Manga"></td>
                    <td><img src="src/mirrors/icons/s2-manga-optimized.png" width="16" title="S2 Manga"></td>
                </tr>
                <tr>
                    <td><img src="src/mirrors/icons/sadscans-optimized.png" width="16" title="Sad Scans"></td>
                    <td><img src="src/mirrors/icons/scantradunion-optimized.png" width="16" title="Scantrad Union"></td>
                    <td><img src="src/mirrors/icons/setsuscans-optimized.png" width="16" title="Setsu Scans"></td>
                    <td><img src="src/mirrors/icons/submanga-optimized.png" width="16" title="SubManga"></td>
                    <td><img src="src/mirrors/icons/tachidesk-optimized.png" width="16" title="Tachidesk"></td>
                    <td><img src="src/mirrors/icons/utoon-optimized.png" width="16" title="UToon"></td>
                    <td><img src="src/mirrors/icons/voidscans-optimized.png" width="16" title="Void Scans"></td>
                    <td><img src="src/mirrors/icons/webtoons-optimized.png" width="16" title="WebToons"></td>
                    <td><img src="src/mirrors/icons/webtoon-xyz-optimized.png" width="16" title="Webtoon.xyz"></td>
                    <td><img src="src/mirrors/icons/zeroscans-optimized.png" width="16" title="Zero Scans"></td>
                </tr>
            </tbody>
        </table>

    </details>

Your favorite website not listed yet? [Submit a request on GitHub Issues](https://github.com/Ryuu3rs/all-mangas-reader-3/issues)

## 📡 Synchronization

### Browser Sync

_Browser sync_ uses your browser capabilities to synchronize your manga list:
⚠️**only works with Firefox**.

-   ✔️ 🖥️💻📱 <small>(Firefox)</small> **⬌** 🖥️💻📱 <small>(Firefox)</small>

Enable _Browser sync_ in All Mangas Reader under `Settings (cog icon in the top-right corner) > General > Synchronization > Enable browser sync`

### Synchronization with Gist (3rd-party)

_Gist Sync_ is an alernative method to synchornize your manga list using a third party service.
:information_source: Although more [difficult to setup](#enable-gist-sync), this synchronization method is compatible with all (chromium/firefox) browsers.

-   ✔️ 🖥️💻📱 <small>(any browser)</small> **⬌** 🖥️💻📱 <small>(any browser)</small>

##### Enable Gist Sync

1. If you do not have a GitHub account create one at [github.com](https://github.com/)
2. Create a Gist at [gist.github.com](https://gist.github.com/)
    1. In order to create a Gist you have to fill in a description, a file name and its content. It does not matter what the values are.
    2. Once created the URL will change to `gist.github.com/<username>/<Gist ID>`, copy the Gist ID from the URL.
3. Create a Personal Access Token
    1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) and click on "Generate new token".
    2. Fill in the "Note" field with what you want, e.g. "AMR".
    3. Check the "gist" checkbox
    4. Click "Generate Token" and copy it.
        - Generate as much token as you need (1 per device)
        - Make sure you capture/copy token before regenerating new ones as they are shown only once.
4. Enable Gist Sync in All Mangas Reader
    1. In AMR go to `Settings (cog icon in the top-right corner) > General > Synchronization` and check `Enable Gist Sync`
    2. Past corresponding informations:
        - Personal access token is the generated token.
        - Gist ID is the ID extracted from the gist URL
5. Once all of the fields are populated, All Mangas Reader will initiate the synchronization automatically (initlization might take up to 30s).
    - Your data is stored at `https://gist.github.com/<username>/<Gist ID>#file-amr-json`
    - You can use `Revision` to see/restore past version of your synced data
6. Enable Gist Sync in All Mangas Reader for all other devices, make sure they each have their own token and use the same Gist ID.

ℹ️ **Browser Sync doesn't need to be enabled for Gist Sync to work.**
