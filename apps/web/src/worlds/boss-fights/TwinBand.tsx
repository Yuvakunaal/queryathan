import { useMemo } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { Predicate, WinCondition } from "@dcq/content-schema";
import { missingColumns } from "../../lib/afflictions";
import { predicateDebt, totalDebt } from "../../lib/affliction-cells";
import styles from "./TwinBand.module.css";

export interface TwinBandProps {
  grid: ResultGrid;
  winCondition: WinCondition;
  leftName: string;
  rightName: string;
}

interface Check {
  key: string;
  label: string;
  detail: string;
  met: boolean;
}

function describe(grid: ResultGrid, predicate: Predicate): Omit<Check, "key"> {
  const debt = predicateDebt(grid, predicate);
  const met = debt === 0;
  switch (predicate.predicate) {
    case "row_count":
      return {
        label: `Exactly ${String(predicate.equals)} rows`,
        detail: met ? "yes" : `has ${String(grid.rows.length)}`,
        met,
      };
    case "has_columns":
      return {
        label: `Has ${predicate.columns.join(", ")}`,
        detail: met
          ? "yes"
          : `missing ${missingColumns(grid, predicate.columns).join(", ")}`,
        met,
      };
    case "no_nulls":
      return {
        label: `No gaps in ${predicate.column}`,
        detail: met ? "yes" : `${String(debt)} empty`,
        met,
      };
    case "no_duplicates":
      return {
        label: `No repeats in ${predicate.columns.join("+")}`,
        detail: met ? "yes" : `${String(debt)} repeated`,
        met,
      };
    case "no_whitespace":
      return {
        label: `No stray spaces in ${predicate.column}`,
        detail: met ? "yes" : `${String(debt)} cells`,
        met,
      };
    case "consistent_casing":
      return {
        label: `${predicate.column} in ${predicate.case} case`,
        detail: met ? "yes" : `${String(debt)} cells`,
        met,
      };
    case "no_outliers":
      return {
        label: `${predicate.column} within range`,
        detail: met ? "yes" : `${String(debt)} outside`,
        met,
      };
    case "valid_dtype":
      return {
        label: `${predicate.column} is ${predicate.dtype}`,
        detail: met ? "yes" : "wrong type",
        met,
      };
    case "matches_pattern":
      return {
        label: `${predicate.column} fits the pattern`,
        detail: met ? "yes" : `${String(debt)} cells`,
        met,
      };
    case "no_mojibake":
      return {
        label: `${predicate.column} readable`,
        detail: met ? "yes" : `${String(debt)} garbled`,
        met,
      };
  }
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
        ...describe(grid, predicate),
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
