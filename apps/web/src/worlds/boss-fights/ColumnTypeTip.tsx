import { useEffect, useId, useRef, useState } from "react";
import styles from "./ColumnTypeTip.module.css";

interface Shown {
  name: string;
  title: string;
  lines: string[];
  left: number;
  top: number;
  above: boolean;
}

const SHOW_DELAY_MS = 120;
const TIP_WIDTH = 320;

/**
 * One tooltip for the whole screen. Anything carrying data-tip-title (a column
 * name in the table header, a column chip above the editor) shows its MySQL type
 * and what it was worked out from, on mouse hover or keyboard focus. It is a real
 * tooltip (role=tooltip, tied to its target with aria-describedby), is dismissed
 * with Escape, and never appears for touch, where hover does not exist.
 */
export default function ColumnTypeTip() {
  const [shown, setShown] = useState<Shown | null>(null);
  const id = useId();
  const targetRef = useRef<Element | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function hide(): void {
      clearTimeout(timerRef.current);
      targetRef.current?.removeAttribute("aria-describedby");
      targetRef.current = null;
      setShown(null);
    }

    function show(target: Element): void {
      if (!(target instanceof HTMLElement) || !target.dataset.tipTitle) return;
      const rect = target.getBoundingClientRect();
      const roomBelow = window.innerHeight - rect.bottom;
      const above = roomBelow < 190 && rect.top > roomBelow;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - TIP_WIDTH - 8));
      targetRef.current?.removeAttribute("aria-describedby");
      targetRef.current = target;
      target.setAttribute("aria-describedby", id);
      setShown({
        name: target.dataset.tipName ?? "",
        title: target.dataset.tipTitle,
        lines: (target.dataset.tipDetail ?? "").split("\n").filter(Boolean),
        left,
        top: above ? rect.top - 8 : rect.bottom + 8,
        above,
      });
    }

    const tipTarget = (event: Event): Element | null =>
      event.target instanceof Element ? event.target.closest("[data-tip-title]") : null;

    function onOver(event: PointerEvent): void {
      if (event.pointerType === "touch") return;
      const target = tipTarget(event);
      if (!target || target === targetRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        show(target);
      }, SHOW_DELAY_MS);
    }
    function onOut(event: PointerEvent): void {
      const target = tipTarget(event);
      if (!target) return;
      const next =
        event.relatedTarget instanceof Element
          ? event.relatedTarget.closest("[data-tip-title]")
          : null;
      if (next === target) return;
      hide();
    }
    function onFocusIn(event: FocusEvent): void {
      const target = tipTarget(event);
      if (target) show(target);
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") hide();
    }

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", hide, true);
    document.addEventListener("pointerdown", hide);
    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", hide, true);
      document.removeEventListener("pointerdown", hide);
    };
  }, [id]);

  if (!shown) return null;
  return (
    <div
      id={id}
      role="tooltip"
      className={styles.tip}
      style={{
        left: shown.left,
        top: shown.top,
        width: TIP_WIDTH,
        transform: shown.above ? "translateY(-100%)" : undefined,
      }}
    >
      <div className={styles.head}>
        <span className={styles.column}>{shown.name}</span>
        <span className={styles.type}>{shown.title}</span>
      </div>
      <p className={styles.label}>MySQL type</p>
      {shown.lines.map((line) => (
        <p key={line} className={styles.line}>
          {line}
        </p>
      ))}
    </div>
  );
}
