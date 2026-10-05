import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../../anim/world1/motionContext";
import styles from "./WelcomeTyper.module.css";

/** The names the home page greets you by, typed out one after another, forever. */
const WELCOME_NAMES: readonly string[] = [
  "Master",
  "Savior",
  "Slayer",
  "Explorer",
  "Wrangler",
  "Navigator",
  "Pioneer",
  "Voyager",
  "Analyst",
  "Query Knight",
  "Data Whisperer",
  "NULL Hunter",
  "Join Wizard",
  "Pandas Tamer",
  "SQL Sorcerer",
  "Schema Surfer",
  "Index Ninja",
  "Cell Commander",
  "DataFrame Dragon",
  "Leviathan Slayer",
  "Row Runner",
  "Table Tamer",
  "Pivot Pilot",
  "Regex Ranger",
  "CTE Captain",
  "Window Walker",
  "Time Traveler",
  "Star Chaser",
  "Rocketeer",
  "Astronaut",
  "Captain",
  "Architect",
  "Alchemist",
  "Detective",
  "Cartographer",
  "Pathfinder",
  "Trailblazer",
  "Mad Scientist",
  "Dungeon Master",
  "Grandmaster",
  "Champion",
  "Guardian of Tables",
  "Dragon Rider",
  "Duplicate Destroyer",
  "Outlier Hunter",
  "Hero",
  "Legend",
  "Genius",
  "Sage",
  "Stranger",
];

const TYPE_MS = 75;
const ERASE_MS = 32;
const HOLD_MS = 1500;
const GAP_MS = 320;
const START_DELAY_MS = 450;

/** How many letters of `word` are showing `elapsed` ms into its type, hold, erase and rest cycle. */
function lettersAt(word: string, elapsed: number): number {
  const typeMs = word.length * TYPE_MS;
  const eraseMs = word.length * ERASE_MS;
  if (elapsed < 0) return 0;
  if (elapsed < typeMs) return Math.min(word.length, Math.floor(elapsed / TYPE_MS) + 1);
  if (elapsed < typeMs + HOLD_MS) return word.length;
  const erased = Math.floor((elapsed - typeMs - HOLD_MS) / ERASE_MS) + 1;
  if (elapsed < typeMs + HOLD_MS + eraseMs) return Math.max(0, word.length - erased);
  return 0;
}
const cycleMs = (word: string): number =>
  word.length * (TYPE_MS + ERASE_MS) + HOLD_MS + GAP_MS;

/**
 * "Welcome Master", where the name is typed, held, erased and replaced by the next one,
 * looping for as long as the page is open. What is shown is worked out from the clock on
 * every frame, not from a chain of timers, so a slow moment (a busy page, a background
 * tab) can never leave it stuck or behind: the next frame shows exactly where it should
 * be. Only this small component re-renders, and only when a letter changes. For screen
 * readers there is one calm, fixed sentence; people who ask for reduced motion get a
 * still greeting.
 */
export default function WelcomeTyper() {
  const still = prefersReducedMotion();
  const [text, setText] = useState(still ? "Explorer" : "");

  useEffect(() => {
    if (still) return;
    let index = Math.floor(Math.random() * WELCOME_NAMES.length);
    let cycleStart = performance.now() + START_DELAY_MS;
    let shown = "";
    let frame = 0;

    const tick = (now: number): void => {
      let word = WELCOME_NAMES[index] ?? "Master";
      // Move on to the right word if time has passed (several, after a long pause).
      while (now - cycleStart >= cycleMs(word)) {
        cycleStart += cycleMs(word);
        index = (index + 1) % WELCOME_NAMES.length;
        word = WELCOME_NAMES[index] ?? "Master";
      }
      const next = word.slice(0, lettersAt(word, now - cycleStart));
      if (next !== shown) {
        shown = next;
        setText(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [still]);

  return (
    <p className={styles.welcome}>
      <span className={styles.sr}>Welcome, explorer. Choose a world below to begin.</span>
      <span className={styles.line} aria-hidden="true" data-welcome>
        <span className={styles.hello}>Welcome</span>
        <span className={styles.who}>
          <span className={styles.name}>{text || "\u200b"}</span>
          <span className={styles.caret} data-caret />
        </span>
      </span>
      <span className={styles.hint} aria-hidden="true">
        Choose a world below to begin
      </span>
    </p>
  );
}
