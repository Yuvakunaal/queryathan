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

**Phases 1-4 in progress: Worlds 2 (The Vault), 3 (The Twins) and 4 (The Architect) are playable. Phase 3 complete — World 1 (Boss Fights) is fully playable, four bosses
deep, in either of two real engines.** Open the app to a boss roster
(locked/unlocked/cleared state, rank, XP), pick a fight, choose Python
(pandas/Pyodide) or SQL (SQLite/sql.js) on an engine-select screen, and edit
real code against that real in-browser engine — watch the HP heatmap drop,
cells flash a git-diff-style red/green, the boss's ASCII sigil decay as
afflictions clear. All six of World 1's content areas are live (nulls,
duplicates, whitespace/casing, wrong dtypes, outliers, bad dates), stacked
1–6 at a time depending on the boss, solvable the same way in either
language. Real interpreter errors surface as an unmodified traceback/SQLite
error, exactly as they would in a notebook or a `sqlite3` shell. Progress
(cleared bosses, XP, rank) persists in `localStorage` and is
exportable/importable as JSON — no login, no server.

No other worlds yet, no sandbox mode, no offline caching, no
Playwright/Lighthouse CI — all explicitly later phases. See
[`data-cleaning-quest-master-plan.md`](./data-cleaning-quest-master-plan.md#14-build-roadmap)
Section 14 for the full 9-phase roadmap. Architecture decisions are recorded
in [`docs/adr/`](./docs/adr/); World 1's visual/motion design specs are in
[`docs/design/world-1-visual-spec.md`](./docs/design/world-1-visual-spec.md)
(Phase 1) and
[`docs/design/world-1-phase-2-visual-spec.md`](./docs/design/world-1-phase-2-visual-spec.md)
(Phase 2).

For a structural map of the codebase, see
[`graphify-out/GRAPH_REPORT.md`](./graphify-out/GRAPH_REPORT.md) (generated —
read this before diving into the source).

## Stack

- **React 19 + TypeScript (strict)** — UI
- **Pyodide** (WASM Python/pandas) in a dedicated Web Worker — interpreter
  self-hosted and checksum-verified, pandas/numpy wheels from a pinned
  jsdelivr CDN path (see [ADR 0004](./docs/adr/0004-pyodide-package-delivery.md))
- **sql.js** (WASM SQLite) in its own dedicated Web Worker — ships as a
  single importable npm package, self-hosted automatically by Vite's `?url`
  asset resolution (no manual fetch script needed, unlike Pyodide)
- **CodeMirror 6** — real syntax highlighting (Python and SQL modes), real
  error surfacing
- **GSAP** — all animation, driven imperatively outside React's render cycle
  (see [ADR 0001](./docs/adr/0001-framework.md))
- **TanStack Virtual** — the dataframe grid
- **Vite** — build/dev
- **Vitest** — unit tests (191 passing across the workspace)
- **pnpm workspaces** monorepo, no Turborepo yet

Not yet integrated: **Playwright** as a CI gate (e2e is Phase 7 — used
manually this session for real-browser verification, including against a
production build under real CSP headers, but not yet wired into CI),
per-world code-splitting (nothing to split until a second world exists).

## Repository layout

```
apps/web/              the game — Vite + React app
  src/engines/            pyodide.worker.ts + sqlite.worker.ts (each a dedicated Web Worker) + their main-thread clients + csv.ts/sql-dtypes.ts (SQL's CSV loader/dtype inference)
  src/worlds/boss-fights/ World 1: all React components + theme.css
  src/anim/world1/        GSAP choreography (recoil, diff-flash, HP shatter, CRT, boot type, engine-select reveal)
  src/lib/                pure game logic: diff, afflictions, win-condition eval
  public/datasets/        seed CSVs, license-tagged per world
packages/content-schema/   shared TS types + Zod schema for case JSON
packages/engine-adapters/  typed worker RPC protocol (protocol.ts, rpc.ts) + shared WorkerEngineClient base class (client.ts)
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
