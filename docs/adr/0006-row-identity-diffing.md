# ADR 0006: Diff rows by a stable row identity, not array position

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

`ResultGrid` gained an `index` field, populated from a **hidden data
column** the worker maintains (`__dcq_row_id__`), not directly from
`dataframe.index`. The first version of this fix used `dataframe.index`
directly — it was wrong: pandas' default `RangeIndex` survives
`drop_duplicates()`/`dropna()`, but not `.reset_index(drop=True)`, which is
the single most idiomatic way to finish off a `drop_duplicates()` fix and
re-labels every row back to a fresh `0..N-1` range. Two different rows
across a run can then coincidentally share an old/new index value,
silently corrupting the identity match — the exact class of bug this ADR
exists to prevent, just deferred to a specific follow-up operation instead
of being absent entirely.

The fix: at first serialization (`init-case`), the worker adds a real,
ordinary column (`df["__dcq_row_id__"] = range(len(df))`) and strips it
back out of `columns`/`rows`/`dtypes` before returning the grid — a player
never sees it, and it never counts as one of "their" columns for any
predicate. Because it's genuine row _data_, not an index, it survives every
row-preserving pandas operation, `.reset_index()` included — a `DataFrame`
operation resets its index, not an arbitrary column's values. `diffGrids`
(and the affliction-cell "just cleared" ledger-mark helper, `clearedCells`)
match rows by this value: build a lookup from the "before" grid's values to
their rows, then for each row in "after," look up its counterpart rather
than comparing by position. A row whose id disappeared between before/after
was dropped — it contributes no diff (there's nothing to flash; the row is
just gone). A row with no "before" counterpart is skipped rather than
treated as a wall of "added" cells, since no World 1 case currently adds
rows.

Returned `CellChange.rowIndex` values are positions in the **after** grid
— what `DataframeGrid` actually renders and what
`getCellElement(rowIndex, column)` needs to locate the DOM cell to flash.

## Consequence

- A run that drops rows, and a run that additionally resets the index
  afterward, both diff correctly: retained rows that didn't change produce
  zero `CellChange` entries even if their on-screen position shifted;
  genuinely changed rows are still found and flashed at their new position.
- If a player's code drops the hidden column entirely (e.g. `df =
df[["a", "b"]]` column selection, or a `.merge()` that doesn't carry it
  through), the worker's `__dcq_ensure_row_id` re-creates it fresh on the
  next serialization — a graceful degrade back to "no identity available
  yet" for that turn, not a crash.
- Any future case whose intended fix could add rows (not part of any
  current World 1 case) is _not_ handled — a row with no "before"
  counterpart is silently skipped, not flagged as new. Revisit if a case
  ever needs it.
- Content authors don't need to know any of this — it's an engine-layer
  fix. It only matters to someone extending `pyodide.worker.ts`,
  `lib/diff.ts`, or `lib/affliction-cells.ts`.
