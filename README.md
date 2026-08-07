# Data Cleaning Quest

A no-login, open-source, gamified platform for learning real Python (pandas) and
real SQL data cleaning — from first-timers to working seniors.

"Fight your data clean." Every world runs **real code against a real in-browser
engine** — Pyodide (WASM Python) and sql.js (WASM SQLite), both isolated in a
dedicated Web Worker. No backend, no login, no simulated interpreter. Progress
lives in `localStorage` and is exportable as JSON.

Full product vision, world designs, and architecture rationale:
[`data-cleaning-quest-master-plan.md`](./data-cleaning-quest-master-plan.md).

## Status

**Phase 1 in progress — repo scaffold stage.** No playable build yet.

See [`data-cleaning-quest-master-plan.md`](./data-cleaning-quest-master-plan.md#14-build-roadmap)
Section 14 for the full 9-phase roadmap. Architecture decisions made so far
(framework, hosting, content-schema win-condition model) are recorded in
[`docs/adr/`](./docs/adr/).

For a structural map of the codebase, see
[`graphify-out/GRAPH_REPORT.md`](./graphify-out/GRAPH_REPORT.md) (generated —
read this before diving into the source).

## Stack

- **React 19 + TypeScript (strict)** — UI
- **Pyodide** (WASM Python/pandas) in a dedicated Web Worker
- **sql.js** (WASM SQLite) in a dedicated Web Worker
- **CodeMirror 6** — real syntax highlighting, real error surfacing
- **GSAP** — all animation, driven imperatively outside React's render cycle
- **Vite** — build/dev, per-world code-splitting
- **Vitest** / **Playwright** — unit / e2e tests
- **pnpm workspaces** monorepo, no Turborepo yet

## Repository layout

```
apps/web/              the game — Vite + React app
packages/content-schema/   shared TS types + Zod schema for case JSON
packages/engine-adapters/  typed worker RPC protocol + Pyodide/sql.js helpers
packages/ui-kit/           shared design-system primitives (grows on 2nd use)
content/cases/          community-contributable boss/case JSON, per world
docs/                   architecture, security, content-authoring guide, ADRs
```

## Getting started

Requires Node (see [`.nvmrc`](./.nvmrc)) and [pnpm](https://pnpm.io) (version
pinned in `package.json#packageManager`, use via Corepack).

```bash
corepack enable
pnpm install
pnpm dev          # run apps/web locally
pnpm typecheck     # tsc -b across the whole workspace
pnpm lint
pnpm test
pnpm build
```

`pnpm fetch-pyodide` downloads the pinned, checksum-verified Pyodide runtime
into `apps/web/public/pyodide/` (gitignored). Not wired to `postinstall` yet
— nothing consumes it until the Phase 1 worker lands.

## Contributing

The whole point of this project is that a new boss/case is **a JSON file plus
a seed dataset** — no engine knowledge required. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`docs/content-authoring-guide.md`](./docs/content-authoring-guide.md).

## Security

We execute arbitrary user-typed code in the browser. See
[`SECURITY.md`](./SECURITY.md) for the sandboxing model, CSP policy, and how
to report a vulnerability.

## License

[MIT](./LICENSE)
