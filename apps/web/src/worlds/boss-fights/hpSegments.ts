import type { AfflictionKind } from "../../lib/affliction-cells";

export interface HpSegment {
  level: 0 | 1 | 2 | 3;
  afflictedCount: number;
  rowCount: number;
  /** The kind with the most afflicted cells in this segment's bin (design spec §3.2) — null when the bin is clean or has nothing to dominate with. */
  dominantKind: AfflictionKind | null;
}

export const HP_SEGMENT_HEIGHTS_PX = [6, 11, 15, 18] as const;

/**
 * Mirrors --w1-rule-faint / --w1-{kind}-ramp-2/3/4 in theme.css — used only
 * as hpShatter.ts's transient animation target (GSAP needs a concrete color
 * to interpolate toward, not a var() reference). The resting state is
 * always CSS-driven via HpHeatmap.module.css's [data-level][data-kind]
 * rules, which is what lets [data-dcq-contrast="high"] actually reach the
 * strip.
 */
export const HP_LEVEL_COLORS: Record<
  AfflictionKind,
  readonly [string, string, string, string]
> = {
  null: ["#121a17", "#5b3a73", "#8e56ad", "#c77dff"],
  dup: ["#121a17", "#2a4a5c", "#4a7a94", "#6fc8ff"],
  dtype: ["#121a17", "#4a4a1f", "#8a842f", "#f0e442"],
  ws: ["#121a17", "#1f4a42", "#3a8a78", "#5dd9c1"],
  outlier: ["#121a17", "#5c341a", "#a4602c", "#ff9e4a"],
  date: ["#121a17", "#5c2a4a", "#a4527f", "#f58fd0"],
  pattern: ["#121a17", "#1f4d36", "#3d9468", "#6fe3a2"],
  encoding: ["#121a17", "#5c2a2a", "#a45252", "#ff8a8a"],
  shape: ["#121a17", "#1f4a52", "#3d8f9c", "#6fd8e8"],
};

/**
 * Per-row auto-binned heatmap (design spec §3) — a minimap of where
 * afflictions cluster, not an aggregate HP bar. Segment count is capped at
 * `maxSegments`; CSS flexbox (`flex: 1 1 0`) fills the available strip
 * width regardless of the exact count, so no viewport-width measurement is
 * needed here.
 *
 * A segment's ratio is normalized against `columnCapacity` — the number of
 * distinct columns the win condition could ever flag on a single row
 * (`lib/affliction-cells.ts#afflictableColumns`), not the number of
 * predicates. Those aren't the same thing: `afflictionCellMap` collapses
 * overlapping predicates onto one cell, so predicate count overstates
 * capacity when two predicates share a column, and a `no_duplicates`
 * predicate spanning 3 columns understates it if treated as "1 predicate."
 * An earlier version used predicate count directly and got both wrong —
 * on THE_RECKONING (4 afflictable columns, 7 predicates) the max possible
 * ratio was 4/7 ≈ 0.57, meaning the top severity level could never render
 * at all. Fixed and covered by a regression test.
 */
export function computeHpSegments(
  rowCount: number,
  kindsByRow: Map<number, AfflictionKind[]>,
  columnCapacity: number,
  maxSegments: number,
  kindOrder: AfflictionKind[],
): HpSegment[] {
  const segmentCount = Math.max(1, Math.min(maxSegments, rowCount));
  const segments: HpSegment[] = Array.from({ length: segmentCount }, () => ({
    level: 0,
    afflictedCount: 0,
    rowCount: 0,
    dominantKind: null,
  }));
  const kindCounts: Map<AfflictionKind, number>[] = Array.from(
    { length: segmentCount },
    () => new Map<AfflictionKind, number>(),
  );

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const segmentIndex = Math.min(
      segmentCount - 1,
      Math.floor((rowIndex * segmentCount) / rowCount),
    );
    const segment = segments[segmentIndex];
    const counts = kindCounts[segmentIndex];
    if (!segment || !counts) continue;
    segment.rowCount += 1;

    const kinds = kindsByRow.get(rowIndex);
    if (!kinds) continue;
    segment.afflictedCount += kinds.length;
    for (const kind of kinds) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  segments.forEach((segment, i) => {
    const denom = segment.rowCount * Math.max(1, columnCapacity);
    const ratio = denom > 0 ? segment.afflictedCount / denom : 0;
    segment.level = levelForRatio(ratio);
    segment.dominantKind = pickDominantKind(kindCounts[i], kindOrder);
  });

  return segments;
}

/** Ties break by kindOrder — the order predicates appear in winCondition.all — so results are deterministic, matching the same rule used for overlapping single-cell claims (design spec §2.5). */
function pickDominantKind(
  counts: Map<AfflictionKind, number> | undefined,
  kindOrder: AfflictionKind[],
): AfflictionKind | null {
  if (!counts || counts.size === 0) return null;
  let best: AfflictionKind | null = null;
  let bestCount = 0;
  for (const kind of kindOrder) {
    const count = counts.get(kind) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = kind;
    }
  }
  return best;
}

/**
 * Exact thirds (1/3, 2/3), not the decimal literals 0.33/0.66 an earlier
 * version used. That rounding error mattered in practice: a ratio computed
 * as exactly 1/3 (e.g. 1 afflicted column out of 3 capacity — CASE_SHIFT's
 * baseline before the player types anything) is 0.3333... > 0.33, so every
 * segment landed one level too high before any code had run.
 */
function levelForRatio(ratio: number): 0 | 1 | 2 | 3 {
  if (ratio <= 0) return 0;
  if (ratio <= 1 / 3) return 1;
  if (ratio <= 2 / 3) return 2;
  return 3;
}
