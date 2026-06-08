# Contributing

## Setup

```powershell
npm install
npm run check
```

## Project Rules

- New product code belongs in `apps/`, `packages/`, or `tooling/`.
- Do not modify archived implementations except to document them.
- Source adapters require fixtures and normalized output tests.
- Firefox and Chromium builds must both pass.
- Do not add global host permissions.
- Do not add remote executable code, `eval`, or user-supplied JavaScript.
- Keep changes scoped and update the roadmap when completing a tracked item.

## Pull Requests

Pull requests must include:

- purpose and user-visible behavior
- tests performed
- screenshots for UI changes
- permission changes
- source fixture changes
- remaining risks
