import { lazy, Suspense, useEffect, useState } from "react";
import {
  SandboxSetupScreen,
  WorldMapScreen,
  WorldSelectScreen,
} from "./worlds/boss-fights";
import type { SandboxSession } from "./worlds/boss-fights/BossFightScreen";
import { buildSandboxCase } from "./lib/sandbox";
import type { WorldId } from "@dcq/content-schema";
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

type Screen =
  | { name: "hub" }
  | { name: "roster"; world: WorldId }
  | { name: "fight"; world: WorldId; casePath: string }
  | { name: "sandbox-setup" }
  | { name: "sandbox"; session: SandboxSession };

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
        background: "var(--dcq-color-bg)",
        color: "var(--dcq-color-fg)",
        font: "13px/20px ui-monospace, monospace",
      }}
    >
      loading ...
    </div>
  );
}

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>({ name: "hub" });
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

  if (screen.name === "sandbox-setup") {
    return (
      <SandboxSetupScreen
        a11y={a11y}
        onA11yChange={setA11y}
        onBack={() => {
          setScreen({ name: "hub" });
        }}
        onStart={(fileName, prepared) => {
          setScreen({
            name: "sandbox",
            session: {
              caseData: buildSandboxCase(fileName, prepared),
              csvText: prepared.csvText,
              fileName,
              rowCount: prepared.rowCount,
              notes: prepared.notes,
            },
          });
        }}
      />
    );
  }

  if (screen.name === "sandbox") {
    return (
      <Suspense fallback={<FightScreenFallback />}>
        <BossFightScreen
          sandbox={screen.session}
          world="boss-fights"
          casePath=""
          rankLabel=""
          a11y={a11y}
          onA11yChange={setA11y}
          onExitToRoster={() => {
            setScreen({ name: "sandbox-setup" });
          }}
          onWin={() => undefined}
        />
      </Suspense>
    );
  }

  if (screen.name === "fight") {
    const world = screen.world;
    const progress = getWorldProgress(saveData, world);
    const rankLabel = rankForWorld(world, progress.masteredTechniques.length);
    return (
      <Suspense fallback={<FightScreenFallback />}>
        <BossFightScreen
          world={world}
          casePath={screen.casePath}
          rankLabel={rankLabel}
          a11y={a11y}
          onA11yChange={setA11y}
          onExitToRoster={() => {
            setScreen({ name: "roster", world });
          }}
          onWin={(caseId, techniqueKinds) => {
            updateSave(recordCaseWin(saveData, world, caseId, techniqueKinds));
          }}
        />
      </Suspense>
    );
  }

  if (screen.name === "hub") {
    return (
      <WorldSelectScreen
        saveData={saveData}
        a11y={a11y}
        onA11yChange={setA11y}
        onSelectWorld={(world) => {
          setScreen({ name: "roster", world });
        }}
        onOpenSandbox={() => {
          setScreen({ name: "sandbox-setup" });
        }}
      />
    );
  }

  const rosterWorld = screen.world;
  return (
    <WorldMapScreen
      world={rosterWorld}
      saveData={saveData}
      a11y={a11y}
      onA11yChange={setA11y}
      onBack={() => {
        setScreen({ name: "hub" });
      }}
      onSelectCase={(casePath) => {
        setScreen({ name: "fight", world: rosterWorld, casePath });
      }}
      onImportSave={updateSave}
    />
  );
}
