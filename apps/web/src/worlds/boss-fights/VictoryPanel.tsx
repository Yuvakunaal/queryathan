import { useEffect, useRef } from "react";
import styles from "./VictoryPanel.module.css";

export interface VictoryPanelProps {
  kicker: string;
  bossName: string;
  runCount: number;
  cellsCleared: number;
  techniques: string[];
  hintsUsed: number;
  onContinue: () => void;
  onExitToRoster: () => void;
}

export default function VictoryPanel({
  kicker,
  bossName,
  runCount,
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
        <dl className={styles.stats}>
          <div>
            <dt>Runs</dt>
            <dd>{runCount}</dd>
          </div>
          <div>
            <dt>Cells cleaned</dt>
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
