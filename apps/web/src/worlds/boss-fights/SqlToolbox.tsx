import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SQL_REFERENCE } from "../../lib/sqlReference";
import type { SqlRef } from "../../lib/sqlReference";
import styles from "./SqlToolbox.module.css";

export interface SqlToolboxProps {
  onInsert: (text: string) => void;
}

/**
 * "SQL help": the everyday functions and clauses grouped by what you want to
 * do (dates, missing values, text, numbers, groups and windows, joins). Click
 * an entry to put it into the query; each shows how it is written and an example.
 */
export default function SqlToolbox({ onInsert }: SqlToolboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState(SQL_REFERENCE[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onPointerDown(event: PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return null;
    const hits: SqlRef[] = [];
    for (const group of SQL_REFERENCE) {
      for (const item of group.items) {
        const haystack = `${item.name} ${item.detail} ${item.syntax}`.toLowerCase();
        if (haystack.includes(needle)) hits.push(item);
      }
    }
    return hits;
  }, [needle]);
  const group = SQL_REFERENCE.find((g) => g.id === groupId) ?? SQL_REFERENCE[0];
  const shown = results ?? group?.items ?? [];

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((o) => !o);
        }}
        title="Dates, missing values, text, windows, joins: click to insert"
      >
        SQL help
      </button>
      {open ? (
        <div id={panelId} className={styles.panel} role="region" aria-label="SQL help">
          <input
            ref={searchRef}
            type="search"
            className={styles.search}
            placeholder="Search: date, null, join, rank..."
            aria-label="Search SQL help"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          {results ? null : (
            <div className={styles.tabs} role="group" aria-label="Topics">
              {SQL_REFERENCE.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={styles.tab}
                  aria-pressed={g.id === groupId}
                  onClick={() => {
                    setGroupId(g.id);
                  }}
                >
                  {g.title}
                </button>
              ))}
            </div>
          )}
          <ul className={styles.list}>
            {shown.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    onInsert(item.insert);
                    setOpen(false);
                  }}
                >
                  <span className={styles.syntax}>{item.syntax}</span>
                  <span className={styles.detail}>{item.detail}</span>
                  {item.example ? (
                    <span className={styles.example}>{item.example}</span>
                  ) : null}
                </button>
              </li>
            ))}
            {shown.length === 0 ? (
              <li className={styles.none}>Nothing matches &quot;{query}&quot;.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
