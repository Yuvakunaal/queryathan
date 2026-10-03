import type { RefObject } from "react";
import styles from "./RunBar.module.css";

export interface RunBarProps {
  isRunning: boolean;
  onRun: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const RUN_SHORTCUT = isMac ? "Cmd+Enter" : "Ctrl+Enter";

export default function RunBar({ isRunning, onRun, buttonRef }: RunBarProps) {
  return (
    <div className={styles.runBar}>
      <button
        type="button"
        ref={buttonRef}
        className={styles.runButton}
        data-running={isRunning ? "true" : undefined}
        onClick={onRun}
        disabled={isRunning}
      >
        {isRunning ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Running...
          </>
        ) : (
          <>
            <span className={styles.play} aria-hidden="true" />
            Run
          </>
        )}
      </button>
      <span className={styles.hint}>or press {RUN_SHORTCUT}</span>
    </div>
  );
}
