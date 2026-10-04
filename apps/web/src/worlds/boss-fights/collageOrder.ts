/** Puts the panes in the saved order, ignoring ids that no longer exist and adding new ones last. */
export function orderPanes<T extends { id: string }>(panes: T[], order: string[]): T[] {
  const byId = new Map(panes.map((p) => [p.id, p]));
  const sorted: T[] = [];
  for (const id of order) {
    const pane = byId.get(id);
    if (pane) {
      sorted.push(pane);
      byId.delete(id);
    }
  }
  return [...sorted, ...byId.values()];
}

/** Swaps two panes' positions. */
export function swapOrder(ids: string[], a: string, b: string): string[] {
  const next = [...ids];
  const i = next.indexOf(a);
  const j = next.indexOf(b);
  if (i === -1 || j === -1) return ids;
  [next[i], next[j]] = [next[j] ?? a, next[i] ?? b];
  return next;
}

/** How the room is shared: the left share of the width and the top share of the height, each between 0 and 1. */
export interface Split {
  col: number;
  row: number;
}

export const DEFAULT_SPLIT: Split = { col: 0.5, row: 0.5 };
export const SPLIT_MIN = 0.18;
export const SPLIT_MAX = 0.82;
/** Width of the gap between tables, which is also the handle you drag. */
export const GUTTER_PX = 10;
/** Space around the whole collage. */
export const PADDING_PX = 8;

export function clampSplit(value: number): number {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

/** The CSS grid tracks for a collage of this many tables and this split. */
export function collageTracks(
  count: number,
  split: Split,
): { columns: string; rows: string } {
  const share = (a: number): string =>
    `minmax(0, ${String(a)}fr) ${String(GUTTER_PX)}px minmax(0, ${String(1 - a)}fr)`;
  return {
    columns: count >= 3 ? share(split.col) : "minmax(0, 1fr)",
    rows: count >= 2 ? share(split.row) : "minmax(0, 1fr)",
  };
}

/** Which cells of the grid a table occupies. Tracks are: table, gutter, table. */
export function collagePlacement(
  count: number,
  index: number,
): { column: string; row: string } {
  if (count <= 1) return { column: "1 / -1", row: "1 / -1" };
  if (count === 2) return { column: "1 / -1", row: index === 0 ? "1" : "3" };
  const left = index % 2 === 0;
  if (count === 3 && index === 2) return { column: "1 / -1", row: "3" };
  return { column: left ? "1" : "3", row: index < 2 ? "1" : "3" };
}
