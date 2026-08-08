import type { ResultGrid } from "@dcq/engine-adapters";
import type { Predicate, WinCondition } from "@dcq/content-schema";
import {
  nullRowIndices,
  duplicateRowIndices,
  whitespaceRowIndices,
  casingRowIndices,
  outlierRowIndices,
  dtypeMismatchRowIndices,
} from "./afflictions";

/** The six visual affliction kinds World 1 renders — see docs/design/world-1-phase-2-visual-spec.md §0 for the predicate -> kind mapping. */
export type AfflictionKind = "null" | "dup" | "ws" | "dtype" | "outlier" | "date";

export interface AfflictedCell {
  rowIndex: number;
  column: string;
  kind: AfflictionKind;
}

function kindForPredicate(predicate: Predicate): AfflictionKind {
  switch (predicate.predicate) {
    case "no_nulls":
      return "null";
    case "no_duplicates":
      return "dup";
    case "no_whitespace":
    case "consistent_casing":
      return "ws";
    case "no_outliers":
      return "outlier";
    case "valid_dtype":
      return predicate.dtype === "datetime" ? "date" : "dtype";
  }
}

function columnsForPredicate(predicate: Predicate): string[] {
  return predicate.predicate === "no_duplicates" ? predicate.columns : [predicate.column];
}

function rowIndicesForPredicate(grid: ResultGrid, predicate: Predicate): number[] {
  switch (predicate.predicate) {
    case "no_nulls":
      return nullRowIndices(grid, predicate.column);
    case "no_duplicates":
      return duplicateRowIndices(grid, predicate.columns);
    case "no_whitespace":
      return whitespaceRowIndices(grid, predicate.column);
    case "consistent_casing":
      return casingRowIndices(grid, predicate.column, predicate.case);
    case "no_outliers":
      return outlierRowIndices(grid, predicate.column, predicate.min, predicate.max);
    case "valid_dtype":
      return dtypeMismatchRowIndices(grid, predicate.column, predicate.dtype);
  }
}

/** Every cell a single predicate flags. A no_duplicates predicate flags every listed column on every flagged row — the whole row is the unit of the problem, not one column. */
export function getAfflictedCells(
  grid: ResultGrid,
  predicate: Predicate,
): AfflictedCell[] {
  const kind = kindForPredicate(predicate);
  const columns = columnsForPredicate(predicate);
  return rowIndicesForPredicate(grid, predicate).flatMap((rowIndex) =>
    columns.map((column) => ({ rowIndex, column, kind })),
  );
}

/**
 * JSON.stringify of the tuple, not a delimited template string — a column
 * name containing the delimiter would otherwise silently collide two
 * different cells onto the same key (the exact bug class the Phase 1
 * duplicate-detection code was rewritten to avoid; see afflictions.ts).
 */
function cellKey(rowIndex: number, column: string): string {
  return JSON.stringify([rowIndex, column]);
}

function parseCellKey(key: string): { rowIndex: number; column: string } {
  const [rowIndex, column] = JSON.parse(key) as [number, string];
  return { rowIndex, column };
}

/**
 * A grid-wide map of every afflicted cell across every predicate in a win
 * condition, keyed by "{rowIndex}:{column}". Where more than one predicate
 * claims the same cell, the first predicate in winCondition.all wins — a
 * documented scoping rule (design spec §2.5), not an accident: a cell only
 * ever renders one badge.
 */
export function afflictionCellMap(
  grid: ResultGrid,
  winCondition: WinCondition,
): Map<string, AfflictionKind> {
  const map = new Map<string, AfflictionKind>();
  for (const predicate of winCondition.all) {
    for (const cell of getAfflictedCells(grid, predicate)) {
      const key = cellKey(cell.rowIndex, cell.column);
      if (!map.has(key)) map.set(key, cell.kind);
    }
  }
  return map;
}

