import { useEffect, useRef, useState } from "react";
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

const TYPE_MS = 70;
const ERASE_MS = 30;
const HOLD_MS = 1500;
const GAP_MS = 320;

/**
 * "Welcome <Master>", where the name is typed, held, erased and replaced by the next one,
 * looping for as long as the page is open. Pauses while the pointer is over it. For
 * screen readers there is one calm, fixed sentence; people who ask for reduced motion
 * get a still greeting.
 */
export default function WelcomeTyper() {
  const still = prefersReducedMotion();
  const [text, setText] = useState(still ? "Explorer" : "");
  const pausedRef = useRef(false);

  useEffect(() => {
    if (still) return;
    let index = Math.floor(Math.random() * WELCOME_NAMES.length);
    let count = 0;
    let mode: "type" | "hold" | "erase" = "type";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const step = (): void => {
      if (pausedRef.current) {
        timer = setTimeout(step, 200);
        return;
      }
      const word = WELCOME_NAMES[index] ?? "Master";
      let delay = TYPE_MS;
      if (mode === "type") {
        count += 1;
        setText(word.slice(0, count));
        if (count >= word.length) mode = "hold";
        delay = TYPE_MS + Math.random() * 50;
      } else if (mode === "hold") {
        mode = "erase";
        delay = HOLD_MS;
      } else {
        count -= 1;
        setText(word.slice(0, count));
        if (count <= 0) {
          mode = "type";
          index = (index + 1) % WELCOME_NAMES.length;
          delay = GAP_MS;
        } else {
          delay = ERASE_MS;
        }
      }
      timer = setTimeout(step, delay);
    };
    timer = setTimeout(step, 500);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [still]);

  return (
    <p
      className={styles.welcome}
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
    >
      <span className={styles.sr}>Welcome, explorer. Choose a world below to begin.</span>
      <span className={styles.line} aria-hidden="true" data-welcome>
        <span className={styles.hello}>Welcome</span>
        <span className={styles.who}>
          <span className={styles.name}>{text}</span>
          <span className={styles.caret} />
        </span>
      </span>
      <span className={styles.hint} aria-hidden="true">
        Choose a world below to begin
      </span>
    </p>
  );
}
