import { lazy, Suspense, useEffect, useState } from "react";
import { WorldMapScreen } from "./worlds/boss-fights";
import {
  getWorldProgress,
  loadSave,
  persistSave,
  rankForWorld,
  recordCaseWin,
} from "./lib/save";
import type { SaveData } from "./lib/save";
import { applyA11yToDocument, loadA11yState, persistA11yState } from "./lib/a11y";
import type { A11yState } from "./lib/a11y";

// Code-split from WorldMapScreen (the actual landing screen): CodeMirror
// and GSAP have no reason to download before a player has even picked a
// fight. WorldMapScreen still eagerly pulls the shared font/theme imports
// via the worlds/boss-fights barrel, so nothing here needs to re-trigger
// those.
const BossFightScreen = lazy(() => import("./worlds/boss-fights/BossFightScreen"));

const WORLD = "boss-fights" as const;

type Screen = { name: "roster" } | { name: "fight"; casePath: string };

/**
 * Only visible for the code-split chunk's fetch time — near-instant on a
 * warm cache, but real on first navigation into a fight. Plain inline
 * styles (not a CSS Module) deliberately: this renders before
 * BossFightScreen.module.css's own chunk has arrived.
 */
function FightScreenFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        height: "100dvh",
        display: "flex",
        alignItems: "flex-start",
        padding: "12vh 0 0 8vw",
        background: "#06080a",
        color: "#8fa79b",
        font: "13px/20px ui-monospace, monospace",
      }}
    >
      mounting engine ......... pyodide/wasm
    </div>
  );
}

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>({ name: "roster" });
  const [a11y, setA11y] = useState<A11yState>(loadA11yState);

  // Applied here, above the roster/fight switch, so a player's saved
  // text-scale/CRT/contrast preferences reach the world map too — it used
  // to live only inside BossFightScreen, silently ignoring those
  // preferences on the app's actual landing screen since Phase 2.
  useEffect(() => {
    applyA11yToDocument(a11y);
    persistA11yState(a11y);
  }, [a11y]);

  function updateSave(next: SaveData): void {
    setSaveData(next);
    persistSave(next);
  }

  if (screen.name === "fight") {
    const progress = getWorldProgress(saveData, WORLD);
    const rankLabel = rankForWorld(WORLD, progress.masteredTechniques.length);
    return (
      <Suspense fallback={<FightScreenFallback />}>
        <BossFightScreen
          casePath={screen.casePath}
          rankLabel={rankLabel}
          a11y={a11y}
          onA11yChange={setA11y}
          onExitToRoster={() => {
            setScreen({ name: "roster" });
          }}
          onWin={(caseId, techniqueKinds) => {
            updateSave(recordCaseWin(saveData, WORLD, caseId, techniqueKinds));
          }}
        />
      </Suspense>
    );
  }

  return (
    <WorldMapScreen
      world={WORLD}
      saveData={saveData}
      a11y={a11y}
      onA11yChange={setA11y}
      onSelectCase={(casePath) => {
        setScreen({ name: "fight", casePath });
      }}
      onImportSave={updateSave}
    />
  );
}
