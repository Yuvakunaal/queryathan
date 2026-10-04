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
