import { useMemo, useRef } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { Predicate, WinCondition } from "@dcq/content-schema";
import { getAfflictedCells } from "../../lib/affliction-cells";
import { BADGE_GLYPH } from "./afflictionPresentation";
import { kindForPredicate } from "../../lib/affliction-cells";
import styles from "./TumblerBand.module.css";

export interface TumblerBandProps {
  grid: ResultGrid;
  winCondition: WinCondition;
}

/** Max travel of a pin away from the shear line, in px. Keep in sync with --tumbler-travel in the CSS. */
const TRAVEL_PX = 22;

function labelFor(predicate: Predicate): string {
  switch (predicate.predicate) {
    case "no_nulls":
      return `${predicate.column} nulls`;
    case "no_duplicates":
      return `${predicate.columns.join("+")} repeats`;
    case "no_whitespace":
      return `${predicate.column} spaces`;
    case "consistent_casing":
      return `${predicate.column} case`;
    case "no_outliers":
      return `${predicate.column} range`;
    case "valid_dtype":
      return `${predicate.column} type`;
    case "matches_pattern":
      return `${predicate.column} format`;
    case "no_mojibake":
      return `${predicate.column} text`;
    case "row_count":
      return "row count";
    case "has_columns":
      return "columns";
    case "runtime_under":
      return "speed";
    case "lacks_columns":
      return "old columns";
    case "column_sum":
      return `${predicate.column} total`;
    case "distinct_count":
      return `${predicate.column} variety`;
  }
}

/**
 * The Vault's signature HUD: one lock tumbler per win-condition predicate.
 * A pin starts displaced from the shear line in proportion to how many cells
 * still break its rule, and slides onto the line as they clear. When every
 * pin sits on the line the lock is set. Position is driven by a CSS
 * transform transition, so it stays smooth and respects reduced motion.
 */
export default function TumblerBand({ grid, winCondition }: TumblerBandProps) {
  const tumblers = useMemo(
    () =>
      winCondition.all.map((predicate) => ({
        predicate,
        label: labelFor(predicate),
        remaining: getAfflictedCells(grid, predicate).length,
      })),
    [grid, winCondition],
  );

  // The first count seen per tumbler is its "full" displacement. A ref, not
  // state: it is written once and only read while rendering.
  const initialRef = useRef<number[] | null>(null);
  initialRef.current ??= tumblers.map((t) => t.remaining);
  const initial = initialRef.current;

  const total = tumblers.reduce((sum, t) => sum + t.remaining, 0);
  const allSet = total === 0;

  return (
    <div className={styles.band}>
      <div className={styles.label}>{allSet ? "LOCK OPEN" : "TUMBLERS"}</div>
      <ul className={styles.row}>
        {tumblers.map((t, i) => {
          const start = Math.max(1, initial[i] ?? 1);
          const fraction = Math.min(1, t.remaining / start);
          const direction = i % 2 === 0 ? -1 : 1;
          const offset = direction * fraction * TRAVEL_PX;
          const isSet = t.remaining === 0;
          return (
            <li
              key={`${t.predicate.predicate}-${t.label}`}
              className={styles.tumbler}
              data-set={isSet ? "true" : "false"}
              aria-label={
                isSet
                  ? `${t.label}: set`
                  : `${t.label}: ${String(t.remaining)} cells still wrong`
              }
            >
              <span className={styles.shaft} aria-hidden="true">
                <span className={styles.shear} />
                <span
                  className={styles.pin}
                  style={{ transform: `translateY(${String(offset)}px)` }}
                />
              </span>
              <span className={styles.name} aria-hidden="true">
                <span className={styles.glyph} data-kind={kindForPredicate(t.predicate)}>
                  {BADGE_GLYPH[kindForPredicate(t.predicate)]}
                </span>{" "}
                {t.label}
              </span>
              <span className={styles.count} aria-hidden="true">
                {isSet ? "set" : t.remaining}
              </span>
            </li>
          );
        })}
      </ul>
      <div className={styles.readout} aria-live="polite">
        <span className={styles.num}>{String(total).padStart(3, "0")}</span>
        <span className={styles.denom}>CELLS / {grid.rows.length} ROWS</span>
      </div>
    </div>
  );
}
