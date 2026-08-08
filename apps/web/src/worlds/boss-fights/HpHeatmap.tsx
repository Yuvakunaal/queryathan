import { useEffect, useMemo, useRef } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import { computeHpSegments, HP_LEVEL_COLORS, HP_SEGMENT_HEIGHTS_PX } from "./hpSegments";
import { playHpShatterBatch, tweenHpCounter } from "../../anim/world1/hpShatter";
import type { SegmentShatterOptions } from "../../anim/world1/hpShatter";
import { classNames } from "../../lib/classNames";
import styles from "./HpHeatmap.module.css";

const MAX_SEGMENTS = 200;

export interface HpHeatmapProps {
  grid: ResultGrid;
  column: string;
}

export default function HpHeatmap({ grid, column }: HpHeatmapProps) {
  const segments = useMemo(
    () => computeHpSegments(grid, column, MAX_SEGMENTS),
    [grid, column],
  );
  const afflictedTotal = useMemo(
    () => segments.reduce((sum, s) => sum + s.afflictedCount, 0),
    [segments],
  );
  const rowTotal = grid.rows.length;

  const segRefs = useRef<(HTMLElement | null)[]>([]);
  const shardRefs = useRef<HTMLElement[][]>([]);
  const prevSegmentsRef = useRef<typeof segments | null>(null);
  const prevCountRef = useRef<number | null>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevSegments = prevSegmentsRef.current;
    const prevCount = prevCountRef.current;

    if (prevSegments) {
      const shattering: SegmentShatterOptions[] = [];
      segments.forEach((seg, i) => {
        const prev = prevSegments[i];
        const segEl = segRefs.current[i];
        if (prev && segEl && seg.level < prev.level) {
          shattering.push({
            segEl,
            shardEls: shardRefs.current[i] ?? [],
            oldHeightPx: HP_SEGMENT_HEIGHTS_PX[prev.level],
            newHeightPx: HP_SEGMENT_HEIGHTS_PX[seg.level],
            newColor: HP_LEVEL_COLORS[seg.level],
          });
        }
      });
      if (shattering.length > 0) playHpShatterBatch(shattering);

      if (
        prevCount !== null &&
        prevCount !== afflictedTotal &&
        numRef.current &&
        meterRef.current
      ) {
        tweenHpCounter(numRef.current, meterRef.current, prevCount, afflictedTotal);
      }
    } else if (numRef.current) {
      numRef.current.textContent = String(afflictedTotal).padStart(3, "0");
    }

    prevSegmentsRef.current = segments;
    prevCountRef.current = afflictedTotal;
  }, [segments, afflictedTotal]);

  const restored = afflictedTotal === 0;

  return (
    <div className={styles.hpBand}>
      <div className={styles.hpLabel}>
        {restored ? "HULL INTEGRITY  RESTORED" : "HULL INTEGRITY"}
      </div>
      <div
        className={styles.hpStrip}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={rowTotal}
        aria-valuenow={afflictedTotal}
        aria-label="Afflicted cells remaining"
        ref={meterRef}
      >
        {segments.map((seg, i) => (
          <i
            key={`seg-${String(i)}`}
            className={styles.hpSeg}
            data-level={seg.level}
            style={{ height: `${String(HP_SEGMENT_HEIGHTS_PX[seg.level])}px` }}
            ref={(el) => {
              segRefs.current[i] = el;
            }}
          >
            {[0, 1, 2].map((shardIndex) => (
              <b
                key={shardIndex}
                className={styles.shard}
                ref={(el) => {
                  const shards = (shardRefs.current[i] ??= []);
                  if (el) shards[shardIndex] = el;
                }}
              />
            ))}
          </i>
        ))}
      </div>
      <div className={styles.hpReadout}>
        <span
          ref={numRef}
          className={classNames(styles.hpNum, restored && styles.hpNumZero)}
        >
          {String(afflictedTotal).padStart(3, "0")}
        </span>
        <span className={styles.hpDenom}>/ {rowTotal} ROWS</span>
      </div>
    </div>
  );
}
