import type { RefObject } from "react";
import styles from "./RunBar.module.css";

export interface RunBarProps {
  isRunning: boolean;
  onRun: () => void;
  /** True while text is highlighted in the editor: the button then runs only that. */
  hasSelection?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  /** Phones only: jump back into the editor (and open the keyboard). */
  onEdit?: (() => void) | undefined;
  /** Phones only: jump to the result. */
  onResult?: (() => void) | undefined;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const RUN_SHORTCUT = isMac ? "Cmd+Enter" : "Ctrl+Enter";

export default function RunBar({
  isRunning,
  onRun,
  buttonRef,
  hasSelection = false,
  onEdit,
  onResult,
}: RunBarProps) {
  return (
    <div className={styles.runBar}>
      {onEdit ? (
        <button
          type="button"
          className={styles.dockButton}
          aria-label="Edit query"
          onClick={onEdit}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <span>Edit</span>
        </button>
      ) : null}
      {onResult ? (
        <button
          type="button"
          className={styles.dockButton}
          aria-label="See result"
          onClick={onResult}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18M9 4v16" />
          </svg>
          <span>Result</span>
        </button>
      ) : null}
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
