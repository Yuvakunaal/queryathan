import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  SandboxSetupScreen,
  WorldMapScreen,
  WorldSelectScreen,
} from "./worlds/boss-fights";
import type { SandboxSession } from "./worlds/boss-fights/BossFightScreen";
import TopBar from "./worlds/boss-fights/TopBar";
import { worldMeta } from "./lib/world-meta";
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
import { casePath } from "./lib/load-case";
import { formatRoute, parseRoute } from "./lib/route";
import type { Route } from "./lib/route";
import { worldMeta as metaFor } from "./lib/world-meta";
import { TipsProvider } from "./TipsContext";
import type { Inserter } from "./TipsContext";
import TipsDialog from "./worlds/boss-fights/TipsDialog";
import { applyA11yToDocument, loadA11yState, persistA11yState } from "./lib/a11y";
import type { A11yState } from "./lib/a11y";
import { configureSound, playTravel, preloadKeys, preloadSlice } from "./lib/sound";
import type { ReactElement } from "react";

// Code-split from WorldMapScreen (the actual landing screen): CodeMirror
// and GSAP have no reason to download before a player has even picked a
// fight. WorldMapScreen still eagerly pulls the shared font/theme imports
// via the worlds/boss-fights barrel, so nothing here needs to re-trigger
// those.
const BossFightScreen = lazy(() => import("./worlds/boss-fights/BossFightScreen"));
// The rocket flight (and the animation library it needs) is only fetched when a
// flight is about to play, so the home page stays small. Hovering a world card warms it up.
const loadTravel = () => import("./worlds/boss-fights/TravelSequence");
const TravelSequence = lazy(loadTravel);
function warmTravel(): void {
  void loadTravel();
}

type Screen =
  | { name: "hub" }
  | { name: "roster"; world: WorldId }
  | { name: "fight"; world: WorldId; casePath: string }
  | { name: "sandbox-setup" }
  | { name: "sandbox"; session: SandboxSession };

/**
 * Only visible for the code-split chunk's fetch time: near-instant on a warm
 * cache, but real on first navigation into a fight. It keeps the same top bar
 * the fight uses, so the bar never blinks away while the fight code loads. The
 * body uses plain inline styles (not a CSS Module) because this renders before
 * BossFightScreen.module.css's own chunk has arrived.
 */
function FightScreenFallback({
  world,
  sandbox,
  rank,
  a11y,
  onA11yChange,
  onBack,
}: {
  world: WorldId;
  sandbox: boolean;
  rank: string;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onBack: () => void;
}) {
  return (
    <div
      data-world={world}
      style={{
        height: "100dvh",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        background: "var(--w1-bg-void)",
      }}
    >
      <TopBar
        backLabel={sandbox ? "< Back" : "< Roster"}
        onBack={onBack}
        worldName={sandbox ? "SANDBOX" : worldMeta(world).statusRailName}
        rank={sandbox ? undefined : rank}
        a11y={a11y}
        onA11yChange={onA11yChange}
      />
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "12vh 0 0 8vw",
          color: "var(--w1-text-secondary)",
          font: "13px/20px ui-monospace, monospace",
        }}
      >
        loading ...
      </div>
    </div>
  );
}

function screenFromRoute(route: Route): Screen {
  switch (route.name) {
    case "hub":
      return { name: "hub" };
    case "roster":
      return { name: "roster", world: route.world };
    case "fight":
      return {
        name: "fight",
        world: route.world,
        casePath: casePath(route.world, route.caseId),
      };
    case "sandbox":
      // A sandbox session holds the player's files in memory, so reopening starts at the picker.
      return { name: "sandbox-setup" };
  }
}

function routeFromScreen(screen: Screen): Route {
  switch (screen.name) {
    case "hub":
      return { name: "hub" };
    case "roster":
      return { name: "roster", world: screen.world };
    case "fight": {
      const caseId =
        screen.casePath
          .split("/")
          .pop()
          ?.replace(/\.json$/, "") ?? "";
      return { name: "fight", world: screen.world, caseId };
    }
    default:
      return { name: "sandbox" };
  }
}

