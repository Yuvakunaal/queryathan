import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const panelRef = useRef<HTMLDivElement>(null);
  // Where the panel goes, in window coordinates: it is drawn above everything else, so no
  // panel around the editor can clip it, and it opens towards the side of the toolbar with room.
  const [place, setPlace] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const bar = rootRef.current?.parentElement?.getBoundingClientRect();
    if (bar) {
      const below = window.innerHeight - bar.bottom - 14;
      const above = bar.top - 14;
      const up = below < 300 && above > below;
      const maxHeight = Math.max(220, Math.min(480, up ? above : below));
      const width = Math.min(560, bar.width - 16);
      const left = Math.max(8, Math.min(bar.left + 8, window.innerWidth - width - 8));
      setPlace(
        up
          ? { left, width, bottom: window.innerHeight - bar.top + 6, maxHeight }
          : { left, width, top: bar.bottom + 6, maxHeight },
      );
    }
    function onPointerDown(event: PointerEvent): void {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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

  // Once the panel exists, the search box gets the cursor.
  const placed = place !== null;
  useEffect(() => {
    if (open && placed) searchRef.current?.focus();
  }, [open, placed]);

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
      {open && place
        ? createPortal(
            <div
              id={panelId}
              ref={panelRef}
              className={styles.panel}
              style={{
                left: place.left,
                width: place.width,
                top: place.top,
                bottom: place.bottom,
                maxHeight: place.maxHeight,
              }}
              role="region"
              aria-label={label}
            >
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
            </div>,
            rootRef.current?.closest("[data-world]") ?? document.body,
          )
        : null}
    </div>
  );
}
