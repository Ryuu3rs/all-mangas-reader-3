# Development Guide

Last updated: 2026-06-08

Architecture, UX, coding standards, security, automated testing, and delivery phases
are defined in:

-   [REWRITE_PLAN.md](REWRITE_PLAN.md)
-   [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
-   [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
-   [docs/SECURITY_OPERATIONS.md](docs/SECURITY_OPERATIONS.md)

## Workspaces

-   Rewrite foundation: a new WXT workspace created during Stage 0
-   Build artifact: `dist/`
-   Reader behavior reference: `stable-v3.1.0/`
-   Source adapter reference: `src/mirrors/`

The current `svelte-rewrite` application is retained temporarily for reference. Do not
add parity features to its page shell, background worker, or legacy bridge.

`amr-next/` is paused and outside the extension roadmap.

## Prerequisites

-   Node.js 22.x (current local environment)
-   npm 10+
-   Firefox Developer Edition (or Firefox)

## Build Workflow

### Firefox build

```powershell
cd svelte-rewrite
npm install
npm run build:firefox
```

### Chrome build

```powershell
cd svelte-rewrite
npm run build:chrome
```

Output goes to:

-   `G:\Documents\scripts\all-mangas-reader-2\dist`

## Load In Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Choose `dist/manifest.json`

After rebuilds, click **Reload** in about:debugging.

## Regression / Validation Commands

```powershell
cd svelte-rewrite
npm run check:regression
npm run verify:firefox
npm run verify:chrome
```

## Logs

Keep diagnostics in repo root:

-   `firefoxlogs.txt`: extension/background logs
-   `pageconsole.txt`: manga page console logs

## Current Priority

Complete Stage 0 and Stage 1 from [TASKS.md](TASKS.md): preserve the current state,
create the WXT monorepo, and deliver an autonomously tested MangaDex reader slice with
persisted progress.
