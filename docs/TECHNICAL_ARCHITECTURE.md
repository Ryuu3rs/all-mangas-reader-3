# AMR Technical Architecture

Last updated: 2026-06-09

## Extension Entry Points

WXT entrypoints:

-   background service worker for Chromium
-   background event page for Firefox where required
-   popup
-   full application page
-   reader page
-   options redirect
-   source-aware content script registration

The build produces separate Chrome and Firefox manifests.

## Core Modules

### Domain

-   manga
-   chapters
-   pages
-   progress
-   bookmarks
-   history
-   achievements
-   source health
-   account sync

Domain modules do not import browser APIs or Svelte.

### Application Services

-   `LibraryService`
-   `SearchService`
-   `ReaderService`
-   `UpdateService`
-   `AchievementService`
-   `HistoryService`
-   `SyncService`
-   `DiagnosticsService`

Services use repository and adapter interfaces.

### Platform

-   browser API wrapper
-   permissions
-   alarms
-   tabs
-   content script registration
-   declarative network rules
-   notification adapter

## Source SDK

```ts
interface SourceAdapter {
    manifest: SourceManifest
    match(url: URL): SourcePageMatch
    search(input: SearchInput, context: SourceContext): Promise<SearchResult[]>
    resolveManga(input: ResolveMangaInput, context: SourceContext): Promise<SourceManga>
    listChapters(input: ListChaptersInput, context: SourceContext): Promise<SourceChapter[]>
    resolveChapter(input: ResolveChapterInput, context: SourceContext): Promise<ResolvedChapter>
}
```

`SourceManifest`:

-   stable ID
-   display name
-   domains
-   languages
-   adult-content flag
-   capabilities
-   request rate limit
-   required permissions
-   optional declarative network rules
-   fixture version

`SourceContext`:

-   request client
-   HTML parser
-   JSON validator
-   safe script literal parser
-   clock
-   logger
-   optional current-page snapshot

Adapters cannot use:

-   extension storage
-   runtime messages
-   Svelte state
-   global DOM
-   arbitrary browser APIs

## Source Families

Shared implementations may support:

-   MangaDex API
-   Madara
-   MangaStream
-   MangaReaderCMS
-   FoolSlide
-   static HTML chapter lists
-   local Komga
-   local Tachidesk

Family configuration is data, but family behavior remains reviewed TypeScript.

## Generic Adapter

The generic adapter uses a declarative schema:

```ts
type GenericSourceTemplate = {
    schemaVersion: 1
    id: string
    domains: string[]
    manga: {
        title: SelectorRule
        cover?: SelectorRule
        chapters: CollectionRule
    }
    chapter: {
        title?: SelectorRule
        images: CollectionRule
        next?: SelectorRule
        previous?: SelectorRule
    }
}
```

Templates are validated, size-limited, and locally scoped.

Selectors have:

-   CSS selector
-   output source: text or an allowed attribute
-   URL base behavior
-   optional trim and safe text transforms

No JavaScript expressions or executable remote configuration.

## Page Detection And Auto-Add

1. The background worker receives tab URL changes.
2. Registry checks only adapter domain and URL patterns.
3. If unmatched, no script is registered.
4. If matched, a minimal detector reads adapter-requested metadata.
5. Chapter confirmation triggers a reader offer or auto-open.
6. Manga metadata is resolved.
7. `LibraryService.upsertFromReading` creates or updates the library record.
8. UI shows an undo notification.
9. Reader opens in an extension-owned tab.

Do not clear or replace the source page DOM.

## Storage Model

Dexie database tables:

-   `manga`
-   `sourceLinks`
-   `chapters`
-   `progress`
-   `bookmarks`
-   `historyEvents`
-   `achievementState`
-   `updateJobs`
-   `sourceHealth`
-   `syncQueue`
-   `migrationState`

Important indexes:

-   manga normalized title
-   manga status
-   source link by source ID and remote ID
-   chapter by source link and sort key
-   progress by manga and updated time
-   history by occurred time
-   sync queue by status and retry time

Small preferences remain in `browser.storage.local`.

## Domain Records

`MangaRecord`:

-   ID
-   display title
-   normalized title
-   alternate titles
-   cover
-   status
-   tags
-   adult-content flag
-   added time
-   updated time

`SourceLink`:

-   ID
-   manga ID
-   source ID
-   remote ID
-   canonical URL
-   language
-   last checked time
-   health state

`ChapterRecord`:

-   ID
-   source link ID
-   remote ID
-   title
-   chapter number as string
-   volume
-   sort key
-   URL
-   published time
-   fetched time

`ReadingProgress`:

-   manga ID
-   chapter ID
-   page index
-   page count
-   completed
-   updated time

## Typed Extension Messages

Message areas:

