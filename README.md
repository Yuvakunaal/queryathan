<div align="center">

# Data Cleaning Quest

**Fight your data clean.**

Learn real **pandas** and real **SQL** by playing. Nine worlds, 45 hand-built cases, real engines
running in your browser. No account. No server. Nothing to install.

[![CI](https://github.com/Yuvakunaal/data-cleaning-quest/actions/workflows/ci.yml/badge.svg)](https://github.com/Yuvakunaal/data-cleaning-quest/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Runs offline](https://img.shields.io/badge/runs-offline-2ea44f)
![No backend](https://img.shields.io/badge/backend-none-lightgrey)

<img src="./docs/images/hub-dark.png" alt="The Data Cleaning Quest home screen: nine worlds, each a named planet" width="820">

</div>

## What is this?

Data Cleaning Quest is a game for learning the part of data work that takes most of the time: getting messy
tables right, and then making them answer questions. Every case is a real table with a real problem in it.
You write **real Python (pandas)** or **real SQL (SQLite)**, press Run, and watch the table change. Each
win comes with a short cinematic, so the work feels like a quest rather than a worksheet.

- **Real engines, not simulations.** Python runs in [Pyodide](https://pyodide.org) (WebAssembly pandas) and SQL
  in [sql.js](https://sql.js.org) (WebAssembly SQLite), each isolated in its own Web Worker. The errors you see are the real errors, with a plain-English explanation on top.
- **Every case works in both languages.** The same problem, solved with pandas or with SQL. The end-to-end test suite proves each case is winnable in both, and that the starter code does not already win.
- **No backend, no login, no tracking.** Progress lives in your browser (`localStorage`) and can be exported as a file. After one visit the app works fully offline.
- **Judged by exact answers.** Cases are won by declarative checks (clean cells, or an exact answer table), never by matching your code, so any correct approach wins.
- **Built to be accessible.** Dark, light and high-contrast themes, adjustable text size, keyboard use throughout, reduced-motion support, and automated WCAG audits in CI.

<p align="center">
  <img src="./docs/images/fight-dark.png" alt="A fight: the task and checklist on the left, the editor below it, the live data table on the right" width="49%">
  <img src="./docs/images/fight-light.png" alt="The same fight in the light theme" width="49%">
</p>

## The nine worlds

Each world is a planet with its own colours, its own heads-up display and its own theme. Choosing one launches
a rocket flight to it (skippable, and optional).

| #   | World           | You practise                                                                                     | Cases |
| --- | --------------- | ------------------------------------------------------------------------------------------------ | ----- |
| 1   | **Ember Reach** | Cleaning: nulls, duplicates, whitespace and casing, wrong types, outliers, bad dates             | 4     |
| 2   | **Cryptara**    | Patterns: regular expressions, extraction, broken text encodings                                 | 5     |
| 3   | **Geminora**    | Joins: key mismatches, repeated rows, joining two to four tables                                 | 6     |
| 4   | **Atlas Spire** | Reshaping: melt, pivot, nested JSON                                                              | 4     |
| 5   | **Cinderforge** | Speed: vectorising, window functions, timed against a stopwatch with bronze, silver, gold stamps | 2     |
| 6   | **Lumenfield**  | Analysis: grouping, ranking, moving averages, cohorts, sessions, funnels                         | 6     |
| 7   | **Minos Deep**  | CTEs and recursion: `WITH`, anti-joins, org charts, bills of materials, set logic, streaks       | 6     |
| 8   | **Chronopolis** | Time: mixed date formats, business days, time zones, date spines, as-of joins, interval merging  | 6     |
| 9   | **Helix-9**     | Statistics: spread, z-score outliers, imputation, binning, A/B tests, regression                 | 6     |

(Worlds 1 to 5 were first known as Boss Fights, The Vault, The Twins, The Architect and The Foundry; those
names survive as the ids in `content/` and in saved progress.)

There is also a **Sandbox**: bring your own CSV (up to four tables, joined in a rearrangeable collage) and
explore it with pandas or SQL. Nothing is uploaded.

<p align="center">
  <img src="./docs/images/flight.png" alt="The rocket warping towards a planet" width="49%">
  <img src="./docs/images/landing.png" alt="The rocket landing on the planet's surface" width="49%">
</p>

## Quick start

You need [Node](https://nodejs.org) (the version in [`.nvmrc`](./.nvmrc)) and [pnpm](https://pnpm.io) (via Corepack).

```bash
git clone https://github.com/Yuvakunaal/data-cleaning-quest.git
cd data-cleaning-quest
corepack enable
pnpm install      # also fetches the pinned, checksum-verified Pyodide runtime (~14 MB)
pnpm dev          # http://localhost:5173
```

| Command                 | What it does                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm dev`              | Run the app locally                                                                              |
| `pnpm build`            | Type-check and build the production bundle                                                       |
| `pnpm typecheck`        | `tsc -b` across the whole workspace                                                              |
| `pnpm lint`             | ESLint (strict, type-aware)                                                                      |
| `pnpm test`             | Unit tests (Vitest)                                                                              |
| `pnpm validate-content` | Check every case and roster against the schema                                                   |
| `pnpm e2e`              | Build, then run the Playwright suite against the production build with the real security headers |

First e2e run: `pnpm --filter @dcq/web exec playwright install chromium`.

## How it works

```
 case JSON  ──►  declarative win predicates (trusted code judges; the JSON never runs)
    │
    ▼
 React 19 UI ◄──typed messages──►  Web Worker: Pyodide (pandas)   or   Web Worker: sql.js (SQLite)
    │                                  one persistent session per fight, like a notebook
    ▼
 GSAP animation (outside React's render loop), CodeMirror 6 editor, virtualised data grid
```

- **Content is data.** A case is one JSON file plus a small synthetic dataset. Adding one needs no engine knowledge.
- **Answers are verified three ways.** The expected table is computed in plain JavaScript from the briefing, then real SQL and real pandas must each reach it.
- **Safe by construction.** User code only ever runs inside a Web Worker, behind a strict Content-Security-Policy. See [`SECURITY.md`](./SECURITY.md).

## Quality

- Strict TypeScript, ESLint, Prettier, Husky pre-commit.
- 298 unit tests (Vitest) and 300+ end-to-end tests (Playwright) on a production build served with the real headers:
  every case in both engines, near-miss wrong answers, every complete SQL hint, offline use, layout at phone widths,
  axe-core accessibility scans in both themes, and WCAG AA contrast on every colour token.
- Lighthouse budgets in CI.

## Stack

React 19 · TypeScript (strict) · Vite · Pyodide · sql.js · CodeMirror 6 · GSAP · TanStack Virtual · Zod · Vitest · Playwright · pnpm workspaces

## Repository layout

```
apps/web/                 the game (Vite + React)
  src/engines/              Pyodide and SQLite workers and their clients, CSV loader, SQL friendly-function layer
  src/worlds/boss-fights/   screens, HUDs, themes, the flight and kill sequences (shared by every world)
  src/anim/                 GSAP choreography
  src/lib/                  pure game logic: diffing, win conditions, save data, sound, world metadata
  e2e/                      Playwright suites and the known-good answer for every case
  public/datasets/          synthetic CC0 datasets, one folder per world
packages/content-schema/  Zod schema and types for case JSON
packages/engine-adapters/ typed worker protocol and RPC client
content/cases/            the cases, one folder per world
content/rosters/          the fight order of each world
scripts/                  dataset and case generators, content validation, Pyodide fetch
docs/                     architecture, authoring guide, ADRs, design specs, roadmap
```

## Contributing

A new case is **a JSON file plus a dataset**. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md), the
[authoring guide](./docs/content-authoring-guide.md) and the [call for cases](./docs/call-for-cases.md).
Bigger changes (a new world, a schema change) start with a short [RFC](./docs/rfc-template.md) in Discussions.
Please read the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Documentation

[Architecture](./docs/ARCHITECTURE.md) · [Authoring guide](./docs/content-authoring-guide.md) ·
[Decision records](./docs/adr/) · [Roadmap](./docs/ROADMAP.md) · [Changelog](./CHANGELOG.md) ·
[Original product plan](./data-cleaning-quest-master-plan.md)

## Security

This app runs code typed by the player. See [`SECURITY.md`](./SECURITY.md) for the sandboxing model, the CSP
and how to report a vulnerability.

## Acknowledgements

Built on the shoulders of [Pyodide](https://pyodide.org), [sql.js](https://sql.js.org),
[pandas](https://pandas.pydata.org), [SQLite](https://sqlite.org), [CodeMirror](https://codemirror.net),
[GSAP](https://gsap.com), [TanStack Virtual](https://tanstack.com/virtual) and [React](https://react.dev).
All datasets are synthetic and released under CC0.

## License

[MIT](./LICENSE) for the code. Datasets are CC0.
