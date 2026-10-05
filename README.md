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

Nine worlds are playable, 45 cases in all, each winnable in either engine:

1. **Boss Fights**: nulls, duplicates, whitespace and casing, wrong dtypes,
   outliers, bad dates.
2. **The Vault**: pattern extraction and mojibake.
3. **The Twins**: joins and relational cleanup.
4. **The Architect**: reshaping.
5. **The Foundry**: timed jobs against a stopwatch, with quality stamps.
6. **The Observatory**: business questions answered with grouping, ranking,
   moving averages, cohorts, sessions and funnels. The answer table is checked
   against the expected one.
7. **The Labyrinth**: CTEs, subqueries, NOT EXISTS, recursive CTEs (org charts,
   bills of materials), set operations and gaps-and-islands streaks.
8. **The Timekeeper**: mixed date formats, business days, time zones, date
   spines, as-of joins and merging overlapping time blocks.
9. **The Laboratory**: standard deviation, z-score outliers, imputation, binning,
   A/B tests and regression lines.

Also in place: a sandbox for your own CSVs (up to four tables, to practise joins in a rearrangeable collage), dark, light and high-contrast
themes, resizable panels, a worksheet-style SQL editor (run selection, else
all), plain-language error views, and an offline cache so the app keeps working
after one visit. Progress lives in `localStorage` and is exportable as JSON.
There is no login and no server.

Quality gates: strict TypeScript, unit tests, and an end-to-end suite that
proves every case is winnable, runs accessibility and contrast audits, and
checks offline use against a production build with the real CSP headers. See
[`docs/ROADMAP.md`](./docs/ROADMAP.md) for what is next, and
[`data-cleaning-quest-master-plan.md`](./data-cleaning-quest-master-plan.md#14-build-roadmap)
for the full plan. Architecture decisions are recorded in
[`docs/adr/`](./docs/adr/); visual specs are in
[`docs/design/`](./docs/design/).

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
