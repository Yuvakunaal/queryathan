import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { makeBootLine, playBootSequence } from "../../anim/world1/bootType";
import { playCue } from "../../lib/sound";
import styles from "./BootSequence.module.css";

/** What the intro learns once the engine has loaded the case's table. */
export interface BootInfo {
  datasetFileName: string;
  datasetShape: string;
  afflictionCount: number;
  /** e.g. "NUL" or "NUL+DUP" for a stacked case: the actual predicate kinds being scanned for, never hardcoded. */
  scanLabel: string;
  /** Overrides the "N CELLS DETECTED" readout for cases that are not about afflicted cells. */
  detectedText?: string | undefined;
}

export interface BootSequenceProps {
  bossName: string;
  /** "pyodide/wasm" or "sql.js/wasm": the engine the player actually picked on the previous screen. */
  engineLabel: string;
  /** Null while the engine is still loading; the intro waits on its "mounting engine" line until it arrives. */
  info: BootInfo | null;
  /** A reassurance shown if loading takes a few seconds (the Python runtime on a first visit). */
  slowHint?: string | undefined;
  onEngage: () => void;
}

const SLOW_AFTER_MS = 3500;

/**
 * The terminal-style intro. It starts the moment an engine is chosen: the first
 * lines type at once and "mounting engine" waits, with a quiet "loading" marker,
 * until the engine is ready; then the rest types out. Python (a few seconds) and
 * SQL (instant) therefore open the same way, with no separate loading screen.
 */
export default function BootSequence({
  bossName,
  engineLabel,
  info,
  slowHint,
  onEngage,
}: BootSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2aRef = useRef<HTMLSpanElement>(null);
  const line2bRef = useRef<HTMLSpanElement>(null);
  const line3aRef = useRef<HTMLSpanElement>(null);
  const line3bRef = useRef<HTMLSpanElement>(null);
  const line4aRef = useRef<HTMLSpanElement>(null);
  const line4bRef = useRef<HTMLSpanElement>(null);
  const line5Ref = useRef<HTMLSpanElement>(null);

  const [introTyped, setIntroTyped] = useState(false);
  const [slow, setSlow] = useState(false);
  const [complete, setComplete] = useState(false);
  const skipRef = useRef<() => void>(() => undefined);
  // A phone has no Enter key: there the prompt says to touch the screen, and a tap anywhere engages.
  const touch =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const engageText = touch
    ? `[ TAP ]  touch anywhere to engage ${bossName}`
    : `[ ENTER ]  engage ${bossName}`;

  // Part one: what is known at once.
  // useGSAP (not a plain useEffect) so StrictMode's double-invoke and
  // unmount both properly kill the master timeline created inside
  // playBootSequence: a raw useEffect cleanup here only reset skipRef and
  // let two typing timelines run concurrently under StrictMode.
  useGSAP(
    () => {
      const container = containerRef.current;
      const cursor = cursorRef.current;
      const l1 = line1Ref.current;
      const l2a = line2aRef.current;
      if (!container || !cursor || !l1 || !l2a) return;
      const handle = playBootSequence({
        lines: [
          makeBootLine([{ text: "DCQ//BOOT  v0.1.0", el: l1 }]),
          makeBootLine([
            { text: `mounting engine ......... ${engineLabel.padEnd(18)}`, el: l2a },
          ]),
        ],
        cursorEl: cursor,
        containerEl: container,
        onComplete: () => {
          setIntroTyped(true);
        },
      });
      skipRef.current = handle.skip;
      return () => {
        skipRef.current = () => undefined;
      };
    },
    { scope: containerRef, dependencies: [engineLabel] },
  );

  // A gentle note if the engine is slow to load.
  useEffect(() => {
    if (info) return;
    const timer = setTimeout(() => {
      setSlow(true);
    }, SLOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [info]);

  // Part two: once the engine is ready and part one has typed, the rest.
  useGSAP(
    () => {
      if (!info || !introTyped) return;
      const container = containerRef.current;
      const cursor = cursorRef.current;
      const l2b = line2bRef.current;
      const l3a = line3aRef.current;
      const l3b = line3bRef.current;
      const l4a = line4aRef.current;
      const l4b = line4bRef.current;
      const l5 = line5Ref.current;
      if (!container || !cursor || !l2b || !l3a || !l3b || !l4a || !l4b || !l5) return;
      const countStr = String(info.afflictionCount).padStart(3, "0");
      const handle = playBootSequence({
        lines: [
          makeBootLine([{ text: "OK", el: l2b }]),
          makeBootLine([
            {
              text: `loading dataset ......... ${info.datasetFileName}  ${info.datasetShape}   `,
              el: l3a,
            },
            { text: "OK", el: l3b },
          ]),
          makeBootLine([
            { text: `scanning for affliction .. ${info.scanLabel}   `, el: l4a },
            { text: info.detectedText ?? `${countStr} CELLS  DETECTED`, el: l4b },
          ]),
          makeBootLine([{ text: engageText, el: l5 }]),
        ],
        cursorEl: cursor,
        containerEl: container,
        fade: false,
        onComplete: () => {
          setComplete(true);
        },
      });
      skipRef.current = handle.skip;
      return () => {
        skipRef.current = () => undefined;
      };
    },
    { scope: containerRef, dependencies: [info, introTyped, bossName, engageText] },
  );

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!complete) {
        skipRef.current();
        return;
      }
      if (event.key === "Enter") {
        playCue("clear");
        onEngage();
      }
    }
    function handleClick() {
      if (!complete) skipRef.current();
    }
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleClick);
    };
  }, [complete, onEngage]);

  const waiting = introTyped && !info;

  return (
    <div
      className={styles.boot}
      ref={containerRef}
      onClick={() => {
        if (!complete) return;
        playCue("clear");
        onEngage();
      }}
    >
      <div className={styles.line}>
        <span ref={line1Ref} className={styles.secondary} />
      </div>
      <div className={styles.line}>
        <span ref={line2aRef} className={styles.secondary} />
        {waiting ? (
          <span className={styles.pending} role="status">
            loading
          </span>
        ) : null}
        <span ref={line2bRef} className={styles.ok} />
      </div>
      {waiting && slow && slowHint ? <div className={styles.note}>{slowHint}</div> : null}
      <div className={styles.line}>
        <span ref={line3aRef} className={styles.secondary} />
        <span ref={line3bRef} className={styles.ok} />
      </div>
      <div className={styles.line}>
        <span ref={line4aRef} className={styles.secondary} />
        <span ref={line4bRef} className={styles.status} />
      </div>
      <div className={styles.spacer} />
      <button
        type="button"
        className={styles.enterButton}
        aria-label={`Engage ${bossName}`}
      >
        <span ref={line5Ref} className={styles.prompt} />
        <span ref={cursorRef} className={styles.cursor}>
          _
        </span>
      </button>
    </div>
  );
}
