# ADR 0003: Declarative win-condition predicates, not embedded code

**Status:** Accepted

## Context

Section 3 of the plan requires that the game evaluate the _result_ of a
player's code, never a hardcoded "correct answer." How a case JSON expresses
"the affliction cleared" has a security consequence the plan doesn't address:

- **Option A — embedded Python assertion snippets in case JSON.** Maximally
  expressive, but means community-contributed content ships executable
  Python into every player's worker. Reviewing a content PR becomes a
  security review, not a data review — undermining the "add a case with just
  JSON" contributor pitch (Section 12).
- **Option B — declarative structural predicates** (e.g.
  `{ "predicate": "no_nulls", "column": "email" }`) evaluated by trusted,
  first-party engine code against the result frame.

## Decision

**Option B for Phases 1–5.** Case JSON's `winCondition` is an `all: []` list
of predicates from a fixed, engine-defined vocabulary
(`packages/content-schema/src/case.ts`). New predicates are added by
maintainers extending the schema, not by case authors writing code.

An explicit escape hatch — a `trustedAssertion` variant usable only by
first-party, maintainer-reviewed cases — is reserved for World 5 (The
Foundry), where benchmark-style comparisons may need more expressiveness
than a fixed predicate vocabulary can offer. It does not exist yet; add it
only when a Foundry case genuinely needs it, gated by a lint rule in
`scripts/validate-content.mjs` that rejects `trustedAssertion` outside an
allowlisted path.

## Consequence

- `pnpm validate-content` (CI-gated) can fully validate any community case
  PR without executing anything.
- Predicate vocabulary growth is a maintainer-reviewed, versioned surface —
  breaking it is a breaking change to every case file ever written, so it's
  treated with the same care as a public API.
