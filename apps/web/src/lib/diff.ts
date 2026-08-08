import type { ResultGrid } from "@dcq/engine-adapters";

export interface CellChange {
  rowIndex: number;
  column: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

/**
 * Positional diff: matches rows by index, not identity. Correct for Phase 1
 * (fillna-style edits that preserve row count/order). Revisit once
 * drop_duplicates/dropna cases (Phase 2) can change row count.
 */
export function diffGrids(before: ResultGrid, after: ResultGrid): CellChange[] {
  const changes: CellChange[] = [];
  const rowCount = Math.min(before.rows.length, after.rows.length);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const beforeRow = before.rows[rowIndex];
    const afterRow = after.rows[rowIndex];
    if (!beforeRow || !afterRow) continue;

    for (const column of after.columns) {
      const beforeVal = beforeRow[column] ?? null;
      const afterVal = afterRow[column] ?? null;
      if (beforeVal !== afterVal) {
        changes.push({ rowIndex, column, before: beforeVal, after: afterVal });
      }
    }
  }

  return changes;
}
