import type { ResultGrid } from "@dcq/engine-adapters";

export interface CellChange {
  /** Position in `after.rows` — what DataframeGrid actually renders, and what the flash animation needs to locate the DOM cell. */
  rowIndex: number;
  column: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

/**
 * Matches rows by their real pandas index value, not by array position.
 * Default RangeIndex values survive `drop_duplicates()`/`dropna()` unless
 * the code calls `.reset_index()`, so a run that drops rows (Phase 2:
 * no_duplicates cases) still diffs correctly — a retained row is compared
 * against its own prior values, not whatever row happens to now sit at the
 * same array position. A dropped row simply produces no CellChange entries
 * (nothing to flash — the row is just gone); a row with no counterpart in
 * `before` is skipped rather than treated as a wall of "added" cells, since
 * no World 1 case adds rows.
 */
export function diffGrids(before: ResultGrid, after: ResultGrid): CellChange[] {
  const changes: CellChange[] = [];
  const beforeByIndex = new Map<string | number, ResultGrid["rows"][number]>();
  before.rows.forEach((row, i) => {
    const indexValue = before.index[i];
    if (indexValue !== undefined) beforeByIndex.set(indexValue, row);
  });

  after.rows.forEach((afterRow, rowIndex) => {
    const indexValue = after.index[rowIndex];
    if (indexValue === undefined) return;
    const beforeRow = beforeByIndex.get(indexValue);
    if (!beforeRow) return;

    for (const column of after.columns) {
      const beforeVal = beforeRow[column] ?? null;
      const afterVal = afterRow[column] ?? null;
      if (beforeVal !== afterVal) {
        changes.push({ rowIndex, column, before: beforeVal, after: afterVal });
      }
    }
  });

  return changes;
}
