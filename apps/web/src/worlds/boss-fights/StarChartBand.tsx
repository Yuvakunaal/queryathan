import { useMemo } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";
import { compareAnswer } from "../../lib/afflictions";
import { describePredicate } from "./predicateChecks";
import styles from "./StarChartBand.module.css";

export interface StarChartBandProps {
  grid: ResultGrid;
  winCondition: WinCondition;
}

const MAX_STARS = 48;

/**
 * The Observatory's HUD: the answer drawn as a star chart. Each column the
 * answer needs is a chip, and each row of the expected answer is a star that
 * lights up once the player's table holds a matching row. It shows how close
 * the answer is without ever showing the expected values themselves.
 */
export default function StarChartBand({ grid, winCondition }: StarChartBandProps) {
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
  const shown = report.matched.slice(0, MAX_STARS);
  const hidden = report.matched.length - shown.length;

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
        <div className={styles.row}>
          <span className={styles.rowLabel}>Rows</span>
          <ul className={styles.stars} aria-hidden="true">
            {shown.map((lit, i) => (
              // The position is the identity: stars have no content of their own.
              <li key={i} className={styles.star} data-lit={lit ? "true" : "false"}>
                {lit ? "★" : "☆"}
              </li>
            ))}
            {hidden > 0 ? <li className={styles.more}>+{String(hidden)}</li> : null}
          </ul>
        </div>
        {report.rowCount !== report.expectedRows ? (
          <p className={styles.note}>
            Your answer has {String(report.rowCount)}{" "}
            {report.rowCount === 1 ? "row" : "rows"}; the chart has{" "}
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
