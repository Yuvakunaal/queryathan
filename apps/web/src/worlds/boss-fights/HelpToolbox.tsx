import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SqlRef as RefItem, SqlRefGroup as RefGroup } from "../../lib/sqlReference";
import styles from "./HelpToolbox.module.css";

export interface HelpToolboxProps {
  /** The button's name and the panel's, e.g. "SQL help" or "Python help". */
  label: string;
  groups: RefGroup[];
  searchHint: string;
  onInsert: (text: string) => void;
}

/**
 * The help panel: the everyday building blocks of the chosen language grouped by
 * what you want to do. Click an entry to put it into the editor; each shows how it
 * is written, what it does and a small example. Search finds entries across topics.
 */
export default function HelpToolbox({
  label,
  groups,
  searchHint,
  onInsert,
}: HelpToolboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
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
    const hits: RefItem[] = [];
    for (const group of groups) {
      for (const item of group.items) {
        const haystack = `${item.name} ${item.detail} ${item.syntax}`.toLowerCase();
        if (haystack.includes(needle)) hits.push(item);
      }
    }
    return hits;
  }, [needle, groups]);
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
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
        title={`${label}: click an entry to insert it`}
      >
        {label}
      </button>
      {open ? (
        <div id={panelId} className={styles.panel} role="region" aria-label={label}>
          <input
            ref={searchRef}
            type="search"
            className={styles.search}
            placeholder={searchHint}
            aria-label={`Search ${label}`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          {results ? null : (
            <div className={styles.tabs} role="group" aria-label="Topics">
              {groups.map((g) => (
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
