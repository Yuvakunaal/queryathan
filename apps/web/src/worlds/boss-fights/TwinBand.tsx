import { useMemo } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";
import { totalDebt } from "../../lib/affliction-cells";
import { describePredicate } from "./predicateChecks";
import type { Check } from "./predicateChecks";
import styles from "./TwinBand.module.css";

export interface TwinBandProps {
  grid: ResultGrid;
  winCondition: WinCondition;
  leftName: string;
  rightName: string;
}

/**
 * The Twins' HUD: two table names joined by a link, and a live checklist of
 * what the joined result must satisfy. Whole-table rules (row count, columns)
 * have no cell to highlight, so they need to be spelled out; the link closes
 * ("snaps taut") once every check is met.
 */
export default function TwinBand({
  grid,
  winCondition,
  leftName,
  rightName,
}: TwinBandProps) {
  const checks = useMemo<Check[]>(
    () =>
      winCondition.all.map((predicate, i) => ({
        key: `${predicate.predicate}-${String(i)}`,
        ...describePredicate(grid, predicate),
      })),
    [grid, winCondition],
  );
  const remaining = totalDebt(grid, winCondition);
  const linked = checks.every((c) => c.met);

  return (
    <div className={styles.band}>
      <div
        className={styles.link}
        data-linked={linked ? "true" : "false"}
        aria-hidden="true"
      >
        <span className={styles.node}>{leftName}</span>
        <span className={styles.strand} />
        <span className={styles.node}>{rightName}</span>
      </div>
      <ul className={styles.checks} aria-label="What the joined result needs">
        {checks.map((c) => (
          <li key={c.key} className={styles.check} data-met={c.met ? "true" : "false"}>
            <span className={styles.mark} aria-hidden="true">
              {c.met ? "✓" : "•"}
            </span>
            <span className={styles.checkLabel}>{c.label}</span>
            <span className={styles.checkDetail}>
              <span className={styles.srOnly}>{c.met ? "met" : "not met"}: </span>
              {c.detail}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.readout} aria-live="polite">
        <span className={styles.num}>{String(remaining).padStart(3, "0")}</span>
        <span className={styles.denom}>TO FIX</span>
      </div>
    </div>
  );
}
