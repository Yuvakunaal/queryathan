import type { ResultGrid } from "@dcq/engine-adapters";
import { gridToCsv } from "../../lib/sandbox";
import styles from "./SandboxBand.module.css";

export interface SandboxBandProps {
  grid: ResultGrid;
  fileName: string;
}

function downloadCsv(grid: ResultGrid, fileName: string): void {
  const blob = new Blob([gridToCsv(grid)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.replace(/\.csv$/i, "") + "-cleaned.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

/** A live profile of the table: size, then each column's type and how many cells are empty. */
export default function SandboxBand({ grid, fileName }: SandboxBandProps) {
  const profile = grid.columns.map((column) => {
    let empty = 0;
    for (const row of grid.rows)
      if (row[column] === null || row[column] === undefined) empty += 1;
    return { column, dtype: grid.dtypes[column] ?? "", empty };
  });
  return (
    <div className={styles.band}>
      <div className={styles.top}>
        <span className={styles.size}>
          <strong>{grid.rows.length.toLocaleString()}</strong> rows ·{" "}
          <strong>{grid.columns.length}</strong> columns
        </span>
        <button
          type="button"
          className={styles.download}
          onClick={() => {
            downloadCsv(grid, fileName);
          }}
        >
          Download CSV
        </button>
      </div>
      <ul
        className={styles.chips}
        aria-label="Columns, with their type and number of empty cells"
      >
        {profile.map((p) => (
          <li
            key={p.column}
            className={styles.chip}
            data-empty={p.empty > 0 ? "true" : "false"}
          >
            <span className={styles.name}>{p.column}</span>
            <span className={styles.meta}>
              {p.dtype}
              {p.empty > 0 ? ` · ${p.empty.toLocaleString()} empty` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
