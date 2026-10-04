import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { classNames } from "../../lib/classNames";
import {
  clampSplit,
  collageRows,
  collageRowTracks,
  columnShare,
  DEFAULT_SPLIT,
  GUTTER_PX,
  orderPanes,
  PADDING_PX,
  swapOrder,
} from "./collageOrder";
import type { Split } from "./collageOrder";
import { readStored, writeStored } from "../../lib/safeStorage";
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
  /** Where the sizes of this collage are remembered on this device (one per case). */
  splitKey: string;
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

const splitStorageKey = (key: string): string => `dcq.collage.${key}.split`;

function readSplit(key: string): Split {
  try {
    const parsed: unknown = JSON.parse(readStored(splitStorageKey(key)) ?? "null");
    if (parsed && typeof parsed === "object") {
      const { col, col2, row } = parsed as Record<string, unknown>;
      return {
        col: typeof col === "number" ? clampSplit(col) : DEFAULT_SPLIT.col,
        col2: typeof col2 === "number" ? clampSplit(col2) : DEFAULT_SPLIT.col2,
        row: typeof row === "number" ? clampSplit(row) : DEFAULT_SPLIT.row,
      };
    }
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_SPLIT;
}

interface SplitHandleProps {
  orientation: "vertical" | "horizontal";
  value: number;
  /** The collage, to measure how far a drag is as a share of its size. */
  container: React.RefObject<HTMLDivElement | null>;
  onChange: (next: number) => void;
  onCommit: (next: number) => void;
  label: string;
  style: React.CSSProperties;
}

const KEY_STEP = 0.03;

/**
 * The line between tables. Drag it (mouse, touch or pen) to give one table more
 * room and the other less; arrow keys nudge it, Home and End go to the limits,
 * double-click or Enter put it back in the middle.
 */
function SplitHandle({
  orientation,
  value,
  container,
  onChange,
  onCommit,
  label,
  style,
}: SplitHandleProps) {
  const [dragging, setDragging] = useState(false);
  const lastRef = useRef(value);
  const vertical = orientation === "vertical";

  function ratioAt(event: PointerEvent<HTMLDivElement>): number {
    const rect = container.current?.getBoundingClientRect();
    if (!rect) return value;
    const along = vertical ? event.clientX - rect.left : event.clientY - rect.top;
    const size = (vertical ? rect.width : rect.height) - 2 * PADDING_PX - GUTTER_PX;
    return clampSplit((along - PADDING_PX - GUTTER_PX / 2) / Math.max(1, size));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    lastRef.current = ratioAt(event);
    onChange(lastRef.current);
  }

  function end(event: PointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    onCommit(lastRef.current);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const more = vertical ? "ArrowRight" : "ArrowDown";
    const less = vertical ? "ArrowLeft" : "ArrowUp";
    let next: number | null = null;
    if (event.key === more) next = value + (event.shiftKey ? KEY_STEP * 3 : KEY_STEP);
    else if (event.key === less)
      next = value - (event.shiftKey ? KEY_STEP * 3 : KEY_STEP);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else if (event.key === "Enter") next = DEFAULT_SPLIT.col;
    if (next === null) return;
    event.preventDefault();
    const clamped = clampSplit(next);
    onChange(clamped);
    onCommit(clamped);
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      title="Drag to resize. Double-click to centre."
      className={classNames(
        styles.split,
        vertical ? styles.splitV : styles.splitH,
        dragging && styles.splitActive,
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => {
        onChange(DEFAULT_SPLIT.col);
        onCommit(DEFAULT_SPLIT.col);
      }}
      onKeyDown={onKeyDown}
    >
      <span className={styles.splitGrip} aria-hidden="true" />
    </div>
  );
}

/**
 * The tables of a case side by side as a collage: two tables stack one above
 * the other, three put two on top and one underneath, four make a 2 by 2. Drag
 * a pane by its grip to swap places with another (or focus the grip and use the
 * arrow keys), so the table you are looking at most can have the room.
 */
export default function TableCollage({
  panes,
  order,
  onOrderChange,
  splitKey,
}: TableCollageProps) {
  const shown = orderPanes(panes, order);
  const ids = shown.map((p) => p.id);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [split, setSplit] = useState<Split>(() => readSplit(splitKey));
  const collageRef = useRef<HTMLDivElement>(null);
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

  function commitSplit(next: Split): void {
    setSplit(next);
    writeStored(splitStorageKey(splitKey), JSON.stringify(next));
  }

  const renderPane = (pane: CollagePane, index: number, style: React.CSSProperties) => (
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
      style={style}
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
  );

  const layout = collageRows(count);

  return (
    <div
      ref={collageRef}
      className={styles.collage}
      data-count={count}
      data-dragging={dragging ? "true" : "false"}
      style={{
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: collageRowTracks(count, split),
        padding: PADDING_PX,
      }}
    >
      {layout.map((indices, rowIndex) => {
        const gridRow = count === 1 ? "1" : rowIndex === 0 ? "1" : "3";
        const members = indices.map((i) => shown[i]).filter((p): p is CollagePane => !!p);
        if (members.length < 2) {
          const only = members[0];
          const at = indices[0] ?? 0;
          return only ? renderPane(only, at, { gridRow, gridColumn: "1" }) : null;
        }
        const colKey = rowIndex === 0 ? "col" : "col2";
        const [first, second] = members;
        if (!first || !second) return null;
        return (
          <div
            key={`row-${String(rowIndex)}`}
            className={styles.rowWrap}
            style={{
              gridRow,
              gridColumn: "1",
              gridTemplateColumns: columnShare(split[colKey]),
            }}
          >
            {renderPane(first, indices[0] ?? 0, { gridColumn: "1" })}
            <SplitHandle
              orientation="vertical"
              value={split[colKey]}
              container={collageRef}
              label={
                count === 3
                  ? "Width of the upper tables"
                  : rowIndex === 0
                    ? "Width of the upper tables"
                    : "Width of the lower tables"
              }
              style={{ gridColumn: "2" }}
              onChange={(value) => {
                setSplit((s) => ({ ...s, [colKey]: value }));
              }}
              onCommit={(value) => {
                commitSplit({ ...split, [colKey]: value });
              }}
            />
            {renderPane(second, indices[1] ?? 1, { gridColumn: "3" })}
          </div>
        );
      })}
      {count >= 2 ? (
        <SplitHandle
          orientation="horizontal"
          value={split.row}
          container={collageRef}
          label={count === 2 ? "Height of the top table" : "Height of the upper tables"}
          style={{ gridColumn: "1", gridRow: "2" }}
          onChange={(row) => {
            setSplit((s) => ({ ...s, row }));
          }}
          onCommit={(row) => {
            commitSplit({ ...split, row });
          }}
        />
      ) : null}
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