export function afflictionKindAt(
  cellMap: Map<string, AfflictionKind>,
  rowIndex: number,
  column: string,
): AfflictionKind | undefined {
  return cellMap.get(cellKey(rowIndex, column));
}

/** Total afflicted-cell count across every predicate — the win condition's aggregate "HP." */
export function countTotalAffliction(
  grid: ResultGrid,
  winCondition: WinCondition,
): number {
  return afflictionCellMap(grid, winCondition).size;
}

/** Per-row breakdown by kind, for the HP heatmap's binning (design spec §3). */
export function afflictionKindsByRow(
  cellMap: Map<string, AfflictionKind>,
): Map<number, AfflictionKind[]> {
  const byRow = new Map<number, AfflictionKind[]>();
  for (const [key, kind] of cellMap.entries()) {
    const { rowIndex } = parseCellKey(key);
    const kinds = byRow.get(rowIndex) ?? [];
    kinds.push(kind);
    byRow.set(rowIndex, kinds);
  }
  return byRow;
}

/** Distinct affliction kinds in winCondition.all's declared order — the deterministic tie-break order used for both overlapping-cell priority (§2.5) and HP segment dominant-kind ties (design spec §3.2). */
export function predicateKindOrder(winCondition: WinCondition): AfflictionKind[] {
  const seen = new Set<AfflictionKind>();
  const order: AfflictionKind[] = [];
  for (const predicate of winCondition.all) {
    const kind = kindForPredicate(predicate);
    if (!seen.has(kind)) {
      seen.add(kind);
      order.push(kind);
    }
  }
  return order;
}

/**
 * Every cell that was afflicted in `beforeGrid` and is no longer afflicted
 * in `afterGrid` — the set the "just cleared" ledger-mark outline (spec
 * §5.5) is built from. Matches rows by their real pandas index value
 * (`grid.index`), not array position, for the same reason lib/diff.ts
 * does: a run that drops rows (drop_duplicates()) shifts every later row's
 * position without changing its identity, and a naive positional
 * comparison would either miss real clears or invent phantom ones.
 * Returned rowIndex values are positions in `afterGrid` (what's actually
 * rendered, and what DataframeGrid.getCellElement needs).
 */
export function clearedCells(
  beforeGrid: ResultGrid,
  beforeCellMap: Map<string, AfflictionKind>,
  afterGrid: ResultGrid,
  afterCellMap: Map<string, AfflictionKind>,
): { rowIndex: number; column: string }[] {
  const identityKey = (indexValue: string | number, column: string): string =>
    JSON.stringify([indexValue, column]);

  const afterIdentities = new Set<string>();
  for (const key of afterCellMap.keys()) {
    const { rowIndex, column } = parseCellKey(key);
    const indexValue = afterGrid.index[rowIndex];
    if (indexValue !== undefined) afterIdentities.add(identityKey(indexValue, column));
  }

  const afterPositionByIndexValue = new Map<string | number, number>();
  afterGrid.index.forEach((indexValue, position) => {
    afterPositionByIndexValue.set(indexValue, position);
  });

  const cleared: { rowIndex: number; column: string }[] = [];
  for (const key of beforeCellMap.keys()) {
    const { rowIndex, column } = parseCellKey(key);
    const indexValue = beforeGrid.index[rowIndex];
    if (indexValue === undefined) continue;
    if (afterIdentities.has(identityKey(indexValue, column))) continue;

    const afterPosition = afterPositionByIndexValue.get(indexValue);
    if (afterPosition !== undefined) cleared.push({ rowIndex: afterPosition, column });
  }
  return cleared;
}

/** Total afflicted-cell count per kind, for the HP band's glyph-count breakdown (design spec §3.3). */
export function afflictionCountsByKind(
  cellMap: Map<string, AfflictionKind>,
): Map<AfflictionKind, number> {
  const counts = new Map<AfflictionKind, number>();
  for (const kind of cellMap.values()) {
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return counts;
}
