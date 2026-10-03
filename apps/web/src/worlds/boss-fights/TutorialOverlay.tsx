import { useEffect, useRef } from "react";
import styles from "./TutorialOverlay.module.css";

export interface TutorialOverlayProps {
  engineLabel: string;
  onClose: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

export default function TutorialOverlay({ engineLabel, onClose }: TutorialOverlayProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const runKey = isMac ? "Cmd+Enter" : "Ctrl+Enter";

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <h2 id="tutorial-title" className={styles.title}>
          How a fight works
        </h2>
        <ol className={styles.steps}>
          <li>
            <strong>Read the briefing and objective.</strong> The objective lists exactly
            what must be true of the data to win.
          </li>
          <li>
            <strong>Find the afflicted cells.</strong> Highlighted cells in the table are
            the problems. The bar above it counts them down.
          </li>
          <li>
            <strong>Write code in the editor.</strong> It runs for real in {engineLabel},
            in your browser. Press <kbd>{runKey}</kbd> or Execute.
          </li>
          <li>
            <strong>Read the output.</strong> Red lines show old values, green lines show
            new ones. Errors appear exactly as the engine reports them.
          </li>
          <li>
            <strong>Stuck?</strong> Use "Show a hint" under the objective.
          </li>
        </ol>
        <button ref={buttonRef} type="button" className={styles.button} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
