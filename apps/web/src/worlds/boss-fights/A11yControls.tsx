import { TEXT_SCALES } from "../../lib/a11y";
import type { A11yState } from "../../lib/a11y";
import styles from "./A11yControls.module.css";

export interface A11yControlsProps {
  a11y: A11yState;
  onChange: (next: A11yState) => void;
}

/**
 * Shared between BossFightScreen and WorldMapScreen — a11y preferences
 * must reach both, not just whichever screen happens to be a fight.
 * Previously lived only inside BossFightScreen, which meant a player's
 * saved text-scale/CRT/contrast choices were silently ignored on the
 * world map (the app's actual landing screen since Phase 2) with no way
 * to change them until entering a fight.
 */
export default function A11yControls({ a11y, onChange }: A11yControlsProps) {
  return (
    <div className={styles.a11yControls}>
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="Decrease text size"
        onClick={() => {
          onChange({ ...a11y, textScaleIndex: Math.max(0, a11y.textScaleIndex - 1) });
        }}
      >
        A-
      </button>
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="Reset text size"
        onClick={() => {
          onChange({ ...a11y, textScaleIndex: 1 });
        }}
      >
        A
      </button>
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="Increase text size"
        onClick={() => {
          onChange({
            ...a11y,
            textScaleIndex: Math.min(TEXT_SCALES.length - 1, a11y.textScaleIndex + 1),
          });
        }}
      >
        A+
      </button>
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="Toggle CRT effect"
        aria-pressed={a11y.crtReduced}
        onClick={() => {
          onChange({ ...a11y, crtReduced: !a11y.crtReduced });
        }}
      >
        CRT
      </button>
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="High contrast mode"
        aria-pressed={a11y.highContrast}
        onClick={() => {
          onChange({ ...a11y, highContrast: !a11y.highContrast });
        }}
      >
        HC
      </button>
    </div>
  );
}
