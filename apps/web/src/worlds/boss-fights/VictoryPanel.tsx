import { useEffect, useRef } from "react";
import type { Stamp } from "../../lib/forge";
import styles from "./VictoryPanel.module.css";

export interface VictoryPanelProps {
  kicker: string;
  /** World 5's quality stamp, if the case awards one. */
  stamp?: Stamp | null;
  elapsedMs?: number | null;
  bossName: string;
  runCount: number;
  /** What the second number counts: cells for cleaning cases, checks for rules about the whole result. */
  cleanedLabel: string;
  cellsCleared: number;
  techniques: string[];
  hintsUsed: number;
  onContinue: () => void;
  onExitToRoster: () => void;
}

export default function VictoryPanel({
  kicker,
  stamp = null,
  elapsedMs = null,
  bossName,
  runCount,
  cleanedLabel,
  cellsCleared,
  techniques,
  hintsUsed,
  onContinue,
  onExitToRoster,
}: VictoryPanelProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onContinue();
        }}
      >
        <p className={styles.kicker}>{kicker}</p>
        <h2 id="victory-title" className={styles.title}>
          {bossName}
        </h2>
        {stamp ? (
          <p className={styles.stamp} data-stamp={stamp}>
            <span className={styles.stampName}>{stamp} stamp</span>
            {elapsedMs === null ? null : (
              <span className={styles.stampTime}>
                last run {String(Math.round(elapsedMs))} ms
              </span>
            )}
          </p>
        ) : null}
        <dl className={styles.stats}>
          <div>
            <dt>Runs</dt>
            <dd>{runCount}</dd>
          </div>
          <div>
            <dt>{cleanedLabel}</dt>
            <dd>{cellsCleared}</dd>
          </div>
          <div>
            <dt>Hints used</dt>
            <dd>{hintsUsed}</dd>
          </div>
        </dl>
        <p className={styles.techniques}>Techniques practiced: {techniques.join(", ")}</p>
        <div className={styles.actions}>
          <button
            ref={primaryRef}
            type="button"
            className={styles.primary}
            onClick={onExitToRoster}
          >
            Back to roster
          </button>
          <button type="button" className={styles.secondary} onClick={onContinue}>
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  );
}
