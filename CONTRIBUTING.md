# Contributing to Queryathan

Thanks for considering a contribution. This project is designed so the most
common contribution — **a new boss/case** — never requires touching engine
code or understanding Pyodide/Web Worker internals.

## The easy path: add a case

Every boss/puzzle is a JSON file conforming to the schema in
`packages/content-schema`, plus a seed dataset in `apps/web/public/datasets/`.
Read [`docs/content-authoring-guide.md`](./docs/content-authoring-guide.md)
for the full walkthrough, and [`docs/call-for-cases.md`](./docs/call-for-cases.md)
for the kinds of cases we want. In short:

1. Fork the repo.
2. Add your dataset under `apps/web/public/datasets/<world>/`, with an entry
   in that folder's `LICENSES.md` (must be CC0, public-domain, or synthetic —
   see [`SECURITY.md`](./SECURITY.md#datasetcontent-licensing)).
3. Add a case JSON under `content/cases/<world>/` and list it in
   `content/rosters/<world>.json`. For analysis-style cases, copy the pattern of
   `scripts/generate-labyrinth.mjs`: it computes the expected answer in plain
   JavaScript, so data, briefing and answer key cannot drift apart.
4. Add a known-good Python and SQL answer to `apps/web/e2e/solutions.ts` (or the
   world's `solutions-*.ts`). If your last SQL hint is a complete
   `CREATE TABLE result ...` statement, `pnpm e2e` runs it and it must win.
5. Run `pnpm validate-content` — this checks your JSON against the schema and
   is also enforced in CI.
6. Open a PR. No engine-code changes needed or expected.

Win conditions are **declarative predicates only** (e.g.
`{ "column": "age", "predicate": "no_nulls" }`), evaluated by trusted engine
code — case JSON never contains executable code. This keeps community content
PRs a data review, not a security review. See
[`docs/adr/0003-win-condition-contract.md`](./docs/adr/0003-win-condition-contract.md).

## Changes to engine/UI code

- TypeScript strict mode, no `any` without an inline justification comment.
- `pnpm lint` and `pnpm typecheck` must be clean; Husky runs lint-staged on
  commit, CI runs the full check on every PR.
- Add/extend Vitest coverage for anything touching game logic, diff
  computation, or the save system.
- `pnpm e2e` builds the app and runs the end-to-end suite (real engines,
  production headers, accessibility). A new case needs its known-good answer
  added to `apps/web/e2e/solutions.ts` (or the world's `solutions-*.ts`). New colors must keep `contrast.e2e.ts`
  passing. First run: `pnpm --filter @dcq/web exec playwright install chromium`.
- Keep GSAP/animation code out of React state: animation is driven through refs
  (see `apps/web/src/anim/` and the flight and kill sequences). Anything with
  motion must respect `prefers-reduced-motion` and, if it is a cut-scene, have a
  switch in the ANIM menu.

## Changes to architecture (new world, new engine, breaking schema change)

Open a GitHub Discussion using the [RFC template](./docs/rfc-template.md) first. This is deliberately
lightweight — a short writeup of the problem and proposed approach — not a
formal process. See existing [`docs/adr/`](./docs/adr/) entries for the level
of detail expected.

## Code of Conduct

Participation in this project is governed by our
[Code of Conduct](./CODE_OF_CONDUCT.md).
