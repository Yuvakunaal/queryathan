import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TEXT_SCALES } from "../../lib/a11y";
import type { A11yState } from "../../lib/a11y";
import { useTips } from "../../TipsContext";
import styles from "./MobileMenu.module.css";

export interface MobileMenuProps {
  a11y: A11yState;
  onChange: (next: A11yState) => void;
}

interface SwitchProps {
  label: string;
  note?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Switch({ label, note, checked, onChange }: SwitchProps) {
  return (
    <label className={styles.row}>
      <span className={styles.rowText}>
        {label}
        {note ? <span className={styles.note}>{note}</span> : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
    </label>
  );
}

/**
 * On a phone the row of small buttons in the top bar does not fit, and its pop-up menus
 * run off the screen. So below 720px the whole row becomes one menu button, and every
 * option (text size, theme, contrast, effects, sound, animations, Tips) lives in a
 * drawer that slides in from the right, with large touch-friendly rows.
 */
export default function MobileMenu({ a11y, onChange }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [world, setWorld] = useState("boss-fights");
  const tips = useTips();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  function openMenu(): void {
    setWorld(
      triggerRef.current?.closest("[data-world]")?.getAttribute("data-world") ??
        "boss-fights",
    );
    setOpen(true);
  }

  // Focus goes into the drawer when it opens and back to the menu button when it closes.
  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Escape closes, Tab stays inside the drawer, and a wider screen closes it.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          "button, input, [href], [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const wide = window.matchMedia("(min-width: 721px)");
    function onWide(): void {
      if (wide.matches) setOpen(false);
    }
    document.addEventListener("keydown", onKey, true);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const set = (patch: Partial<A11yState>): void => {
    onChange({ ...a11y, ...patch });
  };
  const percent = Math.round((TEXT_SCALES[a11y.textScaleIndex] ?? 1) * 100);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openMenu}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {open
        ? createPortal(
            <div data-world={world} style={{ display: "contents" }}>
              <div
                className={styles.backdrop}
                onClick={() => {
                  setOpen(false);
                }}
              />
              <aside
                ref={drawerRef}
                className={styles.drawer}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
              >
                <div className={styles.header}>
                  <h2 className={styles.title}>Menu</h2>
                  <button
                    ref={closeRef}
                    type="button"
                    className={styles.close}
                    aria-label="Close menu"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    Close
                  </button>
                </div>

                <section aria-labelledby="mm-text">
                  <h3 id="mm-text" className={styles.section}>
                    Text size
                  </h3>
                  <div className={styles.sizes}>
                    <button
                      type="button"
                      className={styles.size}
                      aria-label="Decrease text size"
                      disabled={a11y.textScaleIndex === 0}
                      onClick={() => {
                        set({ textScaleIndex: Math.max(0, a11y.textScaleIndex - 1) });
                      }}
                    >
                      A-
                    </button>
                    <span className={styles.sizeValue} aria-live="polite">
                      {percent}%
                    </span>
                    <button
                      type="button"
                      className={styles.size}
                      aria-label="Increase text size"
                      disabled={a11y.textScaleIndex === TEXT_SCALES.length - 1}
                      onClick={() => {
                        set({
                          textScaleIndex: Math.min(
                            TEXT_SCALES.length - 1,
                            a11y.textScaleIndex + 1,
                          ),
                        });
                      }}
                    >
                      A+
                    </button>
                    <button
                      type="button"
                      className={styles.reset}
                      aria-label="Reset text size"
                      onClick={() => {
                        set({ textScaleIndex: 1 });
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </section>

                <section aria-labelledby="mm-look">
                  <h3 id="mm-look" className={styles.section}>
                    Look
                  </h3>
                  <Switch
                    label="Light theme"
                    checked={a11y.theme === "light"}
                    onChange={(on) => {
                      set({ theme: on ? "light" : "dark" });
                    }}
                  />
                  <Switch
                    label="High contrast"
                    note="Stronger text and borders"
                    checked={a11y.highContrast}
                    onChange={(on) => {
                      set({ highContrast: on });
                    }}
                  />
                  <Switch
                    label="CRT screen effect"
                    note="Scanlines on dark themes"
                    checked={!a11y.crtReduced}
                    onChange={(on) => {
                      set({ crtReduced: !on });
                    }}
                  />
                </section>

                <section aria-labelledby="mm-sound">
                  <h3 id="mm-sound" className={styles.section}>
                    Sound
                  </h3>
                  <Switch
                    label="Effects"
                    note="Run, error, win, the finishing cut"
                    checked={a11y.sound}
                    onChange={(on) => {
                      set({ sound: on });
                    }}
                  />
                  <Switch
                    label="Typing"
                    note="Keyboard sound in the editor and intro"
                    checked={a11y.typing}
                    onChange={(on) => {
                      set({ typing: on });
                    }}
                  />
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
                        set({ volume: Number(event.target.value) / 100 });
                      }}
                    />
                    <output>{Math.round(a11y.volume * 100)}%</output>
                  </label>
                </section>

                <section aria-labelledby="mm-anim">
                  <h3 id="mm-anim" className={styles.section}>
                    Animation
                  </h3>
                  <Switch
                    label="Rocket flight"
                    note="The trip to a world when you pick one"
                    checked={a11y.travel}
                    onChange={(on) => {
                      set({ travel: on });
                    }}
                  />
                  <Switch
                    label="Killing animation"
                    note="The knife cut when a boss is defeated"
                    checked={a11y.kill}
                    onChange={(on) => {
                      set({ kill: on });
                    }}
                  />
                </section>

                <section aria-labelledby="mm-help">
                  <h3 id="mm-help" className={styles.section}>
                    Help
                  </h3>
                  <button
                    type="button"
                    className={styles.tips}
                    onClick={() => {
                      setOpen(false);
                      tips.open();
                    }}
                  >
                    SQL and Python tips
                  </button>
                </section>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
