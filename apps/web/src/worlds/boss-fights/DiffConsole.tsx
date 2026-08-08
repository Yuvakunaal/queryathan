import { useEffect, useRef } from "react";
import styles from "./DiffConsole.module.css";

export interface ConsoleDiffLine {
  rowIndex: number;
  column: string;
  before: string;
  after: string;
}

export type ConsoleEntry =
  | { kind: "diff"; id: string; lines: ConsoleDiffLine[] }
  | { kind: "error"; id: string; message: string }
  | { kind: "info"; id: string; text: string };

export interface DiffConsoleProps {
  entries: ConsoleEntry[];
}

/** Per-line diff log is aria-live="off" — a separate debounced summary
 * region (owned by BossFightScreen) is what screen readers actually hear. */
export default function DiffConsole({ entries }: DiffConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className={styles.console} ref={scrollRef} aria-live="off" tabIndex={0}>
      {entries.map((entry) => {
        if (entry.kind === "diff") {
          return (
            <div key={entry.id}>
              {entry.lines.map((line, i) => (
                <div key={i}>
                  <div className={styles.del}>
                    - [{line.rowIndex}] {line.column}{" "}
                    <span className={styles.strike}>{line.before}</span>
                  </div>
                  <div className={styles.add}>
                    + [{line.rowIndex}] {line.column} {line.after}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        if (entry.kind === "error") {
          const lines = entry.message.split("\n");
          return (
            <div key={entry.id} className={styles.errorBlock}>
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("Traceback") ? styles.tracebackHeader : styles.del
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div key={entry.id} className={styles.info}>
            {entry.text}
          </div>
        );
      })}
    </div>
  );
}
