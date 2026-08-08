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

**Phase 1 complete — the core loop is real and playable.** Open the app,
engage `NUL_SENTINEL`, and you're editing real pandas against a real
Pyodide worker: type `df['temp_c'] = df['temp_c'].fillna(0)`, run it, and
watch the actual dataframe change — HP heatmap drops, cells flash a
git-diff-style red/green, the boss's ASCII sigil decays as the affliction
clears. Real Python errors (e.g. a `KeyError` from a bad column reference)
surface as an unmodified traceback, exactly as they would in a notebook.

No save system yet (progress resets on refresh), no SQL path, no other
worlds, no sandbox mode, no offline caching, no Playwright/Lighthouse CI —
all explicitly later phases. See
[`data-cleaning-quest-master-plan.md`](./data-cleaning-quest-master-plan.md#14-build-roadmap)
Section 14 for the full 9-phase roadmap. Architecture decisions are recorded
in [`docs/adr/`](./docs/adr/); World 1's visual/motion design spec is in
[`docs/design/world-1-visual-spec.md`](./docs/design/world-1-visual-spec.md).

For a structural map of the codebase, see
[`graphify-out/GRAPH_REPORT.md`](./graphify-out/GRAPH_REPORT.md) (generated —
read this before diving into the source).

## Stack

- **React 19 + TypeScript (strict)** — UI
- **Pyodide** (WASM Python/pandas) in a dedicated Web Worker — interpreter
  self-hosted and checksum-verified, pandas/numpy wheels from a pinned
  jsdelivr CDN path (see [ADR 0004](./docs/adr/0004-pyodide-package-delivery.md))
- **CodeMirror 6** — real syntax highlighting, real error surfacing
- **GSAP** — all animation, driven imperatively outside React's render cycle
  (see [ADR 0001](./docs/adr/0001-framework.md))
- **TanStack Virtual** — the dataframe grid
- **Vite** — build/dev
- **Vitest** — unit tests (36 passing across the workspace)
- **pnpm workspaces** monorepo, no Turborepo yet

Not yet integrated: **sql.js** (SQL path is Phase 3), **Playwright**
(e2e is Phase 7), per-world code-splitting (nothing to split until a second
world exists).

## Repository layout

```
apps/web/              the game — Vite + React app
  src/engines/            pyodide.worker.ts (dedicated Web Worker) + main-thread client
  src/worlds/boss-fights/ World 1: all React components + theme.css
  src/anim/world1/        GSAP choreography (recoil, diff-flash, HP shatter, CRT, boot type)
  src/lib/                pure game logic: diff, afflictions, win-condition eval
  public/datasets/        seed CSVs, license-tagged per world
packages/content-schema/   shared TS types + Zod schema for case JSON
packages/engine-adapters/  typed worker RPC protocol (protocol.ts, rpc.ts)
packages/ui-kit/           shared design-system primitives (grows on 2nd use)
content/cases/          community-contributable boss/case JSON, per world
docs/                   architecture, security, content-authoring guide, ADRs, design specs
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

`pnpm install` runs `postinstall` automatically, which fetches the pinned,
checksum-verified Pyodide runtime into `apps/web/public/pyodide/`
(gitignored, ~14MB) — the worker depends on it being present, so `pnpm dev`
will fail without it. Re-run manually any time with `pnpm fetch-pyodide`; it's
a no-op if the pinned version is already present.

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
