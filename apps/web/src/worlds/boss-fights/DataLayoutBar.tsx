import type { CollageMode } from "./collageOrder";
import styles from "./DataLayoutBar.module.css";

export type DataLayout = "collage" | "tabs";

export interface DataLayoutBarProps {
  layout: DataLayout;
  tableCount: number;
  onChange: (next: DataLayout) => void;
  /** Four tables only: which lines can be dragged (each row's, or each column's). */
  mode?: CollageMode;
  onModeChange?: ((next: CollageMode) => void) | undefined;
}

/**
 * The choice shown above a case's tables: all of them at once as a collage, or one at
 * a time on tabs. With four tables in a collage there is a second choice, because four
 * tables filling a rectangle can only be resized one way at a time: give each row its
 * own vertical line, or give each column its own horizontal line.
 */
export default function DataLayoutBar({
  layout,
  tableCount,
  onChange,
  mode = "rows",
  onModeChange,
}: DataLayoutBarProps) {
  const shape =
    tableCount === 2
      ? "stacked, one above the other"
      : tableCount === 3
        ? "two on top, one below"
        : "in four squares";
  const showMode = tableCount === 4 && layout === "collage" && onModeChange !== undefined;
  return (
    <div className={styles.bar} role="group" aria-label="How to show the tables">
      <span className={styles.label}>
        {String(tableCount)} tables
        <span className={styles.hint}>
          {layout === "collage"
            ? `${shape}. Drag a grip to swap places, a line to resize.`
            : "one at a time"}
        </span>
      </span>
      <span className={styles.options}>
        <button
          type="button"
          className={styles.option}
          aria-pressed={layout === "collage"}
          onClick={() => {
            onChange("collage");
          }}
        >
          Collage
        </button>
        <button
          type="button"
          className={styles.option}
          aria-pressed={layout === "tabs"}
          onClick={() => {
            onChange("tabs");
          }}
        >
          One at a time
        </button>
      </span>
      {showMode ? (
        <div
          className={styles.modeRow}
          role="group"
          aria-label="Which lines you can drag"
        >
          <span className={styles.hint}>
            {mode === "rows"
              ? "Each row has its own vertical line (its two tables share one height)."
              : "Each column has its own horizontal line (its two tables share one width)."}
          </span>
          <span className={styles.options}>
            <button
              type="button"
              className={styles.option}
              aria-pressed={mode === "rows"}
              onClick={() => {
                onModeChange("rows");
              }}
            >
              Resize by row
            </button>
            <button
              type="button"
              className={styles.option}
              aria-pressed={mode === "columns"}
              onClick={() => {
                onModeChange("columns");
              }}
            >
              Resize by column
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
