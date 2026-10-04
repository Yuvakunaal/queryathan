import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { SQL_REFERENCE } from "../../lib/sqlReference";
import { PANDAS_REFERENCE } from "../../lib/pandasReference";
import type { Inserter } from "../../TipsContext";
import HelpBody from "./HelpBody";
import styles from "./TipsDialog.module.css";

export interface TipsDialogProps {
  onClose: () => void;
  /** The open fight's editor, if there is one: entries for its language then insert themselves. */
  inserter: Inserter | null;
}

type Language = "sql" | "python";
const FOCUSABLE = 'button, [href], input, [tabindex]:not([tabindex="-1"])';

/**
 * Tips: the SQL and Python references in one place, opened from the book button in the
 * top bar. Search or browse by topic. Inside a fight, clicking an entry for the language
 * you are writing puts it in the editor; elsewhere it is a reading list.
 */
export default function TipsDialog({ onClose, inserter }: TipsDialogProps) {
  const [language, setLanguage] = useState<Language>(inserter?.language ?? "sql");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<Element | null>(document.activeElement);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = returnTo.current;
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  const canInsert = inserter?.language === language;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tips-title"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 id="tips-title" className={styles.title}>
            Tips
          </h2>
          <div className={styles.langs} role="group" aria-label="Language">
            {(["sql", "python"] as const).map((l) => (
              <button
                key={l}
                type="button"
                className={styles.lang}
                aria-pressed={language === l}
                onClick={() => {
                  setLanguage(l);
                }}
              >
                {l === "sql" ? "SQL" : "Python"}
              </button>
            ))}
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <p className={styles.note}>
          {canInsert
            ? "Click an entry to put it in your editor."
            : inserter
              ? `You are writing ${inserter.language === "sql" ? "SQL" : "Python"}; switch to it to insert entries.`
              : "Open a fight and click an entry to put it in your editor."}
        </p>
        <div className={styles.body}>
          <HelpBody
            key={language}
            label={language === "sql" ? "SQL tips" : "Python tips"}
            groups={language === "sql" ? SQL_REFERENCE : PANDAS_REFERENCE}
            searchHint={
              language === "sql"
                ? "Search: date, null, join, rank..."
                : "Search: missing, group, merge, rolling..."
            }
            onPick={
              canInsert
                ? (item) => {
                    inserter.insert(item.insert);
                    onClose();
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
