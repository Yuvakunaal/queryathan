import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { classNames } from "../../lib/classNames";
import { usePhone } from "../../lib/usePhone";
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
  const phone = usePhone();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  // On a phone only two topics fit on a line: the chosen one and the first other one, then "More".
  const visibleGroups = phone
    ? groups
        .filter((g) => g.id === groupId)
        .concat(groups.filter((g) => g.id !== groupId))
        .slice(0, 2)
        .sort((a, b) => groups.indexOf(a) - groups.indexOf(b))
    : groups;

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
        <div
          className={classNames(styles.tabs, phone && styles.tabsPhone)}
          role="group"
          aria-label="Topics"
        >
          {visibleGroups.map((g) => (
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
          {phone && groups.length > visibleGroups.length ? (
            <button
              ref={moreButtonRef}
              type="button"
              className={classNames(styles.tab, styles.more)}
              aria-haspopup="dialog"
              onClick={() => {
                setMoreOpen(true);
              }}
            >
              More
            </button>
          ) : null}
        </div>
      )}
      {phone && moreOpen ? (
        <TopicsModal
          groups={groups}
          activeId={group?.id ?? ""}
          onPick={(id) => {
            setGroupId(id);
            setMoreOpen(false);
            moreButtonRef.current?.focus();
          }}
          onClose={() => {
            setMoreOpen(false);
            moreButtonRef.current?.focus();
          }}
        />
      ) : null}
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

/** On a phone: every topic in a tidy two-column modal, opened by the "More" button. */
function TopicsModal({
  groups,
  activeId,
  onPick,
  onClose,
}: {
  groups: RefGroup[];
  activeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstRef.current?.focus();
  }, []);
  return (
    <div
      className={styles.modalBackdrop}
      data-topics-modal
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="All topics"
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Topics</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.modalGrid}>
          {groups.map((g, index) => (
            <button
              key={g.id}
              ref={index === 0 ? firstRef : undefined}
              type="button"
              className={styles.modalTopic}
              aria-pressed={g.id === activeId}
              onClick={() => {
                onPick(g.id);
              }}
            >
              {g.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
