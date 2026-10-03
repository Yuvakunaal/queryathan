import { starterIdeas } from "../../lib/sandbox";
import styles from "./SandboxBriefing.module.css";

export interface SandboxBriefingProps {
  fileName: string;
  language: "python" | "sql";
  columns: string[];
  rowCount: number;
  notes: string[];
  onUse: (code: string) => void;
}

export default function SandboxBriefing({
  fileName,
  language,
  columns,
  rowCount,
  notes,
  onUse,
}: SandboxBriefingProps) {
  const ideas = starterIdeas(language, columns);
  const table = language === "sql" ? "data" : "df";
  return (
    <div className={styles.panel} tabIndex={0}>
      <p className={styles.kicker}>Sandbox</p>
      <h1 className={styles.title}>{fileName}</h1>
      <p className={styles.lead}>
        Your own data: {rowCount.toLocaleString()} rows, {columns.length} columns. It is
        loaded as <code>{table}</code>. Nothing here is graded, and the file never leaves
        your browser.
      </p>
      <section className={styles.section} aria-labelledby="sb-ideas">
        <h2 id="sb-ideas" className={styles.heading}>
          Good first questions
        </h2>
        <p className={styles.hint}>Click one to put it in the editor, then press Run.</p>
        <ul className={styles.ideas}>
          {ideas.map((idea) => (
            <li key={idea.label}>
              <button
                type="button"
                className={styles.idea}
                onClick={() => {
                  onUse(idea.code);
                }}
              >
                {idea.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.section} aria-labelledby="sb-save">
        <h2 id="sb-save" className={styles.heading}>
          Keep your work
        </h2>
        <p className={styles.hint}>
          {language === "sql"
            ? "Changes you make with UPDATE or DELETE apply to the table. "
            : "Assign changes back to df, for example df = df.dropna(). "}
          When it looks right, use <strong>Download CSV</strong> above the table to save
          the cleaned data.
        </p>
      </section>
      {notes.length > 0 ? (
        <section className={styles.section} aria-labelledby="sb-notes">
          <h2 id="sb-notes" className={styles.heading}>
            Tidied on the way in
          </h2>
          <ul className={styles.notes}>
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
