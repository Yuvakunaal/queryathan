import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { CaseTier } from "@dcq/content-schema";
import { renderSigil } from "./sigil";
import { classNames } from "../../lib/classNames";
import styles from "./BriefingPanel.module.css";

export interface BriefingPanelProps {
  title: string;
  subtitle?: string | undefined;
  briefing: string;
  objectiveLabel: string;
  remaining: number;
  initial: number;
  tier: CaseTier;
  /** Progressive hints for the active engine; omit or pass [] to hide the hint control. */
  hints?: string[] | undefined;
  onHintRevealed?: ((count: number) => void) | undefined;
}

const TIER_TAG_LABEL: Record<CaseTier, string | null> = {
  tutorial: null,
  "mid-boss": "MID-BOSS",
  "final-boss": "FINAL BOSS",
};

export default function BriefingPanel({
  title,
  subtitle,
  briefing,
  objectiveLabel,
  remaining,
  initial,
  tier,
  hints = [],
  onHintRevealed,
}: BriefingPanelProps) {
  const [revealed, setRevealed] = useState(0);
  const hintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealed > 0) hintsRef.current?.scrollIntoView({ block: "nearest" });
  }, [revealed]);
  const sigilRef = useRef<HTMLPreElement>(null);
  const prevRemainingRef = useRef(remaining);

  useEffect(() => {
    const el = sigilRef.current;
    if (!el || prevRemainingRef.current === remaining) return;
    prevRemainingRef.current = remaining;

    gsap
      .timeline()
      .to(el, { opacity: 0.4, duration: 0.09, ease: "power1.inOut" })
      .call(() => {
        el.textContent = renderSigil(remaining, initial);
      })
      .to(el, { opacity: 1, duration: 0.09, ease: "power1.inOut" });
  }, [remaining, initial]);

  return (
    <div className={styles.briefing} tabIndex={0}>
      <div className={styles.header}>
        <pre className={styles.sigil} aria-hidden="true" ref={sigilRef}>
          {renderSigil(remaining, initial)}
        </pre>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            {title}
            {TIER_TAG_LABEL[tier] ? (
              <span className={styles.tierTag} data-tier={tier}>
                {TIER_TAG_LABEL[tier]}
              </span>
            ) : null}
          </h1>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        </div>
      </div>
      <div className={styles.body}>
        {briefing.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className={styles.objective}>
        OBJECTIVE{" "}
        {tier === "final-boss" ? (
          <span className={classNames(styles.objectiveValue, styles.objectiveWithheld)}>
            [ NOT DISCLOSED — READ THE DATA ]
          </span>
        ) : (
          <span className={styles.objectiveValue}>{objectiveLabel}</span>
        )}
      </div>
      {tier !== "final-boss" && hints.length > 0 ? (
        <div className={styles.hints} ref={hintsRef}>
          {revealed > 0 ? (
            <ol className={styles.hintList} aria-live="polite">
              {hints.slice(0, revealed).map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ol>
          ) : null}
          {revealed < hints.length ? (
            <button
              type="button"
              className={styles.hintButton}
              onClick={() => {
                const next = revealed + 1;
                setRevealed(next);
                onHintRevealed?.(next);
              }}
            >
              {revealed === 0 ? "Show a hint" : "Show the next hint"} ({revealed}/
              {hints.length})
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
