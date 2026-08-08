# World 1 — Boss Fights: Visual Spec (Phase 2 slice)

**Status:** Accepted — build to this exactly.
**Authored by:** Sonnet 5, not Opus. **This is a documented process deviation, not a silent one.** The project's standing instruction is that Opus owns visual/motion design and Sonnet implements against it. When this phase started, the Opus design-spec agent hit a session quota (resets 8pm IST) mid-task. Given the choice of waiting ~20 hours, proceeding with the deviation flagged, or halting Phase 2 entirely, the user explicitly chose to have Sonnet proceed with visual design now, logged as an exception. Treat every decision below with the same scrutiny you'd give an unreviewed PR — nothing here has had a second pair of eyes on it the way `world-1-visual-spec.md` did.
**Scope:** Phase 2 only (roadmap §14): mid-bosses with stacked afflictions, a Kaggle-style final boss, a world-map/roster screen, and XP/rank display. Extends `world-1-visual-spec.md` — that document is still authoritative for everything it already covers (palette base, typography, CRT, layout grid, diff-flash, GSAP conventions, the ASCII sigil). This document only adds what Phase 1 didn't need.
**Audience:** implementing engineer (also Sonnet, same session). Every number here is a decision, not a suggestion.

---

## 0. What Phase 1 already decided for us

This is the single biggest reason the deviation above is lower-risk than it sounds: **Opus already designed most of Phase 2's visual language in Phase 1**, on purpose. `world-1-visual-spec.md` §1.2 defines and justifies the full six-status affliction palette — hue, badge glyph, and fill pattern for all six affliction kinds — and says explicitly: _"Define all six now in theme.css so Phase 2 does not re-open the palette."_ That happened; `theme.css` already ships all six colors. This spec does not relitigate that table. It implements the five statuses Phase 1 left unrendered, and designs the genuinely new surfaces (world map, XP/rank, mid/final-boss framing) by extension of Phase 1's established system, not invention of a new one.

| Predicate kind(s)                    | Affliction kind (`data-affliction`) | Status token          | Badge glyph        | Pattern (from Phase 1 §1.2) |
| ------------------------------------ | ----------------------------------- | --------------------- | ------------------ | --------------------------- |
| `no_nulls`                           | `null`                              | `--w1-status-null`    | literal `NaN` text | 45° hatch (**shipped**)     |
| `no_duplicates`                      | `dup`                               | `--w1-status-dup`     | `=`                | horizontal 3px bands        |
| `valid_dtype` (int/float/bool)       | `dtype`                             | `--w1-status-dtype`   | `#`                | 3px dotted underline        |
| `no_whitespace`, `consistent_casing` | `ws`                                | `--w1-status-ws`      | `_`                | leading/trailing tick marks |
| `no_outliers`                        | `outlier`                           | `--w1-status-outlier` | `^`                | 135° hatch                  |
| `valid_dtype` (datetime)             | `date`                              | `--w1-status-date`    | `@`                | vertical 3px bands          |

Two predicates collapse onto one visual kind (`ws`): the master plan's own content table (§4) lists "casing/whitespace" as a single row, and Phase 1's palette table already anticipated exactly one status for both — a case combining `no_whitespace` and `consistent_casing` on the same column should read as one problem, not two competing badges. `valid_dtype` splits by target: `dtype: "datetime"` gets the `date` treatment (bad-date content, per plan §4), every other target dtype gets `dtype`.

---

## 1. Palette additions

Phase 1 defined the six hex values but only shipped `-rgb` companions (needed for `rgb(… / <alpha>)` pattern composition) for `null`. Add the other five to `theme.css`, immediately after the existing status block:

```css
[data-world="boss-fights"] {
  --w1-status-dup-rgb: 111 200 255;
  --w1-status-dtype-rgb: 240 228 66;
  --w1-status-ws-rgb: 93 217 193;
  --w1-status-outlier-rgb: 255 158 74;
  --w1-status-date-rgb: 245 143 208;
}
```

