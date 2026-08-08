/**
 * Direct DOM mutation for turn-scoped state that isn't itself an animation
 * — called once per run from BossFightScreen's post-run reconciliation, not
 * per-frame, so it doesn't need the animation modules' render-avoidance
 * discipline (see docs/adr/0001-framework.md's amended guardrail 2: that
 * rule scopes to per-frame animation state, not once-per-run structural
 * state, which affliction rendering itself turned out to be — see
 * DataframeGrid.tsx, which derives `data-affliction`/`aria-label` from
 * props instead).
 */
export function markJustCleared(cellEl: HTMLElement, justCleared: boolean): void {
  if (justCleared) {
    cellEl.dataset.justCleared = "true";
  } else {
    delete cellEl.dataset.justCleared;
  }
}
