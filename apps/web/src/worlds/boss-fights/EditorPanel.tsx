import { forwardRef } from "react";
import CodeEditor from "./CodeEditor";
import type { CodeEditorHandle } from "./CodeEditor";
import HelpToolbox from "./HelpToolbox";
import { SQL_REFERENCE } from "../../lib/sqlReference";
import { PANDAS_REFERENCE } from "../../lib/pandasReference";
import { tipAttributes } from "../../lib/columnTip";
import type { ColumnTip } from "../../lib/mysqlType";
import styles from "./EditorPanel.module.css";

export interface EditorPanelProps {
  language: "python" | "sql";
  starterCode: string;
  /** What the editor opens with: the player's saved draft if they have one, else the starting code. */
  initialCode?: string;
  onCodeChange?: (value: string) => void;
  /** Table name -> column names. The first entry is the player's main table. */
  schema: Record<string, string[]>;
  /** MySQL type tooltips: table name -> column name -> tip. */
  columnTips?: Record<string, Record<string, ColumnTip>>;
  dark: boolean;
  onRun: () => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  onEscape: () => void;
}

/**
 * The code editor plus what a learner needs beside it: a clear title, a reset
 * button, and the names of every table and column as chips that insert
 * themselves at the cursor, so nobody has to remember or retype a name.
 */
const EditorPanel = forwardRef<CodeEditorHandle, EditorPanelProps>(function EditorPanel(
  {
    language,
    starterCode,
    initialCode,
    onCodeChange,
    schema,
    columnTips,
    dark,
    onRun,
    onEscape,
    onSelectionChange,
  },
  ref,
) {
  const handle = ref && typeof ref === "object" ? ref : null;
  const tableNames = Object.keys(schema);

  function insertColumn(table: string, column: string, isMain: boolean): void {
    if (language === "sql") {
      handle?.current?.insert(isMain ? column : `${table}.${column}`);
    } else {
      handle?.current?.insert(`${table}['${column}']`);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>
          {language === "sql" ? "Your query" : "Your code"}
        </h2>
        <span className={styles.lang}>{language === "sql" ? "SQL" : "Python"}</span>
        <span className={styles.spacer} />
        <HelpToolbox
          label={language === "sql" ? "SQL help" : "Python help"}
          groups={language === "sql" ? SQL_REFERENCE : PANDAS_REFERENCE}
          searchHint={
            language === "sql"
              ? "Search: date, null, join, rank..."
              : "Search: missing, group, merge, rolling..."
          }
          onInsert={(text) => {
            handle?.current?.insert(text);
          }}
        />
        {language === "sql" ? (
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => {
              handle?.current?.format();
            }}
            title="Tidy the SQL (the selection, or everything). Shift+Alt+F"
          >
            Format
          </button>
        ) : null}
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => {
            handle?.current?.setValue(starterCode);
          }}
          title="Put the starting code back. You can undo this with Ctrl+Z."
        >
          Reset
        </button>
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => {
            handle?.current?.setValue("");
          }}
          title="Empty the editor. You can undo this with Ctrl+Z."
        >
          Clear
        </button>
      </div>
      <div
        className={styles.schema}
        aria-label="Tables and columns. Click one to insert it."
      >
        {tableNames.map((table, index) => (
          <div key={table} className={styles.group}>
            <button
              type="button"
              className={styles.tableChip}
              onClick={() => {
                handle?.current?.insert(table);
              }}
            >
              {table}
            </button>
            {(schema[table] ?? []).map((column) => (
              <button
                key={column}
                type="button"
                className={styles.columnChip}
                onClick={() => {
                  insertColumn(table, column, index === 0);
                }}
                {...tipAttributes(column, columnTips?.[table]?.[column])}
              >
                {column}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.editor}>
        <CodeEditor
          ref={ref}
          initialValue={initialCode ?? starterCode}
          onChange={onCodeChange}
          language={language}
          schema={schema}
          dark={dark}
          onRun={onRun}
          onSelectionChange={onSelectionChange}
          onEscape={onEscape}
        />
      </div>
    </div>
  );
});

export default EditorPanel;
