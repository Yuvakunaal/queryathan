import { forwardRef, useMemo, useState } from "react";
import type { SqlRef as RefItem, SqlRefGroup as RefGroup } from "../../lib/sqlReference";
import styles from "./HelpToolbox.module.css";

export interface HelpBodyProps {
  /** Names the search box and the list, e.g. "SQL help". */
  label: string;
  groups: RefGroup[];
  searchHint: string;
  /** Called with an entry when it is clicked. Without it the entries are plain reading. */
  onPick?: ((item: RefItem) => void) | undefined;
}

/**
 * The inside of a help panel: a search box, the topics, and the entries (how each is
 * written, what it does, an example). Used by the editor's help popover and by the
 * Tips dialog, so both look and search the same.
 */
const HelpBody = forwardRef<HTMLInputElement, HelpBodyProps>(function HelpBody(
  { label, groups, searchHint, onPick },
  searchRef,
) {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
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
    <>
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
        {shown.map((item) => {
          const content = (
            <>
              <span className={styles.syntax}>{item.syntax}</span>
              <span className={styles.detail}>{item.detail}</span>
              {item.example ? (
                <span className={styles.example}>{item.example}</span>
              ) : null}
            </>
          );
          return (
            <li key={item.name}>
              {onPick ? (
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    onPick(item);
                  }}
                >
                  {content}
                </button>
              ) : (
                <div className={styles.item} data-plain="true">
                  {content}
                </div>
              )}
            </li>
          );
        })}
        {shown.length === 0 ? (
          <li className={styles.none}>Nothing matches &quot;{query}&quot;.</li>
        ) : null}
      </ul>
    </>
  );
});

export default HelpBody;
