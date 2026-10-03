import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { classNames } from "../../lib/classNames";
import styles from "./ResizeHandle.module.css";

export interface ResizeHandleProps {
  /** "vertical" is a vertical bar you drag left and right; "horizontal" is a horizontal bar you drag up and down. */
  orientation: "vertical" | "horizontal";
  /** Reads the current size in px when a drag or key press starts (the size may be CSS-driven, so it is measured, not stored). */
  getSize: () => number;
  min: () => number;
  max: () => number;
  /** Called continuously with the new size in px. */
  onResize: (px: number) => void;
  /** Called once when a drag ends or a key press finishes, with the final size. */
  onCommit: (px: number) => void;
  /** Double-click or Enter: back to the default size. */
  onReset: () => void;
  label: string;
  className?: string | undefined;
}

const KEY_STEP = 24;
const KEY_STEP_LARGE = 96;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * A draggable divider between two panels. Works with mouse, touch and pen via
 * pointer capture, and from the keyboard (arrow keys, Home/End, Enter to
 * reset) so it is not a mouse-only control.
 */
export default function ResizeHandle({
  orientation,
  getSize,
  min,
  max,
  onResize,
  onCommit,
  onReset,
  label,
  className,
}: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ pointer: 0, size: 0 });
  const lastRef = useRef(0);
  const [announcedSize, setAnnouncedSize] = useState(0);

  function axisPosition(event: PointerEvent): number {
    return orientation === "vertical" ? event.clientX : event.clientY;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { pointer: axisPosition(event), size: getSize() };
    lastRef.current = startRef.current.size;
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    const next = clamp(
      startRef.current.size + axisPosition(event) - startRef.current.pointer,
      min(),
      max(),
    );
    lastRef.current = next;
    onResize(next);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setAnnouncedSize(Math.round(lastRef.current));
    onCommit(lastRef.current);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const grow = orientation === "vertical" ? "ArrowRight" : "ArrowDown";
    const shrink = orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
    const current = getSize();
    let next: number | null = null;
    if (event.key === grow) next = current + step;
    else if (event.key === shrink) next = current - step;
    else if (event.key === "Home") next = min();
    else if (event.key === "End") next = max();
    else if (event.key === "Enter") {
      event.preventDefault();
      onReset();
      return;
    }
    if (next === null) return;
    event.preventDefault();
    const clamped = clamp(next, min(), max());
    onResize(clamped);
    onCommit(clamped);
    setAnnouncedSize(Math.round(clamped));
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-label={label}
      aria-valuemin={Math.round(min())}
      aria-valuemax={Math.round(max())}
      aria-valuenow={announcedSize || Math.round(getSize())}
      title="Drag to resize. Double-click to reset."
      className={classNames(
        styles.handle,
        orientation === "vertical" ? styles.vertical : styles.horizontal,
        dragging && styles.dragging,
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.grip} aria-hidden="true" />
    </div>
  );
}
