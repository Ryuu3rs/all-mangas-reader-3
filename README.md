# All Mangas Reader Rewrite

Last updated: 2026-06-08

## Direction

The previous parity rewrite is discontinued. AMR is being redesigned as a lightweight,
local-first browser extension focused on reading, progress, library, search, and updates.

Read [REWRITE_PLAN.md](REWRITE_PLAN.md) before implementation work.

Detailed specifications:

-   [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
-   [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
-   [docs/SECURITY_OPERATIONS.md](docs/SECURITY_OPERATIONS.md)

## Folder Map

-   `svelte-rewrite/`: temporary parity rewrite reference pending archival
-   `dist/`: built extension artifact loaded in Firefox or Chrome for local testing
-   `stable-v3.1.0/`: stable rollback and regression reference
-   `src/`: legacy implementation retained only for source extraction reference
-   `artifacts/backups/`: archived build outputs and migration backups

## Build And Run

```powershell
cd svelte-rewrite
npm install
npm run build:firefox
```

Firefox local load:

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on`
3. Select `dist/manifest.json`

Chrome local build:

```powershell
cd svelte-rewrite
npm run build:chrome
```

## Current Status

-   Existing rewrite code is retained as reference but will not be extended.
-   The target stack is WXT, Svelte 5, TypeScript, pnpm, Dexie, and Zod.
-   The optional hosted platform uses SvelteKit, Fastify, and PostgreSQL.
-   The next implementation step is Stage 0 in [TASKS.md](TASKS.md).
-   `src/` is retained for source extraction logic, not application architecture.
-   `amr-next/` remains paused and outside the extension roadmap.

## Tasks

Current rewrite work is tracked in [TASKS.md](TASKS.md).
