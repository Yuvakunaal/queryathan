# Architecture

Living document — update this alongside the code, not after the fact. See
[`data-cleaning-quest-master-plan.md`](../data-cleaning-quest-master-plan.md)
for product vision and [`docs/adr/`](./adr/) for the reasoning behind
specific technical decisions.

## Current state

**Phase 2 complete.** World 1 (Boss Fights) has four playable bosses
(tutorial → two mid-bosses with stacked afflictions → a final boss
stacking all six World 1 techniques) running against a real Pyodide/pandas
Web Worker, with real diff feedback, win detection, a world-map front door,
and a `localStorage` save/XP/rank system. See
[`README.md`](../README.md#status) for the up-to-date phase marker and
[`CHANGELOG.md`](../CHANGELOG.md) for what shipped in each phase.

## Monorepo layout

```
apps/web/              the game — Vite + React app, the only deployable unit
  src/engines/            pyodide.worker.ts + pyodide-client.ts
  src/worlds/<world>/     one dir per world: components, theme.css, world-local logic
  src/anim/<world>/       one dir per world: GSAP choreography
  src/lib/                world-agnostic pure game logic (diff, afflictions, win-condition eval)
  public/datasets/<world>/   seed CSVs + LICENSES.md
packages/content-schema/   Zod schema + inferred TS types for case JSON
packages/engine-adapters/  typed protocol (protocol.ts) + RPC client (rpc.ts) shared between main thread & worker
packages/ui-kit/           shared design-system primitives (grows on 2nd use — still empty)
content/cases/          community-contributable case JSON, one dir per world
content/rosters/        <world>.json — the world's boss sequence (fight order), one file per world
```

Packages resolve each other via `workspace:*` + package `main`/`types`
fields — never via tsconfig `paths` aliases, which lie to the bundler.
`tsc -b` at the root walks the full project-reference graph in dependency
order.

## Execution model (security-critical — see `SECURITY.md`)

User-typed Python/SQL never runs on the main thread:

```
main thread (React)  <—typed messages (packages/engine-adapters)—>  Web Worker (Pyodide/sql.js)
```

`packages/engine-adapters/src/protocol.ts` is the single source of truth for
the message shapes both sides agree on — main thread and worker each import
it, neither redeclares it. `rpc.ts`'s `EngineRpcClient` correlates
`init-case`/`run-code`/`cancel` requests with `run-result`/`run-error`
responses (timeout + best-effort cancel — see its doc comment for why true
mid-execution interrupt isn't available). Real interpreter errors are
surfaced verbatim in `RunErrorResponse`, never rewritten into a friendlier
message — verified against a real Python `KeyError` traceback.

**Pyodide asset delivery** is split: the interpreter/stdlib is self-hosted
and checksum-verified (`scripts/fetch-pyodide.mjs`, wired to `postinstall`);
pandas/numpy and their transitive deps are loaded by direct, pinned-version
URL from jsdelivr, since self-hosting the full ~400MB distribution would
conflict with the lazy-load/fast-first-paint requirement. See
[ADR 0004](./adr/0004-pyodide-package-delivery.md) for the full reasoning
and the matching `connect-src` CSP exception in `vercel.json`.

**Session model**: a boss fight keeps one persistent Python namespace across
runs — `df` is loaded once via `init-case` and each `run-code` submission
executes against whatever `df` currently is, so cumulative edits behave
like a real notebook cell-by-cell, not a fresh interpreter per run.

Sandbox/freeplay mode (Phase 6) adds a sandboxed cross-origin `<iframe>`
layer around the worker for user-uploaded files — not built yet.

## Content pipeline

A "case" (boss/puzzle) is a JSON file validated against
`packages/content-schema`. Win conditions are declarative predicates, not
executable code — see
[`docs/adr/0003-win-condition-contract.md`](./adr/0003-win-condition-contract.md)
for why. `scripts/validate-content.mjs` checks every file under
`content/cases/` against the schema and is a merge-blocking CI step.

Case JSON lives under `content/` (its own workspace package, so it's a
clean single source of truth reviewable independent of engine code) but is
consumed by the running app via
`content/cases/boss-fights/w1-01-nul-sentinel.json` at runtime, not bundled
at compile time — `apps/web/vite.config.ts` has a small custom plugin
(`dcq-content-cases`) that serves the whole `content/` directory (cases and
rosters) in dev and copies it into `dist/` at build time. (An earlier
attempt used `vite-plugin-static-copy`; it didn't serve files during
`vite dev`, so it was replaced with this in-house plugin for reliability.)
The content directory name for a world is its `WorldId` value exactly
(`boss-fights`, not `world-1`) — the two diverged briefly during Phase 2
until the mismatch broke roster loading in a real-browser check; keeping
them identical avoids needing a separate directory-slug mapping.

## Rendering: the dataframe is the battlefield

`DataframeGrid.tsx` virtualizes the real dataframe (TanStack Virtual) —
there is no separate boss sprite. Affliction state (`data-affliction`,
`aria-label`, the per-kind badge glyph) is derived from React props each
render, not direct DOM mutation — see ADR 0001's amended guardrail 2, which
scopes the "GSAP/DOM, never React state" rule to per-frame _animation_
state specifically; once-per-turn structural state like "which cell is
afflicted" is fine as props. `afflictionDom.ts` only handles the one thing
that's genuinely turn-scoped and not itself an animation: the
`data-just-cleared` ledger-mark outline. Which cell maps to which affliction
_kind_ (null/duplicate/whitespace/wrong-dtype/outlier/bad-date) comes from
`lib/affliction-cells.ts`'s `afflictionCellMap`, built from a case's full
`winCondition.all`, not a single hardcoded column (Phase 2). The HP "bar"
(`HpHeatmap.tsx`) is a per-row auto-binned heatmap of where afflictions
cluster, not an aggregate gauge — see
[`docs/design/world-1-visual-spec.md`](./design/world-1-visual-spec.md) §6
for why an aggregate bar was rejected during design; Phase 2 extended it to
color each bin by its dominant affliction kind rather than blending hues,
per [`docs/design/world-1-phase-2-visual-spec.md`](./design/world-1-phase-2-visual-spec.md) §3.

Diff feedback appears in two synchronized places driven by one change list
(`lib/diff.ts`): the grid's per-cell red/green flash
(`anim/world1/diffFlash.ts`) and the console's `-`/`+` log
(`DiffConsole.tsx`) — the latter is the durable, transferable-skill record
after the flash decays. `diffGrids` matches rows by their real pandas index
value (`ResultGrid.index`), not array position — a Phase 1 positional
version was explicitly scoped to "revisit once `drop_duplicates`/`dropna`
can change row count," and Phase 2's duplicate-dropping content needed
exactly that fix (a naive positional diff would misattribute values across
every row after a drop). See
[`docs/adr/0006-row-identity-diffing.md`](./adr/0006-row-identity-diffing.md).

## Progression: save data, XP, and ranks

`apps/web/src/lib/save.ts` owns the entire save format — a single
`localStorage` key (`dcq.save`), versioned (`version: 1`) so a future
schema change can migrate rather than silently discarding old saves.
Per-world progress is `{ clearedCaseIds, masteredTechniques, xp }`;
`App.tsx` is the only component that reads/writes it, passing derived
values (rank label, save data) down as props — `BossFightScreen` and
`WorldMapScreen` never touch `localStorage` directly. Export/import is
plain JSON via `Blob`/`<input type="file">`, validated through the same
Zod schema on the way back in, so a hand-edited or corrupted file fails
closed (`importSaveFromJson` returns `null`) instead of crashing the app.
Ranks are computed from _distinct techniques mastered_, not cases
cleared or XP — see plan §6 — with per-world tier tables in `save.ts`;
only `boss-fights` has real tiers so far, every other `WorldId` falls back
to a single `"Recruit"` tier until that world exists.

## Styling

CSS Modules, scoped per world under `apps/web/src/worlds/<world>/theme.css`.
Global tokens (`apps/web/src/styles/tokens.css`) stay world-agnostic; each
world's visual language lives locally, never as a shared theme variant. Every
color pairing that carries meaning (affliction status, diff add/delete)
carries a non-color signal too (glyph, pattern, or height) — see the design
spec's colorblind-safety section.

## Animation

All GSAP usage lives under `apps/web/src/anim/<world>/`. Animation state is
never stored in React state — GSAP drives the DOM/CSS custom properties
directly via refs, so 60fps interactions don't depend on framework
reactivity. See [`docs/adr/0001-framework.md`](./adr/0001-framework.md).

One exception, deliberate: the idle affliction-cell pulse is a plain CSS
`@keyframes` animation, not GSAP — cells are created/destroyed constantly by
grid virtualization, and a CSS animation attaches/detaches with the element
for free, while a GSAP tween would need per-cell register/kill bookkeeping
for an effect that's purely ambient. GSAP owns every _event-driven_
animation; CSS owns this one _ambient_ one. See `DataframeGrid.module.css`.

Every animation has a `prefers-reduced-motion` branch that keeps the
feedback (color, glyph, count changes) and removes only the motion — never a
silent drop of the signal.

## Deployment

Vercel, headers declared in [`/vercel.json`](../vercel.json). See
[`docs/adr/0002-hosting.md`](./adr/0002-hosting.md) for why GitHub Pages
isn't viable given the CSP requirement.