function AppScreens() {
  const [saveData, setSaveData] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>(() =>
    screenFromRoute(parseRoute(window.location.hash)),
  );
  const [a11y, setA11y] = useState<A11yState>(loadA11yState);
  // The world the rocket is flying to, while the flight is on screen.
  const [travel, setTravel] = useState<WorldId | null>(null);
  const stopTravelSound = useRef<() => void>(() => undefined);

  // Applied here, above the roster/fight switch, so a player's saved
  // text-scale/CRT/contrast preferences reach the world map too — it used
  // to live only inside BossFightScreen, silently ignoring those
  // preferences on the app's actual landing screen since Phase 2.
  useEffect(() => {
    applyA11yToDocument(a11y);
    configureSound({ effects: a11y.sound, typing: a11y.typing, volume: a11y.volume });
    if (a11y.typing) preloadKeys();
    if (a11y.sound) preloadSlice();
    persistA11yState(a11y);
  }, [a11y]);

  // Moving between screens is recorded in the browser's history, so Back and Forward work.
  function go(next: Screen): void {
    setScreen(next);
    const hash = formatRoute(routeFromScreen(next));
    if (window.location.hash !== hash || next.name !== screen.name) {
      window.history.pushState(null, "", hash);
    }
  }

  useEffect(() => {
    function onPopState(): void {
      setScreen(screenFromRoute(parseRoute(window.location.hash)));
    }
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // The tab's title says where you are, which also helps screen readers and the history list.
  useEffect(() => {
    const where =
      screen.name === "roster" || screen.name === "fight"
        ? metaFor(screen.world).name
        : screen.name === "hub"
          ? null
          : "Sandbox";
    document.title = where ? `${where} · Queryathan` : "Queryathan";
  }, [screen]);

  function updateSave(next: SaveData): void {
    setSaveData(next);
    persistSave(next);
  }

  // Choosing a world from the hub flies there (when the flight is switched on); the
  // screen changes behind the flight, which then fades away.
  function travelTo(world: WorldId): void {
    if (!a11y.travel || travel !== null) {
      go({ name: "roster", world });
      return;
    }
    setTravel(world);
    stopTravelSound.current = playTravel();
  }

  function renderScreen(): ReactElement {
    if (screen.name === "sandbox-setup") {
      return (
        <SandboxSetupScreen
          a11y={a11y}
          onA11yChange={setA11y}
          onBack={() => {
            go({ name: "hub" });
          }}
          onStart={(fileName, prepared, extras) => {
            go({
              name: "sandbox",
              session: {
                caseData: buildSandboxCase(fileName, prepared, extras),
                extras,
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
        <Suspense
          fallback={
            <FightScreenFallback
              world="boss-fights"
              sandbox
              rank=""
              a11y={a11y}
              onA11yChange={setA11y}
              onBack={() => {
                go({ name: "sandbox-setup" });
              }}
            />
          }
        >
          <BossFightScreen
            sandbox={screen.session}
            world="boss-fights"
            casePath=""
            rankLabel=""
            a11y={a11y}
            onA11yChange={setA11y}
            onExitToRoster={() => {
              go({ name: "sandbox-setup" });
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
        <Suspense
          fallback={
            <FightScreenFallback
              world={world}
              sandbox={false}
              rank={rankLabel}
              a11y={a11y}
              onA11yChange={setA11y}
              onBack={() => {
                go({ name: "roster", world });
              }}
            />
          }
        >
          <BossFightScreen
            world={world}
            casePath={screen.casePath}
            rankLabel={rankLabel}
            a11y={a11y}
            onA11yChange={setA11y}
            onExitToRoster={() => {
              go({ name: "roster", world });
            }}
            onWin={(caseId, techniqueKinds, stamp) => {
              updateSave(recordCaseWin(saveData, world, caseId, techniqueKinds, stamp));
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
          onSelectWorld={travelTo}
          onWarmTravel={a11y.travel ? warmTravel : undefined}
          onOpenSandbox={() => {
            go({ name: "sandbox-setup" });
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
          go({ name: "hub" });
        }}
        onSelectCase={(casePath) => {
          go({ name: "fight", world: rosterWorld, casePath });
        }}
        onImportSave={updateSave}
      />
    );
  }

  return (
    <>
      {renderScreen()}
      {travel !== null ? (
        <Suspense fallback={null}>
          <TravelSequence
            world={worldMeta(travel)}
            onCovered={() => {
              go({ name: "roster", world: travel });
            }}
            onSkip={() => {
              stopTravelSound.current();
            }}
            onDone={() => {
              setTravel(null);
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}

/** The app: the screens, plus the Tips dialog that the book button in any top bar opens. */
export default function App() {
  const [tipsWorld, setTipsWorld] = useState<string | null>(null);
  const inserterRef = useRef<Inserter | null>(null);
  const api = useMemo(
    () => ({
      // The dialog is drawn outside the screens, so it borrows the look of the world you are in.
      open: () => {
        setTipsWorld(
          document.querySelector("[data-world]")?.getAttribute("data-world") ??
            "boss-fights",
        );
      },
      registerInserter: (inserter: Inserter | null) => {
        inserterRef.current = inserter;
      },
    }),
    [],
  );

  return (
    <TipsProvider value={api}>
      <AppScreens />
      {tipsWorld !== null ? (
        <div data-world={tipsWorld} style={{ display: "contents" }}>
          <TipsDialog
            inserter={inserterRef.current}
            onClose={() => {
              setTipsWorld(null);
            }}
          />
        </div>
      ) : null}
    </TipsProvider>
  );
}
