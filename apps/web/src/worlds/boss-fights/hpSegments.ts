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
};

/**
 * Per-row auto-binned heatmap (design spec §3) — a minimap of where
 * afflictions cluster, not an aggregate HP bar. Segment count is capped at
 * `maxSegments`; CSS flexbox (`flex: 1 1 0`) fills the available strip
 * width regardless of the exact count, so no viewport-width measurement is
 * needed here.
 *
 * A segment's ratio is normalized against `predicateCount` (design spec
 * §3.1) so a bin's height reflects "how much of the total possible damage
 * landed here," not just "how many cells" — a bin fully hit by 1 of 3
 * active predicates reads as partially afflicted, not maxed out.
 */
export function computeHpSegments(
  rowCount: number,
  kindsByRow: Map<number, AfflictionKind[]>,
  predicateCount: number,
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
    const denom = segment.rowCount * Math.max(1, predicateCount);
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

function levelForRatio(ratio: number): 0 | 1 | 2 | 3 {
  if (ratio <= 0) return 0;
  if (ratio <= 0.33) return 1;
  if (ratio <= 0.66) return 2;
  return 3;
}
