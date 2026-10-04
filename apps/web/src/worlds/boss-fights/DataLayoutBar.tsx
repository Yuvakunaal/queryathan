import styles from "./DataLayoutBar.module.css";

export type DataLayout = "collage" | "tabs";

export interface DataLayoutBarProps {
  layout: DataLayout;
  tableCount: number;
  onChange: (next: DataLayout) => void;
}

/** The choice shown above a case's tables: all of them at once as a collage, or one at a time on tabs. */
export default function DataLayoutBar({
  layout,
  tableCount,
  onChange,
}: DataLayoutBarProps) {
  const shape =
    tableCount === 2
      ? "stacked, one above the other"
      : tableCount === 3
        ? "two on top, one below"
        : "in four squares";
  return (
    <div className={styles.bar} role="group" aria-label="How to show the tables">
      <span className={styles.label}>
        {String(tableCount)} tables
        <span className={styles.hint}>
          {layout === "collage"
            ? `${shape}. Drag a grip to swap places.`
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
    </div>
  );
}
