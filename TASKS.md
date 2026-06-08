# AMR Implementation Roadmap

Last updated: 2026-06-09

Plans:

-   [REWRITE_PLAN.md](REWRITE_PLAN.md)
-   [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
-   [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
-   [docs/SECURITY_OPERATIONS.md](docs/SECURITY_OPERATIONS.md)

## Stage 0: Preserve And Scaffold

-   [ ] Create `archive/pre-clean-rewrite` from the complete current working tree.
-   [ ] Tag the last upstream baseline.
-   [ ] Move legacy Vue, parity Svelte, and paused platform code under `archive/`.
-   [ ] Remove generated dependencies, builds, backups, and logs from source tracking.
-   [ ] Create pnpm workspace.
-   [ ] Scaffold `apps/extension` with WXT, Svelte 5, and strict TypeScript.
-   [ ] Scaffold `apps/web` with SvelteKit.
-   [ ] Scaffold `apps/api` with Fastify.
-   [ ] Create shared contracts, source SDK, sources, UI, fixtures, and config packages.
-   [ ] Add ESLint, Prettier, Vitest, Playwright, WebDriver, and changesets.
-   [ ] Replace CI with mandatory checks and no `continue-on-error`.
-   [ ] Add Chrome and Firefox manifest policy checks.
-   [ ] Add secret, dependency, license, and static security scans.
-   [ ] Add fixture source server.
-   [ ] Add structured logging and CI artifact collection.

Exit:

-   [ ] Empty extension installs automatically in Chromium tests.
-   [ ] Empty extension installs automatically in Firefox tests.
-   [ ] API and website health checks pass.

## Stage 1: Reader Vertical Slice

### Domain And Source SDK

-   [ ] Add manga, source, chapter, page, progress, and error contracts.
-   [ ] Add Zod schemas for storage, messages, imports, and adapter output.
-   [ ] Implement source manifest and adapter interfaces.
-   [ ] Implement source registry with lazy adapter loading.
-   [ ] Implement bounded request client.
-   [ ] Add safe HTML and script-literal parsing utilities.

### MangaDex

-   [ ] Add search fixtures.
-   [ ] Add manga fixtures.
-   [ ] Add multilingual chapter fixtures.
-   [ ] Add chapter page fixtures.
-   [ ] Port MangaDex adapter.
-   [ ] Add URL matching and normalization tests.
-   [ ] Add live canary test.

### Reader

-   [ ] Add source-aware page detector.
-   [ ] Add chapter confirmation.
-   [ ] Add automatic library upsert with undo.
-   [ ] Open an extension-owned reader tab.
-   [ ] Build reader shell and toolbar.
-   [ ] Build continuous mode.
-   [ ] Build single-page mode.
-   [ ] Implement bounded image scheduler.
-   [ ] Add retry and chapter error states.
-   [ ] Add previous and next chapter.
-   [ ] Add keyboard shortcuts.
-   [ ] Persist and restore progress.
-   [ ] Handle API offline state.

### Autonomous Validation

-   [ ] Chromium install, read, restart, and resume test.
-   [ ] Firefox install, read, restart, and resume test.
-   [ ] Capture service worker and extension page logs.
-   [ ] Capture screenshots, traces, video, HAR, and storage snapshots.
-   [ ] Add long-chapter memory test.

Exit:

-   [ ] MangaDex reading works after browser restart in Firefox and Chromium.
-   [ ] A failed test produces enough artifacts to diagnose without user input.

## Stage 2: Local Product

### Storage

-   [ ] Create Dexie schema and migrations.
-   [ ] Add repositories for library, source links, chapters, progress, bookmarks, history,
        achievements, source health, and update jobs.
-   [ ] Add migration fixture tests.
-   [ ] Add 1,000 and 10,000 record performance datasets.

### UI

-   [ ] Popup
-   [ ] Home
-   [ ] Library
-   [ ] Manga details
-   [ ] Search
-   [ ] Add by URL
-   [ ] Updates
-   [ ] Sources
-   [ ] Settings
-   [ ] Diagnostics

### Library Behavior

-   [ ] Auto-add preference and per-source override.
-   [ ] Add by known URL.
-   [ ] Detect manga from chapter URL.
-   [ ] Statuses and tags.
-   [ ] Sorting and filters.
-   [ ] Bulk actions.
-   [ ] Removal and undo.
-   [ ] Versioned import and export.

### Search And Updates

-   [ ] Parallel cancellable search.
-   [ ] Per-source progress and errors.
-   [ ] Optional host permission flow.
-   [ ] Manual update check.
-   [ ] Alarm-based scheduled updates.
-   [ ] Source rate limiting and backoff.
-   [ ] Optional notifications.

Exit:

-   [ ] Complete offline reading and library workflow.
-   [ ] 1,000 item library meets performance budgets.

## Stage 3: Source Coverage

-   [ ] Port Weeb Central.
-   [ ] Port Dynasty Scans.
-   [ ] Port one Madara source family.
-   [ ] Port Komga.
-   [ ] Port Tachidesk.
-   [ ] Add generic source template schema.
-   [ ] Build generic-site setup wizard.
-   [ ] Add template export and validation.
-   [ ] Add source health canaries.
-   [ ] Add nightly source issue automation.
-   [ ] Rank remaining legacy sources by use and health.
-   [ ] Port only sources with fixtures and current samples.

Exit:

-   [ ] Five representative source types pass fixture and live smoke tests.

## Stage 4: Achievements And Sharing

-   [ ] Add reading event model.
-   [ ] Add active reading time rules.
-   [ ] Add versioned achievement definitions.
-   [ ] Add achievement progress and unlock engine.
-   [ ] Add local achievement notifications.
-   [ ] Add statistics screen.
-   [ ] Add goals and streaks.
-   [ ] Generate local share cards.
-   [ ] Add privacy controls for shared fields.

Exit:

-   [ ] Achievements and statistics work fully offline.

## Stage 5: Hosted Platform

### Infrastructure

-   [ ] Provision VPS.
-   [ ] Harden SSH, firewall, updates, and deployment user.
-   [ ] Deploy Caddy, API, web, PostgreSQL, and backups.
-   [ ] Add staging environment.
-   [ ] Add monitoring and alerts.
-   [ ] Add automated backup restore test.

### Accounts

-   [ ] Registration and email verification.
-   [ ] Passkeys.
-   [ ] Password fallback with Argon2id.
-   [ ] Session rotation and revocation.
-   [ ] Account export and deletion.

### Sync

-   [ ] Device registration.
-   [ ] Encrypted sync records.
-   [ ] Cursors, tombstones, and conflicts.
-   [ ] Offline queue.
-   [ ] Multi-device browser tests.

### Social

-   [ ] Private-by-default profiles.
-   [ ] Friends, requests, blocks, and reports.
-   [ ] Public aggregate statistics.
-   [ ] Hosted share pages.
-   [ ] Moderation tools.

Exit:

-   [ ] Server outage does not break local use.
-   [ ] Multi-device sync and account deletion pass end-to-end tests.

## Stage 6: Verified Leaderboards

-   [ ] Signed activity session challenges.
-   [ ] Sequenced event hash chain.
-   [ ] Replay and impossible-rate detection.
-   [ ] Verification confidence.
-   [ ] Verified achievement claims.
-   [ ] Friends leaderboards.
-   [ ] Seasonal leaderboards.
-   [ ] Daily scoring caps.
-   [ ] Appeals and moderation workflow.
-   [ ] Imported and offline activity labels.

Exit:

-   [ ] Trivial forged clients cannot submit competitive activity.
-   [ ] Suspicious data is excluded without exposing private reading history.

## Stage 7: Distribution And Maintenance

-   [ ] Chrome Web Store listing and API credentials.
-   [ ] Firefox Add-ons listing, ID, and signing credentials.
-   [ ] Beta channels.
-   [ ] GitHub Releases with checksums and changelog.
-   [ ] Reproducible package build.
-   [ ] Store submission automation.
-   [ ] Staged rollout and halt procedure.
-   [ ] Upgrade tests from previous stable.
-   [ ] Legacy import tests.
-   [ ] Support and source issue templates.
-   [ ] Monthly dependency and permission review.

Exit:

-   [ ] Store installations update through browser-managed updates.
-   [ ] A release can be halted or rolled back without shipping remote code.
