# ADR 0001: React over Svelte

**Status:** Accepted

## Context

The plan leaves the framework choice open (React for contributor familiarity
vs. Svelte for a leaner compiled-output footprint). The project's survival
depends on outside contributors eventually building worlds 2–5, each with its
own distinct UI.

## Decision

React 19 + TypeScript.

## Reasoning

- Svelte's bundle/runtime advantage doesn't bind on the hot paths that
  matter (boss-hit recoil, diff-flash, the Foundry benchmark readout) —
  those must bypass framework reactivity entirely in either framework, with
  GSAP driving the DOM imperatively via refs.
- The open-source contributor pool for React is significantly larger, which
  matters more than bundle size for a project whose growth model depends on
  strangers shipping new worlds.
- CodeMirror 6 is mounted directly via a ref either way (custom extensions
  needed regardless); GSAP's `@gsap/react` `useGSAP()` hook handles React's
  StrictMode double-invoke correctly.

## Guardrails this decision requires

1. All GSAP lives in `apps/web/src/anim/`, driving the DOM via refs — never
   through React state.
2. **Per-frame animation state** — anything an active GSAP timeline mutates
   on every tick (diff-flash opacity/position, HP-shatter transforms, boss
   recoil) — is applied via direct DOM/CSS-variable mutation, never
   `setState`, since that's the path that would actually cost 60fps.
   **Amended in Phase 1**: this guardrail does not extend to state that
   changes once per turn, not per frame. `DataframeGrid`'s
   `data-affliction`/`aria-label` are derived from props in the normal React
   render path — at ~20–30 visible virtualized rows, updating those once
   per run is not the cost this guardrail exists to prevent, and routing it
   through direct DOM mutation instead (as Phase 1 originally scaffolded in
   `afflictionDom.ts`) was unused dead code by the time of the Phase 1
   completeness review. Removed rather than wired up for its own sake.
3. A Lighthouse/interaction performance budget lands in CI (Phase 7) so a
   regression here is caught mechanically.

## Revisit trigger

None currently planned. Reversing this after Phase 4 would mean rewriting
every world's UI — treat as effectively final.
