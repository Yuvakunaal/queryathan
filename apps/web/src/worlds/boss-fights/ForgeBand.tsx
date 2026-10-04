import type { Forge, WinCondition } from "@dcq/content-schema";
import { budgetMs, stampFor } from "../../lib/forge";
import type { RunContext } from "../../lib/run-context";
import styles from "./ForgeBand.module.css";

export interface ForgeBandProps {
  winCondition: WinCondition;
  forge: Forge | undefined;
  run: RunContext;
  engine: "python" | "sql";
  rows: number;
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms >= 10) return `${String(Math.round(ms))} ms`;
  return `${ms.toFixed(1)} ms`;
}

/**
 * The Foundry's HUD: a log-scale timing gauge. Speed differences in this
 * world are 10x to 100x, so a linear bar would squash every fast solution
 * into the left edge. Markers show the stamp cut-offs and the reference
 * solution; the needle is the player's last run.
 */
export default function ForgeBand({
  winCondition,
  forge,
  run,
  engine,
  rows,
}: ForgeBandProps) {
  const budget = budgetMs(winCondition, engine);
  if (budget === null) return null;
  const gold = forge?.goldMs[engine];
  const silver = forge?.silverMs[engine];
  const reference = forge?.referenceMs[engine];
  const measured = run.engine === engine ? run.elapsedMs : null;

  const floorMs = Math.max(
    0.5,
    Math.min(gold ?? budget, reference ?? budget, measured ?? budget) / 3,
  );
  const ceilMs = Math.max(budget * 4, (measured ?? 0) * 1.3);
  const span = Math.log10(ceilMs) - Math.log10(floorMs);
  const place = (ms: number): number =>
    Math.min(100, Math.max(0, ((Math.log10(ms) - Math.log10(floorMs)) / span) * 100));

  const stamp = stampFor(winCondition, forge, run);
  const passed = measured !== null && measured <= budget;

  return (
    <div className={styles.band}>
      <div className={styles.head}>
        <span className={styles.label}>THE FORGE</span>
        <span className={styles.rows}>{rows.toLocaleString()} rows</span>
        <span className={styles.spacer} />
        {stamp ? (
          <span className={styles.stamp} data-stamp={stamp}>
            {stamp} stamp
          </span>
        ) : null}
      </div>

      <div
        className={styles.gauge}
        role="img"
        aria-label={
          measured === null
            ? `Not timed yet. To pass, a run must finish in under ${String(budget)} milliseconds.`
            : `Last run ${String(Math.round(measured))} milliseconds. To pass, under ${String(budget)}.`
        }
      >
        <div className={styles.track} />
        <div
          className={styles.passZone}
          style={{ left: "0%", width: `${String(place(budget))}%` }}
        />
        {gold === undefined ? null : (
          <span
            className={styles.tick}
            data-kind="gold"
            style={{ left: `${String(place(gold))}%` }}
          />
        )}
        {silver === undefined ? null : (
          <span
            className={styles.tick}
            data-kind="silver"
            style={{ left: `${String(place(silver))}%` }}
          />
        )}
        <span
          className={styles.tick}
          data-kind="bronze"
          style={{ left: `${String(place(budget))}%` }}
        />
        {reference === undefined ? null : (
          <span className={styles.ref} style={{ left: `${String(place(reference))}%` }} />
        )}
        {measured === null ? null : (
          <span
            className={styles.needle}
            data-ok={passed ? "true" : "false"}
            style={{ left: `${String(place(measured))}%` }}
          />
        )}
      </div>

      <ul className={styles.legend}>
        <li
          className={styles.last}
          data-ok={measured === null ? "idle" : passed ? "true" : "false"}
        >
          <span className={styles.legendKey}>Last run</span>
          <strong>{measured === null ? "not timed yet" : formatMs(measured)}</strong>
        </li>
        <li>
          <span className={styles.legendKey}>Pass</span>
          <strong>under {formatMs(budget)}</strong>
        </li>
        {silver === undefined ? null : (
          <li>
            <span className={styles.legendKey}>Silver</span>
            <strong>{formatMs(silver)}</strong>
          </li>
        )}
        {gold === undefined ? null : (
          <li>
            <span className={styles.legendKey}>Gold</span>
            <strong>{formatMs(gold)}</strong>
          </li>
        )}
        {reference === undefined ? null : (
          <li>
            <span className={styles.legendKey}>Reference</span>
            <strong>about {formatMs(reference)}</strong>
          </li>
        )}
      </ul>
    </div>
  );
}
