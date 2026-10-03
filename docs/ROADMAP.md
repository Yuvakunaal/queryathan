# Roadmap: finishing Data Cleaning Quest

Status as of 2026-10-03: Phases 1-3 are built (World 1, Python and SQL).
Phase 3 is still uncommitted in the working tree. Typecheck, lint and all
tests pass. The roster screen was redesigned in this pass.

## Next, in order

1. **Phase 3.5: polish World 1 (mostly done: roster, victory panel, hints, mobile fixes; first-time tutorial overlay and keyboard shortcut help remain).**
   Commit Phase 3. Redesign the fight screen to match the new roster
   (spacing, hierarchy, mobile layout). Add a first-time tutorial overlay,
   win/lose celebration screens, and keyboard shortcuts (Cmd+Enter to run).
   Add hints and a "show solution" option.
2. **Phase 4: World 2, The Vault.** Regex and encoding content. Navy and
   brass palette, combination-lock mechanic. Needs ~5 cases in both engines.
3. **Phase 5: Worlds 3 and 4.** Joins (needs multi-table datasets in the
   engine protocol) and reshaping (pivot, melt, JSON).
4. **Phase 6: World 5 and sandbox.** Benchmark HUD, bring-your-own-CSV mode.
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
