import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { makeBootLine, playBootSequence } from "../../anim/world1/bootType";
import { playCue } from "../../lib/sound";
import styles from "./BootSequence.module.css";

export interface BootSequenceProps {
  bossName: string;
  datasetFileName: string;
  datasetShape: string;
  afflictionCount: number;
  /** e.g. "NUL" or "NUL+DUP" for a stacked case — the actual predicate kinds being scanned for, never hardcoded (design spec §4.2's escalation principle: the state itself is the signal). */
  scanLabel: string;
  /** Overrides the "N CELLS DETECTED" readout for cases that are not about afflicted cells. */
  detectedText?: string | undefined;
  /** "pyodide/wasm" or "sql.js/wasm" — reflects the engine the player actually picked on the previous screen, not a fixed assumption. */
  engineLabel: string;
  onEngage: () => void;
}

export default function BootSequence({
  bossName,
  datasetFileName,
  datasetShape,
  afflictionCount,
  scanLabel,
  detectedText,
  engineLabel,
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

  const [complete, setComplete] = useState(false);
  const skipRef = useRef<() => void>(() => undefined);

  // useGSAP (not a plain useEffect) so StrictMode's double-invoke and
  // unmount both properly kill the master timeline created inside
  // playBootSequence — a raw useEffect cleanup here only reset skipRef and
  // let two typing timelines run concurrently under StrictMode.
  useGSAP(
    () => {
      const container = containerRef.current;
      const cursor = cursorRef.current;
      const l1 = line1Ref.current;
      const l2a = line2aRef.current;
      const l2b = line2bRef.current;
      const l3a = line3aRef.current;
      const l3b = line3bRef.current;
      const l4a = line4aRef.current;
      const l4b = line4bRef.current;
      const l5 = line5Ref.current;
      if (
        !container ||
        !cursor ||
        !l1 ||
        !l2a ||
        !l2b ||
        !l3a ||
        !l3b ||
        !l4a ||
        !l4b ||
        !l5
      ) {
        return;
      }

      const countStr = String(afflictionCount).padStart(3, "0");

      const lines = [
        makeBootLine([{ text: "DCQ//BOOT  v0.1.0", el: l1 }]),
        makeBootLine([
          { text: `mounting engine ......... ${engineLabel.padEnd(18)}`, el: l2a },
          { text: "OK", el: l2b },
        ]),
        makeBootLine([
          {
            text: `loading dataset ......... ${datasetFileName}  ${datasetShape}   `,
            el: l3a,
          },
          { text: "OK", el: l3b },
        ]),
        makeBootLine([
          { text: `scanning for affliction .. ${scanLabel}   `, el: l4a },
          { text: detectedText ?? `${countStr} CELLS  DETECTED`, el: l4b },
        ]),
        makeBootLine([{ text: `[ ENTER ]  engage ${bossName}`, el: l5 }]),
      ];

      const handle = playBootSequence({
        lines,
        cursorEl: cursor,
        containerEl: container,
        onComplete: () => {
          setComplete(true);
        },
      });
      skipRef.current = handle.skip;

      return () => {
        skipRef.current = () => undefined;
      };
    },
    {
      scope: containerRef,
      dependencies: [
        afflictionCount,
        bossName,
        datasetFileName,
        datasetShape,
        scanLabel,
        detectedText,
        engineLabel,
      ],
    },
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

  return (
    <div className={styles.boot} ref={containerRef}>
      <div className={styles.line}>
        <span ref={line1Ref} className={styles.secondary} />
      </div>
      <div className={styles.line}>
        <span ref={line2aRef} className={styles.secondary} />
        <span ref={line2bRef} className={styles.ok} />
      </div>
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
        onClick={() => {
          if (complete) onEngage();
        }}
      >
        <span ref={line5Ref} className={styles.prompt} />
        <span ref={cursorRef} className={styles.cursor}>
          _
        </span>
      </button>
    </div>
  );
}
