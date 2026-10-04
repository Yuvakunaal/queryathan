import type { RefObject } from "react";
import styles from "./RunBar.module.css";

export interface RunBarProps {
  isRunning: boolean;
  onRun: () => void;
  /** True while text is highlighted in the editor: the button then runs only that. */
  hasSelection?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const RUN_SHORTCUT = isMac ? "Cmd+Enter" : "Ctrl+Enter";

export default function RunBar({
  isRunning,
  onRun,
  buttonRef,
  hasSelection = false,
}: RunBarProps) {
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
            {hasSelection ? "Run selection" : "Run"}
          </>
        )}
      </button>
      <span className={styles.hint}>
        {hasSelection
          ? "Only the highlighted text runs, on the table as it is now."
          : "Runs everything in the editor, on the original table."}{" "}
        {RUN_SHORTCUT} also runs.
      </span>
    </div>
  );
}
