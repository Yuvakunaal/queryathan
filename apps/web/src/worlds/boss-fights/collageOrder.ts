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

/**
 * How the room is shared: the left share of the width in the upper row (col) and
 * in the lower row (col2), and the top share of the height (row), each between
 * 0 and 1. The two rows of a three or four table collage size their columns
 * independently.
 */
export interface Split {
  col: number;
  col2: number;
  row: number;
  /** Four tables, "columns" mode: the height share of the left column's top table and of the right column's. */
  rowL: number;
  rowR: number;
}

/**
 * With four tables the room can be divided in two ways, and only one at a time (four
 * rectangles filling a rectangle always have a shared line one way): "rows" gives each row its
 * own vertical line, "columns" gives each column its own horizontal line.
 */
export type CollageMode = "rows" | "columns";

export const DEFAULT_SPLIT: Split = {
  col: 0.5,
  col2: 0.5,
  row: 0.5,
  rowL: 0.5,
  rowR: 0.5,
};
export const SPLIT_MIN = 0.18;
export const SPLIT_MAX = 0.82;
/** Width of the gap between tables, which is also the handle you drag. */
export const GUTTER_PX = 10;
/** Space around the whole collage. */
export const PADDING_PX = 8;

export function clampSplit(value: number): number {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

/** Two tables and the gutter between them, sharing a row. */
export function columnShare(left: number): string {
  return `minmax(0, ${String(left)}fr) ${String(GUTTER_PX)}px minmax(0, ${String(1 - left)}fr)`;
}

/** The rows of the collage: the outer grid is one column, with a gutter row between two rows of tables. */
export function collageRowTracks(count: number, split: Split): string {
  return count >= 2
    ? `minmax(0, ${String(split.row)}fr) ${String(GUTTER_PX)}px minmax(0, ${String(1 - split.row)}fr)`
    : "minmax(0, 1fr)";
}

/** Which tables sit in which row: one stacked per row for two, then two on top for three, two and two for four. */
export function collageRows(count: number): number[][] {
  if (count <= 1) return [[0]];
  if (count === 2) return [[0], [1]];
  if (count === 3) return [[0, 1], [2]];
  return [
    [0, 1],
    [2, 3],
  ];
}
