import { useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { classNames } from "../../lib/classNames";
import { orderPanes, swapOrder } from "./collageOrder";
import styles from "./TableCollage.module.css";

export interface CollagePane {
  id: string;
  title: string;
  /** Small text after the title, e.g. "your table" or "original". */
  note?: string;
  content: ReactNode;
}

export interface TableCollageProps {
  panes: CollagePane[];
  /** Pane ids in display order. Ids that are missing are placed last. */
  order: string[];
  onOrderChange: (next: string[]) => void;
}

interface DragState {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  active: boolean;
  over: string | null;
}

const DRAG_THRESHOLD_PX = 5;

/**
 * The tables of a case side by side as a collage: two tables stack one above
 * the other, three put two on top and one underneath, four make a 2 by 2. Drag
 * a pane by its grip to swap places with another (or focus the grip and use the
 * arrow keys), so the table you are looking at most can have the room.
 */
export default function TableCollage({ panes, order, onOrderChange }: TableCollageProps) {
  const shown = orderPanes(panes, order);
  const ids = shown.map((p) => p.id);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const count = Math.min(shown.length, 4);

  function paneUnder(x: number, y: number): string | null {
    for (const el of document.elementsFromPoint(x, y)) {
      const id = el instanceof HTMLElement ? el.dataset.collagePane : undefined;
      if (id) return id;
    }
    return null;
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, id: string): void {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      id,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      over: null,
    });
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>): void {
    if (!drag) return;
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const active = drag.active || moved > DRAG_THRESHOLD_PX;
    const over = active ? paneUnder(event.clientX, event.clientY) : null;
    setDrag({
      ...drag,
      x: event.clientX,
      y: event.clientY,
      active,
      over: over === drag.id ? null : over,
    });
  }

  function onPointerUp(): void {
    if (drag?.active && drag.over) {
      const next = swapOrder(ids, drag.id, drag.over);
      onOrderChange(next);
      const title = shown.find((p) => p.id === drag.id)?.title ?? "";
      setAnnouncement(`${title} moved to position ${String(next.indexOf(drag.id) + 1)}.`);
    }
    setDrag(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string): void {
    const earlier = event.key === "ArrowLeft" || event.key === "ArrowUp";
    const later = event.key === "ArrowRight" || event.key === "ArrowDown";
    if (!earlier && !later) return;
    event.preventDefault();
    const i = ids.indexOf(id);
    const j = earlier ? i - 1 : i + 1;
    const other = ids[j];
    if (other === undefined) return;
    onOrderChange(swapOrder(ids, id, other));
    const title = shown[i]?.title ?? "";
    setAnnouncement(
      `${title} moved to position ${String(j + 1)} of ${String(ids.length)}.`,
    );
  }

  const dragging = drag?.active ? shown.find((p) => p.id === drag.id) : undefined;

  return (
    <div
      className={styles.collage}
      data-count={count}
      data-dragging={dragging ? "true" : "false"}
    >
      {shown.map((pane, index) => (
        <section
          key={pane.id}
          className={classNames(
            styles.pane,
            dragging?.id === pane.id && styles.paneDragged,
            drag?.over === pane.id && styles.paneTarget,
          )}
          data-collage-pane={pane.id}
          data-slot={index}
          aria-label={pane.title}
        >
          <header className={styles.header}>
            <button
              type="button"
              className={styles.grip}
              aria-label={`Move ${pane.title}. Drag it onto another table, or use the arrow keys.`}
              title="Drag to swap places with another table"
              onPointerDown={(event) => {
                onPointerDown(event, pane.id);
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                setDrag(null);
              }}
              onKeyDown={(event) => {
                onKeyDown(event, pane.id);
              }}
            >
              <span aria-hidden="true" className={styles.dots}>
                ⠿
              </span>
            </button>
            <span className={styles.title}>{pane.title}</span>
            {pane.note ? <span className={styles.note}>{pane.note}</span> : null}
          </header>
          <div className={styles.body}>{pane.content}</div>
        </section>
      ))}
      {dragging && drag ? (
        <div className={styles.ghost} style={{ left: drag.x + 12, top: drag.y + 12 }}>
          {dragging.title}
        </div>
      ) : null}
      <span className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
