import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { WorldId } from "@dcq/content-schema";
import { WORLDS } from "../../lib/world-meta";
import styles from "./AboutDialog.module.css";

export interface AboutDialogProps {
  onClose: () => void;
  onStart: (world: WorldId) => void;
}

const LOOK: Record<WorldId, string> = {
  "boss-fights": "Green terminal",
  "the-vault": "Navy and brass",
  "the-twins": "Graphite, two accent colors",
  "the-architect": "Blueprint blue",
  "the-foundry": "Forge orange",
  "the-observatory": "Midnight violet and star gold",
  "the-labyrinth": "Stone and torchlight crimson",
  "the-timekeeper": "Brass clockwork and lime",
  "the-laboratory": "Cold lab teal and white",
};

const FOCUSABLE =
  'button, [href], input, textarea, select, summary, [tabindex]:not([tabindex="-1"])';

/**
 * A plain-language explainer for first-time visitors: what the site is, what
 * a round looks like, what happens on a win, and what the monster theme means.
 */
export default function AboutDialog({ onClose, onStart }: AboutDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 id="about-title" className={styles.title}>
            What is Data Cleaning Quest?
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div
          className={styles.body}
          tabIndex={0}
          role="region"
          aria-label="About Data Cleaning Quest"
        >
          <p className={styles.lead}>
            A free game that teaches you to clean messy data by writing real Python
            (pandas) or SQL. Everything runs in your browser. There is no account, and
            nothing you load is uploaded.
          </p>

          <section aria-labelledby="about-why">
            <h3 id="about-why">Why clean data?</h3>
            <p>
              Real data is messy: empty cells, rows entered twice, typos, dates in five
              formats. People who work with data spend a large part of their time fixing
              exactly this. This game is practice for that, one small, clear problem at a
              time. Once a table is clean, the later worlds use it to answer real
              questions, from CTEs and time zones to experiments.
            </p>
          </section>

          <section aria-labelledby="about-how">
            <h3 id="about-how">How a round works</h3>
            <ol className={styles.steps}>
              <li>
                <strong>Pick a world, then a boss.</strong> A boss is a messy table with
                specific problems in it.
              </li>
              <li>
                <strong>Read the task.</strong> On the left, "Your task" says what to fix
                and "You win when" is a checklist of what must be true.
              </li>
              <li>
                <strong>Write code.</strong> Choose Python or SQL and type in the editor.
                Click a table or column name to insert it. Stuck? Open a hint.
              </li>
              <li>
                <strong>Press Run.</strong> The right side shows the data table with the
                problems highlighted. The Output tab shows what your code returned, Your
                answer shows the table named result when you build one, and Changes lists
                what it edited.
              </li>
              <li>
                <strong>Tick every box to win.</strong> The checklist updates as you work.
              </li>
            </ol>
          </section>

          <section aria-labelledby="about-win">
            <h3 id="about-win">What happens when you win</h3>
            <p>
              The boss is defeated with a short animation, and you see a summary: how many
              runs you used, how many cells you cleaned, and how many hints. You earn XP
              and rank for the techniques you used, and the next boss unlocks. Afterwards
              you can keep exploring the cleaned data or play it again.
            </p>
          </section>

          <section aria-labelledby="about-theme">
            <h3 id="about-theme">The theme: the mess is the monster</h3>
            <p>
              Each problem in the data is a monster, and the data itself is the
              battlefield. A health bar counts the cells that are still wrong. Every fix
              you run changes the real table in front of you, so what you see is what you
              would see in a real notebook. There are no fake answers and no multiple
              choice.
            </p>
            <ul className={styles.worlds}>
              {WORLDS.map((world) => (
                <li key={world.id}>
                  <span className={styles.worldName}>{world.name}</span>
                  <span className={styles.worldText}>
                    {world.tagline} {LOOK[world.id]}
                    {world.available ? "." : ". Coming soon."}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="about-more">
            <h3 id="about-more">Good to know</h3>
            <ul className={styles.facts}>
              <li>
                <strong>Real engines.</strong> Python runs in pandas and SQL runs in
                SQLite, both inside your browser. Errors are the real errors, with a
                plain-English explanation on top.
              </li>
              <li>
                <strong>Run part of your code.</strong> Highlight some code and press Run
                to run only that. With nothing highlighted, everything runs.
              </li>
              <li>
                <strong>Sandbox.</strong> Load your own CSV and clean it the same way,
                with no grading.
              </li>
              <li>
                <strong>Your progress stays on this device.</strong> You can export it as
                a file to move it. Light and dark themes, text size and high contrast are
                in the top corner.
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              onStart("boss-fights");
            }}
          >
            Start with Boss Fights
          </button>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
