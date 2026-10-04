import type { Ref } from "react";
import type { A11yState } from "../../lib/a11y";
import { classNames } from "../../lib/classNames";
import A11yControls from "./A11yControls";
import styles from "./TopBar.module.css";

export interface TopBarProps {
  /** "< Roster" or "< Back". */
  backLabel: string;
  onBack: () => void;
  /** e.g. THE-VAULT or SANDBOX. */
  worldName: string;
  /** The case name, once it is known. */
  title?: string | undefined;
  finalBoss?: boolean;
  /** The player's rank in this world; left out in the sandbox. */
  rank?: string | undefined;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  railRef?: Ref<HTMLDivElement>;
}

/**
 * The bar across the top of a fight: the way back, where you are, your rank and
 * the display settings. It is shown on every screen of a fight (choosing an
 * engine, loading, the boot sequence, the fight itself), so none of those
 * leaves you without a way back or a way to change the text size or theme.
 */
export default function TopBar({
  backLabel,
  onBack,
  worldName,
  title,
  finalBoss = false,
  rank,
  a11y,
  onA11yChange,
  railRef,
}: TopBarProps) {
  return (
    <div className={styles.statusRail} ref={railRef}>
      <span className={styles.railLeft}>
        <button type="button" className={styles.rosterLink} onClick={onBack}>
          {backLabel}
        </button>
        <span className={styles.railDivider} aria-hidden="true" />
        <span className={styles.railTitle}>
          {worldName}
          {title ? (
            <>
              {" "}
              //{" "}
              <span
                className={classNames(
                  styles.statusRailBoss,
                  finalBoss && styles.statusRailBossFinal,
                )}
              >
                {title}
              </span>
            </>
          ) : null}
        </span>
      </span>
      <div className={styles.a11yRow}>
        {rank ? <span className={styles.rankBadge}>{rank}</span> : null}
        <A11yControls a11y={a11y} onChange={onA11yChange} />
      </div>
    </div>
  );
}
