import { TEXT_SCALES } from "../../lib/a11y";
import type { A11yState } from "../../lib/a11y";
import { classNames } from "../../lib/classNames";
import SoundMenu from "./SoundMenu";
import { useTips } from "../../TipsContext";
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
  const tips = useTips();
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
        className={classNames(styles.a11yButton, styles.wide)}
        aria-label="Light theme"
        aria-pressed={a11y.theme === "light"}
        onClick={() => {
          onChange({ ...a11y, theme: a11y.theme === "light" ? "dark" : "light" });
        }}
      >
        {a11y.theme === "light" ? "Light" : "Dark"}
      </button>
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="Toggle CRT effect"
        aria-pressed={!a11y.crtReduced}
        onClick={() => {
          onChange({ ...a11y, crtReduced: !a11y.crtReduced });
        }}
      >
        CRT
      </button>
      <SoundMenu a11y={a11y} onChange={onChange} />
      <button
        type="button"
        className={styles.a11yButton}
        aria-label="Tips: SQL and Python"
        title="Tips: SQL and Python"
        onClick={tips.open}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
          <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
          <path d="M9 8h7M9 12h5" />
        </svg>
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
