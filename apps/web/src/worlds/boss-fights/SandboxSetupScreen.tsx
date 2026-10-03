import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { prepareSandboxCsv, SANDBOX_LIMITS } from "../../lib/sandbox";
import type { PreparedSandbox } from "../../lib/sandbox";
import type { A11yState } from "../../lib/a11y";
import { classNames } from "../../lib/classNames";
import A11yControls from "./A11yControls";
import styles from "./SandboxSetupScreen.module.css";

export interface SandboxSetupScreenProps {
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onBack: () => void;
  onStart: (fileName: string, prepared: PreparedSandbox) => void;
}

const SAMPLE = {
  url: "/datasets/world-1/case-shift.csv",
  name: "messy-products.csv",
};

export default function SandboxSetupScreen({
  a11y,
  onA11yChange,
  onBack,
  onStart,
}: SandboxSetupScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{
    fileName: string;
    prepared: PreparedSandbox;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(fileName: string, text: string): void {
    const result = prepareSandboxCsv(text);
    if (!result.ok) {
      setLoaded(null);
      setError(result.message);
      return;
    }
    setError(null);
    setLoaded({ fileName, prepared: result.data });
  }

  function readFile(file: File): void {
    if (file.size > SANDBOX_LIMITS.maxBytes * 2) {
      setLoaded(null);
      setError(
        `That file is ${(file.size / 1_000_000).toFixed(1)} MB. The sandbox handles files up to ${String(SANDBOX_LIMITS.maxBytes / 1_000_000)} MB.`,
      );
      return;
    }
    setBusy(true);
    file
      .text()
      .then((text) => {
        accept(file.name, text);
      })
      .catch(() => {
        setError(
          "That file could not be read. Try saving it as CSV and choosing it again.",
        );
      })
      .finally(() => {
        setBusy(false);
      });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function loadSample(): void {
    setBusy(true);
    fetch(SAMPLE.url)
      .then((response) => response.text())
      .then((text) => {
        accept(SAMPLE.name, text);
      })
      .catch(() => {
        setError("The sample could not be loaded. Check your connection and try again.");
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <div className={styles.screen} data-world="boss-fights">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <button type="button" className={styles.back} onClick={onBack}>
            &lt; Worlds
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.crumb}>Sandbox</span>
          <span className={styles.spacer} />
          <A11yControls a11y={a11y} onChange={onA11yChange} />
        </header>

        <section className={styles.hero}>
          <h1 className={styles.heading}>Bring your own data.</h1>
          <p className={styles.lede}>
            Load a CSV and explore or clean it with real pandas or SQL, using the same
            editor as the worlds. Nothing is graded, and the file stays in your browser.
            Nothing is uploaded.
          </p>
        </section>

        <div
          className={classNames(styles.drop, dragging && styles.dropActive)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => {
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <p className={styles.dropTitle}>Drop a CSV file here</p>
          <p className={styles.dropHint}>
            Up to {String(SANDBOX_LIMITS.maxBytes / 1_000_000)} MB and{" "}
            {SANDBOX_LIMITS.maxRows.toLocaleString()} rows. A header row is needed.
          </p>
          <div className={styles.dropActions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              Choose a file
            </button>
            <button type="button" className={styles.secondary} onClick={loadSample}>
              Try a sample
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            className={styles.hidden}
            aria-label="Choose a CSV file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) readFile(file);
              event.target.value = "";
            }}
          />
        </div>

        <details className={styles.paste}>
          <summary>Or paste CSV text</summary>
          <textarea
            className={styles.textarea}
            rows={6}
            value={pasted}
            placeholder={"name,city\nAva,Austin\nLiam,Leeds"}
            aria-label="CSV text"
            onChange={(event) => {
              setPasted(event.target.value);
            }}
          />
          <button
            type="button"
            className={styles.secondary}
            disabled={pasted.trim() === ""}
            onClick={() => {
              accept("pasted-data.csv", pasted);
            }}
          >
            Use this text
          </button>
        </details>

        <div className={styles.status} aria-live="polite">
          {busy ? "Reading the file..." : ""}
        </div>

        {error ? (
          <div className={styles.error} role="alert">
            <strong>Could not use that data.</strong> {error}
          </div>
        ) : null}

        {loaded ? (
          <section className={styles.ready} aria-labelledby="sandbox-ready">
            <h2 id="sandbox-ready" className={styles.readyTitle}>
              {loaded.fileName}
            </h2>
            <p className={styles.readyMeta}>
              {loaded.prepared.rowCount.toLocaleString()} rows ·{" "}
              {loaded.prepared.columns.length} columns
            </p>
            <ul className={styles.columns} aria-label="Columns found">
              {loaded.prepared.columns.slice(0, 40).map((column) => (
                <li key={column}>{column}</li>
              ))}
              {loaded.prepared.columns.length > 40 ? (
                <li>+{loaded.prepared.columns.length - 40} more</li>
              ) : null}
            </ul>
            {loaded.prepared.notes.length > 0 ? (
              <ul className={styles.notes}>
                {loaded.prepared.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                onStart(loaded.fileName, loaded.prepared);
              }}
            >
              Open in the editor
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
