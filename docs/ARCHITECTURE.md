# Architecture

Living document — update this alongside the code, not after the fact. See
[`data-cleaning-quest-master-plan.md`](../data-cleaning-quest-master-plan.md)
for product vision and [`docs/adr/`](./adr/) for the reasoning behind
specific technical decisions.

## Current state

Repo scaffold only (pre-Phase-1-implementation). `apps/web` renders a static
placeholder shell. No Pyodide worker, no boss content, no save system exist
yet — see [`README.md`](../README.md#status) for the up-to-date phase marker.

## Monorepo layout

```
apps/web/              the game — Vite + React app, the only deployable unit
packages/content-schema/   Zod schema + inferred TS types for case JSON
packages/engine-adapters/  typed protocol shared between main thread & worker
packages/ui-kit/           shared design-system primitives (grows on 2nd use)
content/cases/          community-contributable case JSON, one dir per world
```

Packages resolve each other via `workspace:*` + package `main`/`types`
fields — never via tsconfig `paths` aliases, which lie to the bundler.
`tsc -b` at the root walks the full project-reference graph in dependency
order.

## Execution model (security-critical — see `SECURITY.md`)

User-typed Python/SQL never runs on the main thread. The intended shape
(implemented in the Phase 1 build, not yet in this scaffold):

```
main thread (React)  <—typed messages (packages/engine-adapters)—>  Web Worker (Pyodide/sql.js)
```

`packages/engine-adapters/src/protocol.ts` is the single source of truth for
the message shapes both sides agree on — main thread and worker each import
it, neither redeclares it. Real interpreter errors are surfaced verbatim in
`RunErrorResponse`, never rewritten into a friendlier message.

Sandbox/freeplay mode (Phase 6) adds a sandboxed cross-origin `<iframe>`
layer around the worker for user-uploaded files.

## Content pipeline

A "case" (boss/puzzle) is a JSON file validated against
`packages/content-schema`. Win conditions are declarative predicates, not
executable code — see
[`docs/adr/0003-win-condition-contract.md`](./adr/0003-win-condition-contract.md)
for why. `scripts/validate-content.mjs` checks every file under
`content/cases/` against the schema and is a merge-blocking CI step.

## Styling

CSS Modules, scoped per world under `apps/web/src/worlds/<world>/theme.css`.
Global tokens (`apps/web/src/styles/tokens.css`) stay world-agnostic; each
world's visual language lives locally, never as a shared theme variant.

## Animation

All GSAP usage lives under `apps/web/src/anim/`. Animation state is never
stored in React state — GSAP drives the DOM/CSS custom properties directly
via refs, so 60fps interactions don't depend on framework reactivity. See
[`docs/adr/0001-framework.md`](./adr/0001-framework.md).

## Deployment

Vercel, headers declared in [`/vercel.json`](../vercel.json). See
[`docs/adr/0002-hosting.md`](./adr/0002-hosting.md) for why GitHub Pages
isn't viable given the CSP requirement.
