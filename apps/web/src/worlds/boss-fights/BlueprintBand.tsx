import { useMemo } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";
import { totalDebt } from "../../lib/affliction-cells";
import { describePredicate } from "./predicateChecks";
import type { Check } from "./predicateChecks";
import styles from "./BlueprintBand.module.css";

export interface BlueprintBandProps {
  grid: ResultGrid;
  winCondition: WinCondition;
}

/**
 * The Architect's HUD: the target shape drawn as a plan. Columns the result
 * must have appear as chips (dashed until they exist), columns it must lose
 * appear struck through until they are gone, and the remaining rules (row
 * count, checksums) are listed beneath. Shape is the whole point of this
 * world, so it is shown as a shape rather than a count.
 */
export default function BlueprintBand({ grid, winCondition }: BlueprintBandProps) {
  const { needed, forbidden, others } = useMemo(() => {
    const neededColumns: string[] = [];
    const forbiddenColumns: string[] = [];
    const otherChecks: Check[] = [];
    winCondition.all.forEach((predicate, i) => {
      if (predicate.predicate === "has_columns") neededColumns.push(...predicate.columns);
      else if (predicate.predicate === "lacks_columns")
        forbiddenColumns.push(...predicate.columns);
      else
        otherChecks.push({
          key: `${predicate.predicate}-${String(i)}`,
          ...describePredicate(grid, predicate),
        });
    });
    return { needed: neededColumns, forbidden: forbiddenColumns, others: otherChecks };
  }, [grid, winCondition]);

  const remaining = totalDebt(grid, winCondition);

  return (
    <div className={styles.band}>
      <div className={styles.plan}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Needs</span>
          <ul className={styles.chips}>
            {needed.map((column) => {
              const present = grid.columns.includes(column);
              return (
                <li
                  key={column}
                  className={styles.chip}
                  data-state={present ? "ok" : "missing"}
                >
                  <span aria-hidden="true">{present ? "✓" : "+"}</span> {column}
                  <span className={styles.srOnly}>
                    {present ? " present" : " missing"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Remove</span>
          <ul className={styles.chips}>
            {forbidden.map((column) => {
              const present = grid.columns.includes(column);
              return (
                <li
                  key={column}
                  className={styles.chip}
                  data-state={present ? "remove" : "gone"}
                >
                  <span aria-hidden="true">{present ? "×" : "✓"}</span> {column}
                  <span className={styles.srOnly}>
                    {present ? " still present" : " removed"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <ul className={styles.checks} aria-label="Other requirements">
          {others.map((c) => (
            <li key={c.key} data-met={c.met ? "true" : "false"}>
              <span aria-hidden="true">{c.met ? "✓" : "•"}</span> {c.label}
              <span className={styles.detail}>
                <span className={styles.srOnly}>{c.met ? "met: " : "not met: "}</span>
                {c.met ? "" : ` (${c.detail})`}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.readout} aria-live="polite">
        <span className={styles.dims}>
          {grid.rows.length} × {grid.columns.length}
        </span>
        <span className={styles.num}>{String(remaining).padStart(3, "0")}</span>
        <span className={styles.denom}>TO FIX</span>
      </div>
    </div>
  );
}
