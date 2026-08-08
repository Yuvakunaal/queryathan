import { useState } from "react";
import { BossFightScreen, WorldMapScreen } from "./worlds/boss-fights";
import {
  getWorldProgress,
  loadSave,
  persistSave,
  rankForWorld,
  recordCaseWin,
} from "./lib/save";
import type { SaveData } from "./lib/save";

const WORLD = "boss-fights" as const;

type Screen = { name: "roster" } | { name: "fight"; casePath: string };

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>({ name: "roster" });

  function updateSave(next: SaveData): void {
    setSaveData(next);
    persistSave(next);
  }

  if (screen.name === "fight") {
    const progress = getWorldProgress(saveData, WORLD);
    const rankLabel = rankForWorld(WORLD, progress.masteredTechniques.length);
    return (
      <BossFightScreen
        casePath={screen.casePath}
        rankLabel={rankLabel}
        onExitToRoster={() => {
          setScreen({ name: "roster" });
        }}
        onWin={(caseId, techniqueKinds) => {
          updateSave(recordCaseWin(saveData, WORLD, caseId, techniqueKinds));
        }}
      />
    );
  }

  return (
    <WorldMapScreen
      world={WORLD}
      saveData={saveData}
      onSelectCase={(casePath) => {
        setScreen({ name: "fight", casePath });
      }}
      onImportSave={updateSave}
    />
  );
}