-   `app:*`
-   `library:*`
-   `source:*`
-   `reader:*`
-   `updates:*`
-   `account:*`
-   `diagnostics:*`

Every request:

-   has schema version
-   has request ID
-   validates payload
-   validates sender context
-   returns a typed success or error envelope

No generic action dispatcher accepts arbitrary method names.

## Request Client

Features:

-   abort signal
-   operation timeout
-   source rate limit
-   bounded retries with jitter
-   response size limit
-   MIME validation
-   text, JSON, and bytes response modes
-   redirect limit
-   structured timings
-   redacted diagnostics

Defaults:

-   metadata timeout: 15 seconds
-   image resolution timeout: 20 seconds
-   retries: two transient retries
-   HTML maximum: 5 MB
-   JSON maximum: 10 MB

Adapters can lower limits but cannot remove global safety limits.

## Reader Image Pipeline

-   adapters resolve final page requests
-   reader starts with page descriptors
-   scheduler loads current page first
-   continuous mode loads viewport plus configured lookahead
-   concurrency defaults to four
-   failed pages retry independently
-   object URLs are revoked
-   decoded images outside the retention window are released
-   progress uses intersection observation

Images requiring custom headers use reviewed declarative network rules or a controlled
extension fetch path. The API server does not proxy third-party manga images by default.

## Update Scheduler

-   browser alarm starts a bounded update window
-   library is grouped by source
-   source rate limits are respected
-   recently checked manga are skipped
-   failures use exponential backoff
-   one run has a maximum manga and duration budget
-   unfinished work continues on a later alarm

No permanent background loop.

## Achievement Engine

Input events:

-   manga added
-   chapter started
-   page changed
-   chapter completed
-   manga status changed
-   bookmark added
-   reading day completed

Definitions are versioned local data:

-   ID
-   title
-   description
-   icon
-   points
-   hidden state
-   progress reducer
-   unlock predicate
-   verification policy

Unlocked state stores definition version and timestamp.

## Online API

Base path: `/v1`.

### Authentication

-   `POST /auth/register`
-   `POST /auth/login`
-   `POST /auth/refresh`
-   `POST /auth/logout`
-   `POST /auth/email/verify`
-   `POST /auth/password/request-reset`
-   `POST /auth/password/reset`
-   `POST /auth/webauthn/register/options`
-   `POST /auth/webauthn/register/verify`
-   `POST /auth/webauthn/login/options`
-   `POST /auth/webauthn/login/verify`

Prefer passkeys and email verification. Passwords use Argon2id.

### Account

-   `GET /me`
-   `PATCH /me`
-   `DELETE /me`
-   `GET /me/sessions`
-   `DELETE /me/sessions/:sessionId`

### Sync

-   `GET /sync/manifest`
-   `PUT /sync/records/:recordId`
-   `POST /sync/batch`
-   `GET /sync/changes?cursor=...`
-   `POST /sync/tombstones`

Encrypted payload mode stores ciphertext and minimal merge metadata.

### Activity Verification

-   `POST /activity/sessions/start`
-   `POST /activity/sessions/:id/events`
-   `POST /activity/sessions/:id/complete`
-   `GET /activity/summary`

### Achievements

-   `GET /achievements`
-   `GET /me/achievements`
-   `POST /achievements/claim`

### Profiles And Friends

-   `GET /profiles/:username`
-   `POST /friends/requests`
-   `GET /friends/requests`
-   `POST /friends/requests/:id/accept`
-   `POST /friends/requests/:id/decline`
-   `DELETE /friends/:userId`
-   `POST /blocks/:userId`

### Leaderboards

-   `GET /leaderboards/:boardId?period=...`
-   `GET /leaderboards/:boardId/friends`
-   `GET /leaderboards/seasons`

### Share

-   `POST /share/cards`
-   `GET /share/:shareId`
-   `DELETE /share/:shareId`

### Diagnostics

-   `POST /diagnostics/source-health`
-   `POST /diagnostics/crash`

Both require explicit consent and strict redaction.

## API Response Envelope

Success:

```json
{
    "ok": true,
    "data": {},
    "requestId": "uuid"
}
```

Error:

```json
{
    "ok": false,
    "error": {
        "code": "RATE_LIMITED",
        "message": "Try again later"
    },
    "requestId": "uuid"
}
```

## Sync Conflict Rules

-   local writes are applied immediately
-   records have stable IDs and updated timestamps
-   deletion uses tombstones
-   equal-version conflicts use deterministic device IDs
-   reading progress keeps the furthest completed chapter and latest active position
-   user edits such as title and tags use latest explicit edit
-   conflicts are logged locally

## Framework Boundaries

-   Svelte components do not call fetch or IndexedDB directly.
-   API routes do not contain SQL.
-   source adapters do not call extension APIs.
-   shared contracts contain no runtime framework.
-   UI package contains presentational components only.
