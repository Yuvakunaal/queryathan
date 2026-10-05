import { useMemo } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";
import { compareAnswer } from "../../lib/afflictions";
import { describePredicate } from "./predicateChecks";
import styles from "./StarChartBand.module.css";

export interface StarChartBandProps {
  grid: ResultGrid;
  winCondition: WinCondition;
  /** Whether the player has run anything yet; before that there is no answer to compare. */
  ran?: boolean;
}

/**
 * The HUD for cases judged by an answer table: each column the answer needs is
 * a chip (dashed until the player's table has it), and a counter shows how many
 * of the expected rows are right. It shows how close the answer is without ever
 * showing the expected values themselves.
 */
export default function StarChartBand({
  grid,
  winCondition,
  ran = true,
}: StarChartBandProps) {
  const { columns, report, others } = useMemo(() => {
    const answer = winCondition.all.find((p) => p.predicate === "result_matches");
    const rest = winCondition.all
      .filter((p) => p.predicate !== "result_matches")
      .map((p, i) => ({
        key: `${p.predicate}-${String(i)}`,
        ...describePredicate(grid, p),
      }));
    if (answer?.predicate !== "result_matches") {
      return { columns: [] as string[], report: null, others: rest };
    }
    return { columns: answer.columns, report: compareAnswer(grid, answer), others: rest };
  }, [grid, winCondition]);

  if (!report) return null;
  return (
    <div className={styles.band}>
      <div className={styles.chart}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Columns</span>
          <ul className={styles.chips}>
            {columns.map((column) => {
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
        {!ran ? (
          <p className={styles.note}>
            Run your code to see how close your answer is. Nothing is judged until you do.
          </p>
        ) : report.rowCount !== report.expectedRows ? (
          <p className={styles.note}>
            Your answer has {String(report.rowCount)}{" "}
            {report.rowCount === 1 ? "row" : "rows"}; the answer needs{" "}
            {String(report.expectedRows)}.
          </p>
        ) : null}
        {report.ok ? null : !report.orderOk ? (
          <p className={styles.note}>The rows are right, but they need to be in order.</p>
        ) : null}
        {others.length > 0 ? (
          <ul className={styles.checks}>
            {others.map((check) => (
              <li key={check.key} data-met={check.met ? "true" : "false"}>
                {check.met ? "✓" : "○"} {check.label}
                {check.met ? null : (
                  <span className={styles.detail}> ({check.detail})</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className={styles.readout} role="status">
        <span className={styles.num}>
          {String(report.matchedCount)}
          <span className={styles.denom}> / {String(report.expectedRows)}</span>
        </span>
        <span className={styles.dims}>rows correct</span>
      </div>
    </div>
  );
}
