import { useEffect, useId, useRef, useState } from "react";
import type { A11yState } from "../../lib/a11y";
import styles from "./SoundMenu.module.css";

export interface SoundMenuProps {
  a11y: A11yState;
  onChange: (next: A11yState) => void;
}

/**
 * The SFX button and its small menu: effect tones, typing sounds and the master
 * volume are separate, so someone who likes the keyboard sound but not the
 * chimes (or the other way round) can have exactly that.
 */
export default function SoundMenu({ a11y, onChange }: SoundMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const anyOn = a11y.sound || a11y.typing;

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
        aria-label="Sound settings"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        data-on={anyOn ? "true" : "false"}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        SFX
      </button>
      {open ? (
        <div
          id={panelId}
          className={styles.panel}
          role="group"
          aria-label="Sound settings"
        >
          <label className={styles.row}>
            <input
              type="checkbox"
              checked={a11y.sound}
              onChange={(event) => {
                onChange({ ...a11y, sound: event.target.checked });
              }}
            />
            <span>
              Effects
              <span className={styles.note}>run, error, win, the finishing cut</span>
            </span>
          </label>
          <label className={styles.row}>
            <input
              type="checkbox"
              checked={a11y.typing}
              onChange={(event) => {
                onChange({ ...a11y, typing: event.target.checked });
              }}
            />
            <span>
              Typing
              <span className={styles.note}>keyboard sound in the editor and intro</span>
            </span>
          </label>
          <label className={styles.volume}>
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(a11y.volume * 100)}
              aria-valuetext={`${String(Math.round(a11y.volume * 100))} percent`}
              onChange={(event) => {
                onChange({ ...a11y, volume: Number(event.target.value) / 100 });
              }}
            />
            <output>{Math.round(a11y.volume * 100)}%</output>
          </label>
        </div>
      ) : null}
    </div>
  );
}
