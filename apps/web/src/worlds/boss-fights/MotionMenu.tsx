import { useEffect, useId, useRef, useState } from "react";
import type { A11yState } from "../../lib/a11y";
import styles from "./SoundMenu.module.css";

export interface MotionMenuProps {
  a11y: A11yState;
  onChange: (next: A11yState) => void;
}

/**
 * The ANIM button and its small menu, in the same style as the SFX one: two
 * switches, one for the rocket flight between worlds and one for the victory
 * scene when a boss is defeated. Each can be turned off on its own.
 */
export default function MotionMenu({ a11y, onChange }: MotionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const anyOn = a11y.travel || a11y.kill;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label="Animation settings"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        data-on={anyOn ? "true" : "false"}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        ANIM
      </button>
      {open ? (
        <div
          id={panelId}
          className={styles.panel}
          role="group"
          aria-label="Animation settings"
        >
          <label className={styles.row}>
            <input
              type="checkbox"
              checked={a11y.travel}
              onChange={(event) => {
                onChange({ ...a11y, travel: event.target.checked });
              }}
            />
            <span>
              Rocket flight
              <span className={styles.note}>the trip to a world when you pick one</span>
            </span>
          </label>
          <label className={styles.row}>
            <input
              type="checkbox"
              checked={a11y.kill}
              onChange={(event) => {
                onChange({ ...a11y, kill: event.target.checked });
              }}
            />
            <span>
              Killing animation
              <span className={styles.note}>the knife cut when a boss is defeated</span>
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
