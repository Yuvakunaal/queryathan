import { useEffect, useRef } from "react";
import gsap from "gsap";
import { renderSigil } from "./sigil";
import styles from "./BriefingPanel.module.css";

export interface BriefingPanelProps {
  title: string;
  subtitle?: string | undefined;
  briefing: string;
  objectiveLabel: string;
  remaining: number;
  initial: number;
}

export default function BriefingPanel({
  title,
  subtitle,
  briefing,
  objectiveLabel,
  remaining,
  initial,
}: BriefingPanelProps) {
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
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        </div>
      </div>
      <div className={styles.body}>
        {briefing.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className={styles.objective}>
        OBJECTIVE <span className={styles.objectiveValue}>{objectiveLabel}</span>
      </div>
    </div>
  );
}