High-contrast overrides (`[data-dcq-contrast="high"]`, extending Phase 1 §1.4's block — that block currently only overrides `--w1-status-null`):

```css
[data-dcq-contrast="high"] [data-world="boss-fights"] {
  --w1-status-dup: #a8dfff;
  --w1-status-dtype: #f5ec8f;
  --w1-status-ws: #9be8d8;
  --w1-status-outlier: #ffbf8a;
  --w1-status-date: #f8bce3;
}
```

Lightened the same way Phase 1 lightened `--w1-status-null` (`#c77dff` → `#e0a8ff`) — pushed toward the light end while staying inside each hue's Okabe–Ito family, so the six stay mutually separable at high contrast too.

No new typography, no new CRT behavior, no new layout grid — Phase 2 fits entirely inside Phase 1's frame.

---

## 2. Multi-affliction cell rendering

### 2.1 Markup — one badge slot added to Phase 1's cell

Phase 1 §5.1's cell markup gains exactly one addition: a badge span for the five non-null kinds (`null` keeps using the literal `NaN` text as its own badge, per Phase 1 — it gets nothing added here).

```html
<div class="cell" role="gridcell" data-affliction="dup" style="--w1-cell-seed: 6">
  <span class="afflictionBadge" aria-hidden="true">=</span>
  <span data-role="new">a@b.com</span>
</div>
```

The badge is `aria-hidden` — the accessible identity of the affliction is carried by `aria-label` (§2.4 below), same as Phase 1's null cells.

```css
.afflictionBadge {
  position: absolute;
  top: 1px;
  left: 2px;
  font: 500 9px/1 var(--w1-font-text);
  pointer-events: none;
}
.cell[data-affliction="dup"] .afflictionBadge {
  color: var(--w1-status-dup);
}
.cell[data-affliction="dtype"] .afflictionBadge {
  color: var(--w1-status-dtype);
}
.cell[data-affliction="ws"] .afflictionBadge {
  color: var(--w1-status-ws);
}
.cell[data-affliction="outlier"] .afflictionBadge {
  color: var(--w1-status-outlier);
}
.cell[data-affliction="date"] .afflictionBadge {
  color: var(--w1-status-date);
}
```

The badge sits top-left, clear of the vertically-centered value text (which stays left/right-aligned per column per Phase 1 §3.3) — it never overlaps real data.

### 2.2 Rest-state signals — same three-plus-one structure as Phase 1 §5.2, per kind

Every kind keeps Phase 1's exact structure: signal 1 (badge/value) + signal 2 (static pattern) + signal 3 (dashed border) + signal 4 (animated wash, redundant). Only the pattern differs per kind, taken directly from the table in §0.

```css
.cell[data-affliction="dup"],
.cell[data-affliction="dtype"],
.cell[data-affliction="ws"],
.cell[data-affliction="outlier"],
.cell[data-affliction="date"] {
  position: relative;
  border: 1px dashed rgb(var(--w1-affliction-rgb) / 0.55);
  will-change: opacity;
}
.cell[data-affliction="dup"] {
  --w1-affliction-rgb: var(--w1-status-dup-rgb);
}
.cell[data-affliction="dtype"] {
  --w1-affliction-rgb: var(--w1-status-dtype-rgb);
}
.cell[data-affliction="ws"] {
  --w1-affliction-rgb: var(--w1-status-ws-rgb);
}
.cell[data-affliction="outlier"] {
  --w1-affliction-rgb: var(--w1-status-outlier-rgb);
}
.cell[data-affliction="date"] {
  --w1-affliction-rgb: var(--w1-status-date-rgb);
}

/* signal 4 — the pulsing wash, identical mechanism to Phase 1 §5.2, generalized to any kind via the --w1-affliction-rgb indirection above */
.cell[data-affliction="dup"]::before,
.cell[data-affliction="dtype"]::before,
.cell[data-affliction="ws"]::before,
.cell[data-affliction="outlier"]::before,
.cell[data-affliction="date"]::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgb(var(--w1-affliction-rgb) / 1);
  opacity: 0.1;
  animation: w1-affliction-pulse 2200ms cubic-bezier(0.45, 0, 0.55, 1) infinite;
  animation-delay: calc(var(--w1-cell-seed, 0) * -137ms);
  pointer-events: none;
}

/* signal 2 — per-kind pattern */
.cell[data-affliction="dup"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0 5px,
    rgb(var(--w1-status-dup-rgb) / 0.3) 5px 6px
  );
  pointer-events: none;
}
.cell[data-affliction="dtype"]::after {
  content: "";
  position: absolute;
  inset: auto 4px 2px 4px;
  height: 0;
  border-bottom: 2px dotted rgb(var(--w1-status-dtype-rgb) / 0.6);
  pointer-events: none;
}
.cell[data-affliction="ws"]::after {
  content: "";
  position: absolute;
  inset: 3px 0;
  background:
    linear-gradient(
        rgb(var(--w1-status-ws-rgb) / 0.55),
        rgb(var(--w1-status-ws-rgb) / 0.55)
      )
      left / 2px 100% no-repeat,
    linear-gradient(
        rgb(var(--w1-status-ws-rgb) / 0.55),
        rgb(var(--w1-status-ws-rgb) / 0.55)
      )
      right / 2px 100% no-repeat;
  pointer-events: none;
}
.cell[data-affliction="outlier"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    135deg,
    transparent 0 5px,
    rgb(var(--w1-status-outlier-rgb) / 0.3) 5px 6px
  );
  pointer-events: none;
}
.cell[data-affliction="date"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to right,
    transparent 0 5px,
    rgb(var(--w1-status-date-rgb) / 0.3) 5px 6px
  );
  pointer-events: none;
}
```

`ws`'s "leading/trailing tick marks" reads as two short vertical ticks at the cell's left and right edges — evoking the literal whitespace character being flagged at the boundary of the value, which is the actual defect (leading/trailing space).

### 2.3 High-contrast and reduced-motion — same overrides as Phase 1 §5.4, generalized

```css
@media (prefers-reduced-motion: reduce) {
  .cell[data-affliction="dup"]::before,
  .cell[data-affliction="dtype"]::before,
  .cell[data-affliction="ws"]::before,
  .cell[data-affliction="outlier"]::before,
  .cell[data-affliction="date"]::before {
    animation: none;
    opacity: 0.2;
  }
}

[data-dcq-contrast="high"] .cell[data-affliction="dup"],
[data-dcq-contrast="high"] .cell[data-affliction="dtype"],
[data-dcq-contrast="high"] .cell[data-affliction="ws"],
[data-dcq-contrast="high"] .cell[data-affliction="outlier"],
[data-dcq-contrast="high"] .cell[data-affliction="date"] {
  border: 2px solid rgb(var(--w1-affliction-rgb));
}
[data-dcq-contrast="high"] .cell[data-affliction="dup"]::before,
[data-dcq-contrast="high"] .cell[data-affliction="dtype"]::before,
[data-dcq-contrast="high"] .cell[data-affliction="ws"]::before,
[data-dcq-contrast="high"] .cell[data-affliction="outlier"]::before,
[data-dcq-contrast="high"] .cell[data-affliction="date"]::before {
  opacity: 0.14;
}
[data-dcq-contrast="high"] .cell[data-affliction="dup"]::after,
[data-dcq-contrast="high"] .cell[data-affliction="dtype"]::after,
[data-dcq-contrast="high"] .cell[data-affliction="ws"]::after,
[data-dcq-contrast="high"] .cell[data-affliction="outlier"]::after,
[data-dcq-contrast="high"] .cell[data-affliction="date"]::after {
  display: none;
}
```

`forced-colors: active` (Windows High Contrast) gets the same treatment Phase 1 §4.2 already applies at the world level — decorative backgrounds drop, and every afflicted cell falls back to `2px dashed CanvasText`. Under forced-colors the **badge glyph is the only identifying signal** for the five non-null kinds (color itself is stripped by the OS), which is exactly why §2.1 made the badge real text content rather than a background-image or icon font — `CanvasText` renders it like any other text, with zero extra work.

### 2.4 Accessible labels

Extends Phase 1 §3.6's grid a11y pattern. Afflicted cells get `aria-label` describing kind, column, row, and value:

| Kind      | Label pattern                                                    |
| --------- | ---------------------------------------------------------------- |
| `null`    | `"{column}, row {n}, missing value"` (unchanged from Phase 1)    |
| `dup`     | `"{column}, row {n}, duplicate row"`                             |
| `dtype`   | `"{column}, row {n}, wrong data type, value {value}"`            |
| `ws`      | `"{column}, row {n}, whitespace or casing issue, value {value}"` |
| `outlier` | `"{column}, row {n}, out of range, value {value}"`               |
| `date`    | `"{column}, row {n}, invalid date, value {value}"`               |

### 2.5 Overlapping predicates on one cell — a scoping rule, not a visual one

A case could in principle stack `no_nulls` and `no_outliers` on the same column, and a specific cell could theoretically qualify for both (though not simultaneously in practice — a null cell has no numeric value to be out-of-range). Where the detector layer's `afflictionCellMap` (implementation, not this spec) finds more than one kind claiming the same cell, the **first predicate in the case JSON's `winCondition.all` array wins** — deterministic, author-controlled by ordering, and documented in the content-authoring guide. A cell never renders two badges at once; that would break the "any one signal is sufficient" guarantee by making the reader parse compound state.

---

## 3. HP heatmap — aggregate severity across multiple kinds

Phase 1 §6.1's core decision (a per-row auto-binned heatmap, not an aggregate bar; height as the primary non-color channel) stands unchanged and extends cleanly. Two additions:

### 3.1 A segment's height still means "how afflicted," now summed across kinds

A bin's affliction fraction is now `(afflicted cells of any active kind in the bin) / (rows in bin × active predicate count)` — total affliction load, not just nulls. The four-level height/lightness system (§6.2 of Phase 1) is unchanged; only what feeds the ratio changes.

### 3.2 A segment's color is its _dominant_ kind, not a blend

When a bin contains more than one affliction kind, the segment tints toward whichever kind has the most afflicted cells in that bin (ties broken by the `winCondition.all` order, same rule as §2.5). **Never blend hues.** A blended gradient across a 2–3px segment is illegible and defeats the single-hue-ramp CVD-safety property Phase 1 §6.2 built the ramp around. Each kind gets its own four-step lightness ramp, structurally identical to the existing `--w1-null-ramp-*` set:

```css
[data-world="boss-fights"] {
  --w1-dup-ramp-2: #2a4a5c;
  --w1-dup-ramp-3: #4a7a94;
  --w1-dup-ramp-4: #6fc8ff;
  --w1-dtype-ramp-2: #4a4a1f;
  --w1-dtype-ramp-3: #8a842f;
  --w1-dtype-ramp-4: #f0e442;
  --w1-ws-ramp-2: #1f4a42;
  --w1-ws-ramp-3: #3a8a78;
  --w1-ws-ramp-4: #5dd9c1;
  --w1-outlier-ramp-2: #5c341a;
  --w1-outlier-ramp-3: #a4602c;
  --w1-outlier-ramp-4: #ff9e4a;
  --w1-date-ramp-2: #5c2a4a;
  --w1-date-ramp-3: #a4527f;
  --w1-date-ramp-4: #f58fd0;
}
```

(Level 1 / clean stays the shared `--w1-rule-faint` regardless of kind — an unafflicted bin has no kind to tint.) `hpSegments.ts` picks the ramp variable name by dominant kind; `HpHeatmap.tsx` sets `--seg-color` exactly as Phase 1 already does, just parameterized.

### 3.3 The composition legend — the piece Phase 1 didn't need

A tutorial boss has one kind; the HP band's numeric readout (`023 / 240 ROWS`) was always sufficient. A stacked mid/final boss needs the player to see the _mix_ at a glance, or the single number "47 afflicted cells" hides that it's actually three different problems. Add a compact glyph-count row directly under the HP strip, visible only when `winCondition.all` has more than one distinct kind:

```html
<div class="hpBreakdown" aria-hidden="true">
  <span class="hpBreakdownItem" data-kind="null">NaN <b>12</b></span>
  <span class="hpBreakdownItem" data-kind="ws">_ <b>8</b></span>
  <span class="hpBreakdownItem" data-kind="dup">= <b>5</b></span>
</div>
```

```css
.hpBreakdown {
  grid-column: 1 / -1;
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font: 500 11px/14px var(--w1-font-text);
}
.hpBreakdownItem {
  color: var(--w1-text-secondary);
}
.hpBreakdownItem b {
  font-weight: 600;
  margin-left: 3px;
}
.hpBreakdownItem[data-kind="null"] {
  color: var(--w1-status-null);
}
.hpBreakdownItem[data-kind="dup"] {
  color: var(--w1-status-dup);
}
.hpBreakdownItem[data-kind="dtype"] {
  color: var(--w1-status-dtype);
}
.hpBreakdownItem[data-kind="ws"] {
  color: var(--w1-status-ws);
}
.hpBreakdownItem[data-kind="outlier"] {
  color: var(--w1-status-outlier);
}
.hpBreakdownItem[data-kind="date"] {
  color: var(--w1-status-date);
}
```

`aria-hidden` because it's redundant with the per-cell `aria-label`s and the HP strip's own `aria-label` — a screen reader user already gets the count via the meter; this is a sighted-user glanceable summary, not new information. Ordered by the same `winCondition.all` order as everything else in this spec (one deterministic ordering rule, reused everywhere, per §2.5).

`.hpBand`'s grid (Phase 1 §6.2) needs one more row when the breakdown is present: `grid-template-rows: auto auto auto;` with `grid-template-areas: "label readout" "strip readout" "breakdown breakdown";`.

---

## 4. Mid-boss escalation

Deliberately minimal — Phase 1's mechanisms already scale for free, and the instinct to add new machinery here is exactly the kind of drift Phase 1 §10.3 caught and cut twice. Two additions only:

### 4.1 A tier tag next to the boss title

```html
<span class="tierTag" data-tier="mid-boss">MID-BOSS</span>
```

```css
.tierTag {
  display: inline-block;
  margin-left: 10px;
  padding: 1px 6px;
  font: 600 10px/14px var(--w1-font-display);
  letter-spacing: 0.12em;
  vertical-align: middle;
  border: 1px solid currentColor;
}
.tierTag[data-tier="mid-boss"] {
  color: var(--w1-amber-500);
}
.tierTag[data-tier="final-boss"] {
  color: var(--w1-diff-del);
}
```

Tutorial gets no tag (absence is itself the signal — the first case needs no label). Positioned inline after the boss title text in `BriefingPanel`, same row, `vertical-align: middle`.

### 4.2 Everything else already scales without new design work

- **The ASCII sigil** (Phase 1 §9) fills based on `remaining / initial` — a mid-boss with 60 initial afflicted cells across 3 kinds produces exactly the same fill-density progression as a tutorial with 23, with zero code or spec changes. The fixed 88×66px box stays fixed, per Phase 1's explicit "the answer is no" on enlarging it — a bigger number of afflictions does not earn a bigger sigil.
- **The HP heatmap strip** already reflects "more, and more varied" through §3's aggregate ratio and dominant-color logic — no separate mid-boss mode.
- **Recoil amplitude** (Phase 1 §8a) already scales with `clearedThisTurn / totalAffliction`, which is proportional regardless of how large `totalAffliction` gets.

Escalation is communicated by the state actually being bigger and more varied, not by a costume change layered on top. That is the same principle Phase 1 §5 built the affliction system on: the data itself is the signal.

---

## 5. Final boss — "no hints, one shot"

Framed exactly as the brief demanded: an honest tone/framing choice, never a mechanism that pretends to prevent retries it can't actually prevent. Three concrete UI differences from a tutorial/mid-boss fight, all in `BriefingPanel`:

### 5.1 The objective line is withheld

Phase 1 §3.3's objective line (`OBJECTIVE   no_nulls(temp_c)`, amber) is replaced for `tier: "final-boss"` cases with:

```
OBJECTIVE   [ NOT DISCLOSED — READ THE DATA ]
```

Same position, same type role, rendered in `--w1-diff-del` (vermillion) instead of amber — the one place in World 1 that color communicates "this is deliberately withheld," reusing the existing danger hue rather than inventing a seventh status color for a one-off. The row stays in the layout (no reflow, no surprise); only its content changes.

### 5.2 No starter-code scaffold

Already decided at the content layer (§6 of the case-tier work, `packages/content-schema`): a final-boss case's `starterCode` is the flat, neutral `"# df is loaded."` — no `df.isna().sum()`-style investigative nudge. `CodeEditor` renders whatever `starterCode` the case provides either way; no component change needed here, only a content-authoring rule (documented in `docs/content-authoring-guide.md`, not repeated here).

### 5.3 The boss name itself signals stakes

Status rail (Phase 1 §3.3) renders the boss name in `--w1-status-null` for every Phase 1 case. For `tier: "final-boss"`, render it in `--w1-diff-del` instead — the same vermillion as the withheld objective line and as a failed run's traceback, so the player's very first glance at the screen (before reading anything) already reads "this one is different."

### 5.4 What is explicitly NOT withheld

The dataframe grid, the HP heatmap, the console, and the diff-flash all render exactly as they do for any other case — "no hints" means no guided objective checklist and no starter code, not a crippled instrument panel. Plan §5's "the dataframe IS the battlefield" is non-negotiable regardless of tier; hiding the grid would break the one thing every other part of this spec protects. A determined player can always inspect `df` themselves (`df.dtypes`, `df.isna().sum()`, etc.) — nothing stops that, nor should it. "No hints" is Story, not a lock.

---

## 6. World map / boss roster screen

Phase 1 had no "front door" — `App.tsx` rendered one hardcoded `<BossFightScreen>`. Phase 2 needs a screen before that: a roster the player picks a case from, in the same terminal instrument-panel language as the fight screen itself (Phase 1 §10.2's reference class — "the entire screen is one instrument" — applies here too; this is not a menu, it's a status readout).

### 6.1 Layout

Full-bleed `--w1-bg-void`, `height: 100dvh; overflow: hidden` (same global frame rule as the fight screen, Phase 1 §3.1), content block `padding: 10vh 8vw`, `max-width: 900px`. One ASCII-framed roster table, reusing the sigil's frame-character vocabulary (`+`, `=`, `|`) rather than a bordered `<table>` or card grid — the frame is drawn with real border rules, not literal characters (unlike the sigil, which is content-bound ASCII; this is chrome, so it should be real CSS borders like every other panel in Phase 1, just laid out to _look_ like a drawn ASCII frame via monospace-aligned columns and rule lines).

```
BOSS-FIGHTS // WORLD ROSTER

  [X]  NUL_SENTINEL           tutorial     NaN                     CLEARED
  [>]  DOUBLE_TAKE            mid-boss     NaN =
  [ ]  CASE_SHIFT             mid-boss     _ #                     LOCKED
  [ ]  THE_RECKONING          final-boss   NaN = _ # ^ @           LOCKED

  RANK  CLEANER  (2 / 6 techniques)                    XP  300

  [ EXPORT SAVE ]   [ IMPORT SAVE ]
```

```css
.roster {
  padding: 10vh 8vw 4vh;
  max-width: 900px;
  color: var(--w1-text-primary);
}
.rosterHeading {
  font: 700 var(--w1-fs-title) / 28px var(--w1-font-display);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--w1-text-secondary);
  margin-bottom: 24px;
}
.rosterRow {
  display: grid;
  grid-template-columns: 40px 1fr 100px 1fr 90px;
  align-items: center;
  column-gap: 16px;
  height: 40px;
  border-bottom: 1px solid var(--w1-rule-faint);
  font: 400 var(--w1-fs-cell) / 1 var(--w1-font-text);
}
.rosterRow:first-child {
  border-top: 1px solid var(--w1-rule);
}
.rosterStatus {
  font: 600 var(--w1-fs-cell) / 1 var(--w1-font-text);
}
.rosterStatus[data-status="cleared"] {
  color: var(--w1-green-500);
}
.rosterStatus[data-status="unlocked"] {
  color: var(--w1-amber-500);
}
.rosterStatus[data-status="locked"] {
  color: var(--w1-text-dim);
}
.rosterName {
  font: 600 var(--w1-fs-colhead) / 1 var(--w1-font-display);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.rosterRow[data-status="locked"] .rosterName {
  color: var(--w1-text-dim);
}
.rosterGlyphs {
  font: 500 12px/1 var(--w1-font-text);
  color: var(--w1-text-secondary);
  letter-spacing: 0.3em;
}
.rosterTag {
  font: 600 10px/1 var(--w1-font-display);
  letter-spacing: 0.1em;
  color: var(--w1-text-dim);
  text-align: right;
}
```

`.rosterGlyphs` reuses the exact badge glyphs from §0/§2 — a case combining `no_nulls` + `no_whitespace` shows `NaN _` in the roster row, in `--w1-text-secondary` (not per-kind color; a monochrome preview keeps the roster calm and reserves the saturated status colors for the fight itself, where they're load-bearing rather than decorative).

### 6.2 Status glyphs and unlock rule

`[X]` cleared (green), `[>]` unlocked-not-cleared (amber), `[ ]` locked (dim). Unlock is a straight gate down the roster's declared order (`content/rosters/boss-fights.json`, §-of-record: `packages/content-schema`'s `worldRosterSchema`) — the first case is always unlocked; each subsequent case unlocks once the previous one has been cleared. No branching unlock tree in Phase 2 scope; that's a Phase 4+ question if a world ever needs one.

A locked row is not a dead end — the whole row still shows the boss name, tier, and affliction-kind preview (dimmed), so the player can see what's coming. Locked rows are not clickable; `LOCKED` right-aligned in place of the tag Phase 2 doesn't otherwise need.

### 6.3 Rank / XP readout

Directly under the roster table, `margin-top: 24px`, `padding-top: 16px`, `border-top: 1px solid var(--w1-rule-strong)` (same divider language as the briefing panel's objective line in Phase 1 §3.3):

```css
.rankReadout {
  display: flex;
  align-items: baseline;
  gap: 32px;
}
.rankLabel {
  font: 600 var(--w1-fs-hudlabel) / 14px var(--w1-font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--w1-amber-500);
}
.rankValue {
  font: 600 var(--w1-fs-hudnum) / 20px var(--w1-font-text);
  color: var(--w1-text-primary);
  margin-left: 8px;
}
.rankProgress {
  font: 400 12px/1 var(--w1-font-text);
  color: var(--w1-text-dim);
  margin-left: 6px;
}
```

`RANK` and `XP` are two `HUD label + value` pairs, identical type roles to the HP band's own label/readout pair (Phase 1 §6.3) — this screen and the fight screen should feel like the same instrument panel in two modes, not two different apps.

### 6.4 Save affordances

Two plain text buttons, same visual family as the a11y control cluster (Phase 1 §4.4: `1px solid var(--w1-rule-strong)`, transparent background, hover/focus → amber border+text), sized to their label rather than the fixed 28×28px icon-button size:

```css
.saveButton {
  height: 28px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid var(--w1-rule-strong);
  color: var(--w1-text-secondary);
  font: 600 11px/1 var(--w1-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.saveButton:hover,
.saveButton:focus-visible {
  border-color: var(--w1-amber-500);
  color: var(--w1-amber-500);
}
```

**Export:** builds a `Blob` from `exportSaveAsJson()`, triggers a synthetic anchor-click download named `dcq-save.json`. No confirmation dialog — the browser's own download UI is the confirmation.

**Import:** opens a hidden `<input type="file" accept="application/json">`, reads the file, calls `importSaveFromJson()`. On success, an inline status line appears for 4s: `SAVE IMPORTED — RANK: {label}` in `--w1-green-500`. On failure (malformed JSON or schema mismatch — `importSaveFromJson` already returns `null` for both, per `apps/web/src/lib/save.ts`): `IMPORT FAILED — INVALID SAVE FILE` in `--w1-diff-del`, persists until the next import attempt (not time-limited — a failure shouldn't vanish before the player reads it). No modal for either path; a status line beneath the two buttons, `aria-live="polite"`.

### 6.5 Entry point from a fight, and back

`BossFightScreen`'s status rail (Phase 1 §3.3) gains one more control on the left, before the boss name: a `< ROSTER` text link, same type role as the status rail text, `--w1-text-secondary` → `--w1-amber-500` on hover/focus, returning to the world map. This is the only navigation chrome World 1 needs — no persistent nav bar, no breadcrumb system; one link out, from inside a fight, back to the one screen that lists fights.

---

## 7. XP/rank badge inside a fight

A small addition to `BossFightScreen`'s status rail, between the boss name and the a11y control cluster (Phase 1 §3.3's right side): a single rank badge.

```html
<span class="rankBadge">CLEANER</span>
```

```css
.rankBadge {
  font: 600 var(--w1-fs-rail) / 12px var(--w1-font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--w1-amber-500);
  padding: 2px 8px;
  border: 1px solid var(--w1-rule-strong);
  margin-right: 16px;
}
```

Deliberately not a progress bar, not a floating XP counter, not a toast on level-up — Phase 1 §10.3 already caught and killed a "generic game HUD" instinct once (the aggregate HP bar); a leveling toast mid-fight would be the same mistake in a different spot. Rank is ambient status-rail context, exactly as understated as the tutorial's boss-name label next to it. XP itself is not shown during a fight at all — it belongs to the world map's rank readout (§6.3), where the player is between fights and actually looking at progress, not mid-problem.

---

## 8. Self-review against plan §2

Same checklist Phase 1 ran, applied to what's new here.

| §2 anti-pattern                       | Status                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centered hero + gradient blob         | **Absent.** The world map is a left-aligned, top-anchored instrument readout, same frame rules as the fight screen (`height: 100dvh; overflow: hidden`, no scroll at desktop size). No gradients introduced anywhere in this document except the pre-existing pattern mechanism (repeating-linear-gradient hatch/band textures), reused for the five new affliction kinds exactly as Phase 1 used it for one. |
| Rounded card grid                     | **Absent.** The roster is rows in a monospace grid separated by 1px rules, inheriting the global `border-radius: 0` rule Phase 1 already enforces world-wide. No cards anywhere in Phase 2.                                                                                                                                                                                                                   |
| Soft drop shadows                     | **Absent.** Nothing in this document uses `box-shadow`. Depth is still 1px rules and background steps, per Phase 1 §3.1's ban.                                                                                                                                                                                                                                                                                |
| Default sans font                     | **Absent.** Every new surface uses the same two committed monospace faces (Martian Mono / IBM Plex Mono) and the same `--w1-fs-*` scale tokens Phase 1 defined — no new type roles were invented where an existing one already fit (HUD label/value pairs reused verbatim for RANK/XP).                                                                                                                       |
| Stock imagery / 3D blob mascot        | **Absent.** The world map has zero raster assets; its only "art" is the same badge-glyph vocabulary (`= # _ ^ @`) already used in the grid.                                                                                                                                                                                                                                                                   |
| Generic fade-in-on-scroll motion      | **Absent.** No new page-level entrance animation was specified. The world map is static on load (a menu that needs no theatrics — the fight screen already spends its motion budget on the boot sequence and the recoil/shatter/diff-flash system).                                                                                                                                                           |
| Default UI-library look (shadcn blue) | **Absent.** No blue introduced; `--w1-status-dup`'s blue is Phase 1's own CVD-safe Okabe–Ito-derived value, not a UI-kit accent. Save/roster buttons follow the exact same "transparent, 1px border, hard color-swap on hover" family as Phase 1's a11y controls and run button — no new button visual language invented for Phase 2.                                                                         |

### 8.1 Drift caught while writing this spec

**First instinct on the HP heatmap composition (§3.2):** blend the dominant and secondary kinds' colors per segment so a 60%-null/40%-duplicate bin would show a mixed hue. **Rejected**: a blended hue on a 2–3px-wide segment is illegible at a glance and directly undermines the single-hue-ramp CVD-safety property that's the entire reason Phase 1's heatmap works under color-vision deficiency. Replaced with dominant-kind-only coloring plus the separate glyph-count breakdown row (§3.3), which gives the composition information a real, readable home instead of compressing it into a hue nobody can actually distinguish.

**First instinct on final-boss framing (§5):** hide or disable the HP heatmap and grid to make it feel more "hardcore." **Rejected** immediately — that's a fake difficulty mechanic that breaks plan §5's non-negotiable ("the dataframe IS the battlefield"), and it would make the final boss a worse tool for the actual skill (reading real data) at exactly the moment the game should be testing that skill hardest. "No hints" stays scoped to what's genuinely optional scaffolding (the objective line, the starter code), never the instrument itself.

**First instinct on rank display during a fight:** a small circular XP progress ring in the corner (a extremely common game-UI pattern). **Rejected** — circular anything violates Phase 1's `border-radius: 0` rule, and a progress ring is exactly the "generic game HUD" fingerprint Phase 1 §10.3 already flagged once for the HP bar. Replaced with a plain bordered-rectangle text badge, same visual family as everything else in the status rail.

---

## 9. Build manifest — what's new

```
apps/web/src/worlds/boss-fights/
├── theme.css                extend: 5 new -rgb tokens, 5 new ramp sets,
│                            high-contrast overrides for the 5 new statuses
├── DataframeGrid.module.css  extend: §2's per-kind pattern rules
├── HpHeatmap.tsx / .module.css  extend: §3's aggregate/dominant-color logic,
│                                 the breakdown row
├── BriefingPanel.tsx        extend: tier tag (§4.1), withheld-objective
│                            branch + vermillion boss name (§5)
├── BossFightScreen.tsx      extend: rank badge (§7), roster link (§6.5)
├── WorldMapScreen.tsx        NEW — §6
├── WorldMapScreen.module.css NEW
└── afflictionDom.ts          extend: badge glyph + aria-label per kind (§2.4)

apps/web/public/datasets/world-1/double-take.csv     (mid-boss)
apps/web/public/datasets/world-1/case-shift.csv      (mid-boss)
apps/web/public/datasets/world-1/the-reckoning.csv   (final boss)
scripts/generate-double-take.mjs
scripts/generate-case-shift.mjs
scripts/generate-the-reckoning.mjs
content/cases/boss-fights/w1-02-double-take.json
content/cases/boss-fights/w1-03-case-shift.json
content/cases/boss-fights/w1-04-the-reckoning.json
content/rosters/boss-fights.json                     updated with all 4 case ids
```

No new npm dependencies — everything here is CSS, existing GSAP patterns (the HP shatter/counter mechanisms from Phase 1 §8b apply unchanged to the generalized heatmap), and one new React component built from the same primitives (CSS Modules, `classNames()` helper) every other Phase 1 component already uses.
