# ADR 0006: Diff rows by pandas index value, not array position

**Status:** Accepted

## Context

`lib/diff.ts` compares a "before" and "after" `ResultGrid` to find what
changed, driving both the grid's cell flash and the console's `-`/`+` log.
Phase 1 (`.fillna()`-style fixes) never changes row count or order, so a
positional diff — compare `before.rows[i]` to `after.rows[i]` — was correct
and was shipped with an explicit comment flagging it as scoped: "valid
while row count/order stay stable... revisit once
`drop_duplicates`/`dropna` cases (Phase 2) can change row count."

Phase 2 introduced exactly that: `DOUBLE_TAKE` and `THE_RECKONING` require
`no_duplicates` predicates whose intended fix is `df.drop_duplicates(...)`,
which removes rows. A positional diff against a shorter "after" grid
compares each retained row to the _wrong_ row (everything after the drop
point is off by one), producing a wall of spurious cell changes — a real
bug, caught via real-browser Playwright testing, not code review.

## Decision

`ResultGrid` gained an `index` field — `dataframe.index.tolist()`,
serialized alongside `rows`/`dtypes`. Pandas' default `RangeIndex` survives
`drop_duplicates()`/`dropna()` unless the code explicitly calls
`.reset_index()`, so each row keeps a stable identity across a run even
when its array position shifts. `diffGrids` (and the affliction-cell
"just cleared" ledger-mark helper, `clearedCells`) now match rows by that
index value: build a lookup from the "before" grid's index values to their
rows, then for each row in "after," look up its counterpart by index rather
than by position. A row whose index disappeared between before/after was
dropped — it contributes no diff (there's nothing to flash; the row is
just gone). A row with no "before" counterpart is skipped rather than
treated as a wall of "added" cells, since no World 1 case currently adds
rows.

Returned `CellChange.rowIndex` values are positions in the **after** grid
— what `DataframeGrid` actually renders and what
`getCellElement(rowIndex, column)` needs to locate the DOM cell to flash.

## Consequence

- A run that drops rows now diffs correctly: retained rows that didn't
  change produce zero `CellChange` entries even if their on-screen position
  shifted; genuinely changed rows are still found and flashed at their new
  position.
- Any future case whose intended fix could add rows (not part of any
  current World 1 case) is _not_ handled — a row with no "before"
  counterpart is silently skipped, not flagged as new. Revisit if a case
  ever needs it.
- Content authors don't need to know any of this — it's an engine-layer
  fix. It only matters to someone extending `lib/diff.ts` or
  `lib/affliction-cells.ts`.
