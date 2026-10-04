import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { shortcutGroups } from "../../lib/shortcuts";
import styles from "./ShortcutsDialog.module.css";

export interface ShortcutsDialogProps {
  onClose: () => void;
}

const FOCUSABLE = 'button, [href], input, [tabindex]:not([tabindex="-1"])';

/** The "?" sheet: every keyboard shortcut in the app, grouped by what you are doing. */
export default function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
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
        aria-labelledby="shortcuts-title"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 id="shortcuts-title" className={styles.title}>
            Keyboard shortcuts
          </h2>
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
        <div className={styles.body} tabIndex={0} aria-label="Shortcuts, grouped by task">
          {shortcutGroups().map((group) => (
            <section key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={item.what} className={styles.row}>
                    <span className={styles.keys}>
                      {item.keys.map((combo, i) => (
                        <span key={combo.join("+")} className={styles.combo}>
                          {i > 0 ? <span className={styles.or}>or</span> : null}
                          {combo.map((key, j) => (
                            <span key={key + String(j)}>
                              {j > 0 ? <span className={styles.plus}>+</span> : null}
                              <kbd className={styles.kbd}>{key}</kbd>
                            </span>
                          ))}
                        </span>
                      ))}
                    </span>
                    <span className={styles.what}>{item.what}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
