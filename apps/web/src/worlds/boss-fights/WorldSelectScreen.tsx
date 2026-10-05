import { WORLDS } from "../../lib/world-meta";
import type { WorldMeta } from "../../lib/world-meta";
import { getWorldProgress, rankForWorld } from "../../lib/save";
import type { SaveData } from "../../lib/save";
import type { A11yState } from "../../lib/a11y";
import type { WorldId } from "@dcq/content-schema";
import { classNames } from "../../lib/classNames";
import A11yControls from "./A11yControls";
import Planet from "./Planet";
import Logo from "./Logo";
import WelcomeTyper from "./WelcomeTyper";
import AboutDialog from "./AboutDialog";
import { useEffect, useRef, useState } from "react";
import styles from "./WorldSelectScreen.module.css";

export interface WorldSelectScreenProps {
  saveData: SaveData;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onSelectWorld: (world: WorldId) => void;
  /** Called when a world card is hovered or focused, to prepare the flight. */
  onWarmTravel?: (() => void) | undefined;
  onOpenSandbox: () => void;
}

function WorldCard({
  meta,
  saveData,
  onSelect,
  onWarm,
}: {
  meta: WorldMeta;
  saveData: SaveData;
  onSelect: () => void;
  onWarm?: (() => void) | undefined;
}) {
  const progress = getWorldProgress(saveData, meta.id);
  const rank = rankForWorld(meta.id, progress.masteredTechniques.length);
  const content = (
    <>
      <Planet look={meta.planet} className={styles.planet} />
      <span className={styles.cardNumber}>
        World {meta.number} · {meta.discipline}
      </span>
      <h2 className={styles.cardName}>{meta.name}</h2>
      <p className={styles.cardEpithet}>{meta.epithet}</p>
      <p className={styles.cardTagline}>{meta.tagline}</p>
      <span className={styles.cardFoot}>
        {meta.available ? (
          <>
            <span>
              {progress.clearedCaseIds.length > 0
                ? `${String(progress.clearedCaseIds.length)} cleared · ${rank}`
                : "Not started"}
            </span>
            <span className={styles.cardCta}>Travel</span>
          </>
        ) : (
          <span>Coming soon</span>
        )}
      </span>
    </>
  );

  return (
    <li className={styles.cardItem}>
      {meta.available ? (
        <button
          type="button"
          className={classNames(styles.card, styles.cardButton)}
          data-world-card={meta.id}
          aria-label={`${meta.name}, world ${String(meta.number)}, ${meta.discipline}. ${meta.tagline} ${progress.clearedCaseIds.length > 0 ? `Rank ${rank}.` : "Not started."}`}
          onClick={onSelect}
          onPointerEnter={onWarm}
          onFocus={onWarm}
        >
          {content}
        </button>
      ) : (
        <div
          className={classNames(styles.card, styles.cardLocked)}
          role="group"
          aria-label={`${meta.name}, world ${String(meta.number)}, coming soon`}
        >
          {content}
        </div>
      )}
    </li>
  );
}

const REPO_URL = "https://github.com/Yuvakunaal/queryathan";
const ABOUT_KEY = "dcq.aboutSeen";

function readAboutSeen(): boolean {
  try {
    return window.localStorage.getItem(ABOUT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAboutSeen(): void {
  try {
    window.localStorage.setItem(ABOUT_KEY, "1");
  } catch {
    // Not remembered; the hint badge just shows again next time.
  }
}

export default function WorldSelectScreen({
  saveData,
  a11y,
  onA11yChange,
  onSelectWorld,
  onWarmTravel,
  onOpenSandbox,
}: WorldSelectScreenProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutSeen, setAboutSeen] = useState(readAboutSeen);
  const aboutLinkRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Return focus to the button that opened the dialog once it closes.
  useEffect(() => {
    if (wasOpenRef.current && !aboutOpen) aboutLinkRef.current?.focus();
    wasOpenRef.current = aboutOpen;
  }, [aboutOpen]);

  function openAbout(): void {
    setAboutOpen(true);
    if (!aboutSeen) {
      setAboutSeen(true);
      writeAboutSeen();
    }
  }
  return (
    <div className={styles.screen} data-world="hub">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <span className={styles.brand}>
            <Logo size={30} className={styles.brandMark} />
            Queryathan
          </span>
          <div className={styles.topRight}>
            <button
              ref={aboutLinkRef}
              type="button"
              className={styles.aboutLink}
              onClick={openAbout}
            >
              What is this?
              {aboutSeen ? null : <span className={styles.newBadge}>Start here</span>}
            </button>
            <A11yControls a11y={a11y} onChange={onA11yChange} />
          </div>
        </header>
        <section className={styles.hero}>
          <h1 className={styles.heading}>Fight your data clean.</h1>
          <p className={styles.lede}>
            Learn real pandas and SQL: clean messy tables, then make them answer
            questions. Everything runs in your browser. No account, no server. Progress
            stays on this device.
          </p>
          <WelcomeTyper />
        </section>
        <ul className={styles.grid}>
          {WORLDS.map((meta) => (
            <WorldCard
              key={meta.id}
              meta={meta}
              saveData={saveData}
              onWarm={onWarmTravel}
              onSelect={() => {
                onSelectWorld(meta.id);
              }}
            />
          ))}
        </ul>
        <button type="button" className={styles.sandbox} onClick={onOpenSandbox}>
          <span className={styles.sandboxTitle}>Sandbox</span>
          <span className={styles.sandboxText}>
            Bring your own CSV and explore or clean it with pandas or SQL. Nothing is
            uploaded.
          </span>
          <span className={styles.cardCta}>Open</span>
        </button>
        <footer className={styles.footer}>
          <span>Open source (MIT). No account, no tracking.</span>
          <nav className={styles.footerLinks} aria-label="Project links">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Star on GitHub
            </a>
            <a
              href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add a case
            </a>
          </nav>
        </footer>
      </div>
      {aboutOpen ? (
        <AboutDialog
          onClose={() => {
            setAboutOpen(false);
          }}
          onStart={(world) => {
            setAboutOpen(false);
            onSelectWorld(world);
          }}
        />
      ) : null}
    </div>
  );
}
