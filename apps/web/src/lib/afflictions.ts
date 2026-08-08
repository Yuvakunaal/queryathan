import type { ResultGrid } from "@dcq/engine-adapters";

export function countNulls(grid: ResultGrid, column: string): number {
  let count = 0;
  for (const row of grid.rows) {
    if (row[column] === null) count++;
  }
  return count;
}

export function countDuplicates(grid: ResultGrid, columns: string[]): number {
  const seen = new Map<string, number>();
  for (const row of grid.rows) {
    const key = JSON.stringify(columns.map((column) => row[column] ?? null));
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  let duplicateCount = 0;
  for (const occurrences of seen.values()) {
    if (occurrences > 1) duplicateCount += occurrences - 1;
  }
  return duplicateCount;
}
