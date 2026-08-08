import type { ResultGrid } from "@dcq/engine-adapters";

export interface HpSegment {
  level: 0 | 1 | 2 | 3;
  afflictedCount: number;
  rowCount: number;
}

export const HP_SEGMENT_HEIGHTS_PX = [6, 11, 15, 18] as const;

/**
 * Mirrors --w1-rule-faint / --w1-null-ramp-2/3/4 in theme.css — used only as
 * hpShatter.ts's transient animation target (GSAP needs a concrete color to
 * interpolate toward, not a var() reference). The resting state is always
 * CSS-driven via HpHeatmap.module.css's [data-level] rules, which is what
 * lets [data-dcq-contrast="high"] actually reach the strip.
 */
export const HP_LEVEL_COLORS = ["#121A17", "#5B3A73", "#8E56AD", "#C77DFF"] as const;

/**
 * Per-row auto-binned heatmap (spec §6) — a minimap of where afflictions
 * cluster, not an aggregate HP bar. Segment count is capped at 200; CSS
 * flexbox (`flex: 1 1 0`) fills the available strip width regardless of the
 * exact count, so no viewport-width measurement is needed here.
 */
export function computeHpSegments(
  grid: ResultGrid,
  column: string,
  maxSegments: number,
): HpSegment[] {
  const rowCount = grid.rows.length;
  const segmentCount = Math.max(1, Math.min(maxSegments, rowCount));
  const segments: HpSegment[] = Array.from({ length: segmentCount }, () => ({
    level: 0,
    afflictedCount: 0,
    rowCount: 0,
  }));

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const segmentIndex = Math.min(
      segmentCount - 1,
      Math.floor((rowIndex * segmentCount) / rowCount),
    );
    const segment = segments[segmentIndex];
    if (!segment) continue;
    segment.rowCount += 1;
    if (grid.rows[rowIndex]?.[column] === null) segment.afflictedCount += 1;
  }

  for (const segment of segments) {
    const ratio = segment.rowCount > 0 ? segment.afflictedCount / segment.rowCount : 0;
    segment.level = levelForRatio(ratio);
  }

  return segments;
}

function levelForRatio(ratio: number): 0 | 1 | 2 | 3 {
  if (ratio <= 0) return 0;
  if (ratio <= 0.33) return 1;
  if (ratio <= 0.66) return 2;
  return 3;
}
