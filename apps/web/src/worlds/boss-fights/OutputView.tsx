import { useMemo } from "react";
import type { OutputTable, ResultGrid } from "@dcq/engine-adapters";
import type { ColumnHints } from "@dcq/content-schema";
import DataframeGrid from "./DataframeGrid";
import { columnTipsFor } from "../../lib/mysqlType";
import { explainError } from "./explainError";
import styles from "./OutputView.module.css";

export type RunOutput =
  | { kind: "table"; table: OutputTable }
  | { kind: "text"; text: string }
  | { kind: "error"; message: string }
  | { kind: "empty" };

export interface OutputViewProps {
  /** null until the player has run something. */
  output: RunOutput | null;
  language: "python" | "sql";
  textScale: number;
  onShowData: () => void;
  /** Set when the last query only showed rows but the answer has to be a table named result. */
  onUseAsAnswer?: (() => void) | undefined;
}

const NO_AFFLICTIONS = new Map<string, never>();
const MIN_COLUMN_PX = 84;
const MAX_COLUMN_PX = 320;
const CHAR_PX = 8.6;

function toGrid(table: OutputTable): { grid: ResultGrid; hints: ColumnHints } {
  const rows = table.rows.map((cells) => {
    const row: Record<string, string | number | boolean | null> = {};
    table.columns.forEach((column, i) => {
      row[column] = cells[i] ?? null;
    });
    return row;
  });
  const hints: ColumnHints = {};
  const dtypes: Record<string, string> = {};
  table.columns.forEach((column, i) => {
    const values = table.rows.map((cells) => cells[i] ?? null);
    const nonNull = values.filter((v) => v !== null);
    const numeric = nonNull.length > 0 && nonNull.every((v) => typeof v === "number");
    const longest = Math.max(
      column.length,
      ...values.slice(0, 60).map((v) => String(v ?? "NULL").length),
    );
    hints[column] = {
      widthPx: Math.min(MAX_COLUMN_PX, Math.max(MIN_COLUMN_PX, longest * CHAR_PX + 28)),
      numeric,
    };
    dtypes[column] = numeric ? "float64" : "object";
  });
  return {
    grid: { columns: table.columns, rows, dtypes, index: rows.map((_, i) => i) },
    hints,
  };
}

const ERROR_TIPS: Record<"python" | "sql", string[]> = {
  python: [
    "Column names are case sensitive: df['Temp_C'] and df['temp_c'] are different.",
    "Every opening bracket and quote needs a matching closing one.",
    "Lines inside a for, if or def block must be indented the same amount.",
  ],
  sql: [
    "The table is called data (and any other tables are named in the task).",
    "End every statement with a semicolon.",
    "Text values use single quotes: 'paid'. Column names need none.",
  ],
};

export default function OutputView({
  output,
  language,
  textScale,
  onShowData,
  onUseAsAnswer,
}: OutputViewProps) {
  const converted = useMemo(
    () => (output?.kind === "table" ? toGrid(output.table) : null),
    [output],
  );

  if (!output) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderTitle}>Nothing has run yet</p>
        <p className={styles.placeholderText}>
          Write {language === "sql" ? "a query" : "some code"} on the left and press Run.
          What it returns appears here. The changes it makes to the table appear in the
          Data (original) tab.
        </p>
      </div>
    );
  }

  if (output.kind === "error") {
    const { headline, explanation } = explainError(language, output.message);
    return (
      <div className={styles.error} role="alert">
        <h2 className={styles.errorTitle}>Your code hit an error</h2>
        <p className={styles.errorHeadline}>{headline}</p>
        <p className={styles.errorLead}>{explanation}</p>
        <details className={styles.errorDetails}>
          <summary>Full error from the engine</summary>
          <pre className={styles.errorMessage}>{output.message}</pre>
        </details>
        <p className={styles.tipsLabel}>Common causes</p>
        <ul className={styles.errorTips}>
          {ERROR_TIPS[language].map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <button type="button" className={styles.linkButton} onClick={onShowData}>
          Back to the data
        </button>
      </div>
    );
  }

  if (output.kind === "table" && converted) {
    const { totalRows } = output.table;
    const shown = output.table.rows.length;
    return (
      <div className={styles.tableView}>
        <div className={styles.bar}>
          <span className={styles.barTitle}>Output</span>
          <span className={styles.barMeta}>
            {totalRows === 0
              ? "No rows returned"
              : shown < totalRows
                ? `First ${String(shown)} of ${String(totalRows)} rows`
                : `${String(totalRows)} ${totalRows === 1 ? "row" : "rows"}`}
            {" · "}
            {output.table.columns.length}{" "}
            {output.table.columns.length === 1 ? "column" : "columns"}
          </span>
          <button type="button" className={styles.linkButton} onClick={onShowData}>
            Back to the data
          </button>
        </div>
        {onUseAsAnswer ? (
          <div className={styles.answerOffer}>
            <span>
              This query only <strong>shows</strong> rows. The answer has to be a table
              named <code>result</code>.
            </span>
            <button type="button" className={styles.offerButton} onClick={onUseAsAnswer}>
              Use this query as the answer
            </button>
          </div>
        ) : null}
        {totalRows === 0 ? (
          <div className={styles.placeholder}>
            <p className={styles.placeholderTitle}>The query ran and returned no rows</p>
            <p className={styles.placeholderText}>
              That is not an error. Nothing matched. The columns it would have shown are:{" "}
              {output.table.columns.join(", ")}.
            </p>
          </div>
        ) : (
          <div className={styles.tableHost}>
            <DataframeGrid
              grid={converted.grid}
              afflictionCellMap={NO_AFFLICTIONS}
              textScale={textScale}
              columnHints={converted.hints}
              nullLabel={language === "sql" ? "NULL" : "NaN"}
              columnTips={columnTipsFor(converted.grid)}
            />
          </div>
        )}
      </div>
    );
  }

  if (output.kind === "text") {
    return (
      <div className={styles.tableView}>
        <div className={styles.bar}>
          <span className={styles.barTitle}>Output</span>
          <button type="button" className={styles.linkButton} onClick={onShowData}>
            Back to the data
          </button>
        </div>
        <pre className={styles.text}>{output.text}</pre>
      </div>
    );
  }

  return (
    <div className={styles.placeholder}>
      <p className={styles.placeholderTitle}>Done. There is nothing to display</p>
      <p className={styles.placeholderText}>
        That code ran but did not return a value to show. To see something here, end with
        a value, such as{" "}
        {language === "sql" ? "a SELECT query" : "df.head() or print(...)"}.
      </p>
      <button type="button" className={styles.linkButton} onClick={onShowData}>
        Back to the data
      </button>
    </div>
  );
}
