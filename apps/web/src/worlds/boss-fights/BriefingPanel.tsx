import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { CaseTier } from "@dcq/content-schema";
import { renderSigil } from "./sigil";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";
import { describePredicate } from "./predicateChecks";
import type { RunContext } from "../../lib/run-context";
import styles from "./BriefingPanel.module.css";

/** A prominent note about the form the answer takes. */
export interface AnswerNote {
  title: string;
  /** The sentences around the example. */
  before: string;
  /** An example to copy the shape of, shown as code. */
  code: string;
  after: string;
}

export interface BriefingPanelProps {
  title: string;
  subtitle?: string | undefined;
  briefing: string;
  /** Plain one-or-two-sentence statement of what to do. */
  task?: string | undefined;
  /** How the answer must be handed in, when it is not just "edit the table" (e.g. build a table named result). */
  answerNote?: AnswerNote | undefined;
  grid: ResultGrid;
  winCondition: WinCondition;
  /** The last run, for rules that judge speed. */
  run?: RunContext | undefined;
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
  task,
  answerNote,
  grid,
  winCondition,
  run,
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
      {task ? (
        <section className={styles.task} aria-labelledby="task-heading">
          <h2 id="task-heading" className={styles.sectionHeading}>
            Your task
          </h2>
          <p className={styles.taskText}>{task}</p>
        </section>
      ) : null}
      {answerNote ? (
        <section className={styles.note} aria-labelledby="answer-note-heading">
          <h2 id="answer-note-heading" className={styles.noteHeading}>
            {answerNote.title}
          </h2>
          <p className={styles.noteText}>{answerNote.before}</p>
          <pre className={styles.noteCode}>{answerNote.code}</pre>
          <p className={styles.noteText}>{answerNote.after}</p>
        </section>
      ) : null}
      <section className={styles.winSection} aria-labelledby="win-heading">
        <h2 id="win-heading" className={styles.sectionHeading}>
          {tier === "final-boss" ? "To win" : "You win when"}
        </h2>
        {tier === "final-boss" ? (
          <p className={styles.withheld}>
            Not disclosed. Read the data and decide what clean looks like.
          </p>
        ) : (
          <ul className={styles.checklist}>
            {winCondition.all.map((predicate, i) => {
              const check = describePredicate(grid, predicate, run);
              return (
                <li
                  key={`${predicate.predicate}-${String(i)}`}
                  data-met={check.met ? "true" : "false"}
                >
                  <span className={styles.box} aria-hidden="true">
                    {check.met ? "✓" : ""}
                  </span>
                  <span>
                    {check.label}
                    {check.met ? null : (
                      <span className={styles.unmet}> ({check.detail})</span>
                    )}
                    <span className={styles.srOnly}>
                      {check.met ? ", done" : ", not done yet"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <details className={styles.story} open={!task}>
        <summary>{task ? "The story behind it" : "Briefing"}</summary>
        <div className={styles.body}>
          {briefing.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </details>
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
