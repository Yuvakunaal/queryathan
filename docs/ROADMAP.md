# Roadmap: finishing Data Cleaning Quest

Status as of 2026-10-03: Phases 1-3 are built (World 1, Python and SQL).
Phase 3 is still uncommitted in the working tree. Typecheck, lint and all
tests pass. The roster screen was redesigned in this pass.

## Next, in order

1. **Phase 3.5: polish World 1 (done: roster, victory panel, hints, tutorial, mobile fixes).**
   Commit Phase 3. Redesign the fight screen to match the new roster
   (spacing, hierarchy, mobile layout). Add a first-time tutorial overlay,
   win/lose celebration screens, and keyboard shortcuts (Cmd+Enter to run).
   Add hints and a "show solution" option.
2. **Phase 4: World 2, The Vault (built: 3 cases, both engines, navy and brass theme).**
   Still to do: more cases (aim for 5), and the signature combination-lock
   tumbler display in place of the shared HP strip.
3. **Phase 5: Worlds 3 and 4 (done).** World 3 (The Twins, joins) is done: 4 cases,
   multi-table engine support. World 4 (The Architect: pivot, melt, JSON) is done too: 4 cases.
4. **Phase 6: World 5 and sandbox.** Sandbox (bring your own CSV) is done. World 5, The Foundry (benchmark HUD, timing and memory readouts, reference-solution comparison), is next.
5. **Phase 7: hardening.** Playwright E2E in CI, Lighthouse budgets, service
   worker caching for WASM, CSP and accessibility audits.
6. **Phase 8: open-source launch.** Contribution flow, RFC template, call
   for cases.
7. **Phase 9: sustain.** Sound, shareable rank cards, optional cloud sync.

## UI/UX backlog (apply to every world)

- One shared component layer in `packages/ui-kit` (button, chip, panel).
- Per-world distinct visual language (plan principle 4).
- Empty, loading and error states with a clear next action.
- Touch and mobile layout for the fight screen (editor and grid stacking).
- Focus order and screen-reader pass on every new screen.
