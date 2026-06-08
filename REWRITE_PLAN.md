# All Mangas Reader Product And Rewrite Plan

Last updated: 2026-06-09

## Authority And Direction

This is a clean product rewrite. Existing code, frameworks, and folder structures are
references, not constraints.

The lead implementation may archive or delete old code after preserving it in git.
Product decisions prioritize:

1. reliable reading
2. Firefox and Chromium support
3. automated testing with minimal human input
4. maintainable source adapters
5. privacy and security
6. optional social and hosted features

The extension remains fully useful without an account or server. Online accounts,
achievements, sharing, leaderboards, and remote diagnostics are optional additions.

## Chosen Stack

### Extension

-   WXT for browser extension entrypoints, manifests, builds, and development
-   Svelte 5 for user interfaces
-   TypeScript in strict mode
-   Vite through WXT
-   Dexie over IndexedDB for local domain data
-   Zod for runtime validation
-   Vitest for unit and integration tests
-   Playwright for Chromium extension browser tests
-   `web-ext`, geckodriver, and WebDriver for Firefox extension browser tests
-   pnpm workspaces for dependency and monorepo management

Why:

-   WXT supports Chrome and Firefox from one source tree while allowing browser-specific
    manifest differences.
-   Svelte produces small UI bundles and is already represented in the repository.
-   Dexie makes schema migrations and IndexedDB tests less error-prone.
-   Zod validates every untrusted boundary.
-   pnpm keeps shared extension, API, web, and contract packages consistent.

### Optional Hosted Platform

-   SvelteKit website
-   Fastify TypeScript API
-   PostgreSQL
-   Redis or Valkey only when rate limiting, queues, or caching require it
-   object storage for generated share cards and release artifacts if needed
-   Docker Compose for local development and initial VPS deployment
-   Caddy as HTTPS reverse proxy on the VPS
-   GitHub Actions for build, test, deploy, and release

Do not build microservices. Start with one modular API process, one PostgreSQL database,
and one web application.

## Repository Target

```text
apps/
  extension/
  web/
  api/
packages/
  contracts/
  source-sdk/
  sources/
  ui/
  test-fixtures/
  config/
tooling/
  browser-tests/
  source-health/
  release/
archive/
  legacy-vue/
  parity-svelte/
  amr-next/
docs/
  PRODUCT_SPEC.md
  TECHNICAL_ARCHITECTURE.md
  SECURITY_OPERATIONS.md
```

`dist/`, dependencies, logs, screenshots, traces, and test profiles are generated and
must not be committed.

## Product Shape

### Offline Core

-   supported-site detection
-   automatic library add when reading
-   add manga by URL
-   source search
-   local library
-   chapter updates
-   reader
-   bookmarks
-   progress
-   history
-   local achievements and statistics
-   import and export

### Optional Online Layer

-   account
-   encrypted sync
-   public profile
-   share cards
-   achievement verification
-   leaderboards
-   friends and follows
-   source health reporting
-   remote diagnostics with explicit consent

Server unavailability must not block reading, progress saving, or local achievements.

## Core Product Rules

-   Visiting a supported chapter automatically creates or updates a library entry unless
    the user disables auto-add.
-   Automatic adds show a non-blocking undo notice.
-   A source adapter may use current-page HTML only when background requests cannot work.
-   User-added generic sites run through a restricted declarative adapter system. Users
    do not provide arbitrary JavaScript.
-   Source failures are isolated and shown as actionable errors.
-   Progress is saved locally first and synced later.
-   Achievements are fun, not paywalled, and never interrupt reading.
-   Leaderboards use server-verifiable events and clearly label unverified historical
    imports.
-   No extension code is downloaded and executed remotely.

## Detailed Specifications

-   Product, screens, menus, tooltips, reader behavior, achievements, and social features:
    [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
-   modules, source adapters, storage, messages, API calls, generic-site support, and data
    models: [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
-   security, anti-cheat, diagnostics, autonomous testing, VPS deployment, releases,
    updates, and maintenance: [docs/SECURITY_OPERATIONS.md](docs/SECURITY_OPERATIONS.md)
-   execution order: [TASKS.md](TASKS.md)

## Delivery Stages

### Stage 0: Preserve And Create The New Workspace

-   Preserve the current dirty tree in a dedicated git branch.
-   Archive old implementation tracks.
-   Create the pnpm workspace.
-   Scaffold WXT extension, shared packages, API, and web app.
-   Establish strict CI with no allowed failures.

Exit: empty extension loads in Firefox and Chromium; API and website health pages run.

### Stage 1: Complete Reader Vertical Slice

-   Implement source SDK and MangaDex adapter.
-   Detect chapter pages.
-   Auto-add manga.
-   Resolve chapter pages.
-   Read in continuous and single-page modes.
-   Persist progress and resume after browser restart.
-   Capture browser logs, screenshots, traces, and extension storage automatically.

Exit: the automated suite installs the extension, reads a fixture chapter, restarts the
browser, resumes, and publishes artifacts without human input.

### Stage 2: Library, Search, And Updates

-   Implement local library and chapter repositories.
-   Add URL import and source search.
-   Add manual and scheduled update checks.
-   Implement popup, library, search, sources, and settings screens.
-   Port representative source families.

Exit: a user can discover, add, update, read, and export manga without an account.

### Stage 3: Local Fun Features

-   Reading history and statistics
-   Local achievements
-   Shareable image cards generated locally
-   Bookmarks, tags, statuses, and goals

Exit: social-style features work privately and offline.

### Stage 4: Accounts And Sync

-   Authentication
-   End-to-end encrypted library and progress sync
-   Public profile controls
-   Friends and follows
-   Verified event upload

Exit: opt-in multi-device use works without exposing reading contents to the server
where encryption is enabled.

### Stage 5: Leaderboards And Community

-   Verified achievements
-   Seasonal and friend leaderboards
-   Public share pages
-   Abuse controls and moderation
-   Source health aggregation

Exit: rankings are resistant to trivial client manipulation and privacy controls are
enforced.

### Stage 6: Store Release And Maintenance

-   Chrome Web Store release
-   Firefox Add-ons release and signing
-   GitHub Releases for source, checksums, and optional manual packages
-   automated staged releases
-   adapter health monitoring
-   rollback process

Exit: stable channels update through browser stores and failed releases can be rolled
back quickly.

## Release Priorities

P0:

-   reading
-   auto-add
-   library
-   progress
-   source adapters
-   autonomous browser tests
-   secure permissions

P1:

-   search
-   updates
-   history
-   achievements
-   import and export

P2:

-   accounts
-   sync
-   profiles
-   friends
-   leaderboards

Do not allow social features to delay a stable reader.

## Non-Negotiable Acceptance Criteria

-   Firefox and Chromium use the same domain and adapter code.
-   Browser-specific manifests are generated and tested separately.
-   No global host permission is requested on installation.
-   No remote script execution, `eval`, or user-supplied JavaScript.
-   A browser test can install, exercise, and inspect the extension without user action.
-   Every failed browser test uploads logs, screenshots, video or trace, network records,
    and a redacted storage snapshot.
-   Reading and local progress work while the API is offline.
-   Production releases are reproducible and signed through official browser channels.
-   One broken adapter cannot break the extension.
-   Legacy frameworks and bridge modules are absent from production bundles.
-   Public sharing is opt-in and private by default.
-   Leaderboards distinguish verified activity from imported or offline-only history.
