import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { playEngineSelectReveal } from "../../anim/world1/engineSelectReveal";
import { classNames } from "../../lib/classNames";
import styles from "./EngineSelect.module.css";

export type EngineChoice = "python" | "sql";

export interface EngineSelectProps {
  bossName: string;
  onSelect: (engine: EngineChoice) => void;
}

const ENGINES: {
  id: EngineChoice;
  label: string;
  runtime: string;
  tagline: string;
  hint: string;
}[] = [
  {
    id: "python",
    label: "PYTHON",
    runtime: "pandas // pyodide-wasm",
    tagline: "Clean the dataframe with pandas, the way you already know it.",
    hint: "df.dropna() · df.loc[...] · df.astype(...)",
  },
  {
    id: "sql",
    label: "SQL",
    runtime: "sqlite // sql.js-wasm",
    tagline: "Clean the table with SQL, straight against a real SQLite engine.",
    hint: "DELETE FROM data WHERE ... · UPDATE data SET ...",
  },
];

/**
 * Gate before boot (plan's dual-engine requirement): neither WorkerEngineClient
 * subclass spawns until the player commits to one, so picking SQL never pays
 * Pyodide's cold-start cost and vice versa.
 */
export default function EngineSelect({ bossName, onSelect }: EngineSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useGSAP(
    () => {
      playEngineSelectReveal(
        tileRefs.current.filter((el): el is HTMLButtonElement => el !== null),
      );
    },
    { scope: rootRef },
  );

  return (
    <div className={styles.select} ref={rootRef}>
      <span className={styles.eyebrow}>DCQ//BOOT v0.1.0</span>
      <span className={styles.prompt}>
        select an engine to face <span className={styles.bossName}>{bossName}</span>
      </span>
      <div className={styles.tiles} role="group" aria-label="Engine selection">
        {ENGINES.map((engine, i) => (
          <button
            key={engine.id}
            type="button"
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            className={classNames(styles.tile, styles[`tile_${engine.id}`])}
            onClick={() => {
              onSelect(engine.id);
            }}
          >
            <span className={styles.tileLabel}>{engine.label}</span>
            <span className={styles.tileRuntime}>{engine.runtime}</span>
            <span className={styles.tileTagline}>{engine.tagline}</span>
            <span className={styles.tileHint}>{engine.hint}</span>
          </button>
        ))}
      </div>
      <span className={styles.footnote}>
        both engines run the same real, unmodified WASM builds — pick whichever you want
        to train
      </span>
    </div>
  );
}
