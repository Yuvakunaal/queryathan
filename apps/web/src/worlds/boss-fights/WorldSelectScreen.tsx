import { WORLDS } from "../../lib/world-meta";
import type { WorldMeta } from "../../lib/world-meta";
import { getWorldProgress, rankForWorld } from "../../lib/save";
import type { SaveData } from "../../lib/save";
import type { A11yState } from "../../lib/a11y";
import type { WorldId } from "@dcq/content-schema";
import { classNames } from "../../lib/classNames";
import A11yControls from "./A11yControls";
import AboutDialog from "./AboutDialog";
import RankCardDialog from "./RankCardDialog";
import { useEffect, useRef, useState } from "react";
import styles from "./WorldSelectScreen.module.css";

export interface WorldSelectScreenProps {
  saveData: SaveData;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onSelectWorld: (world: WorldId) => void;
  onOpenSandbox: () => void;
}

function WorldCard({
  meta,
  saveData,
  onSelect,
}: {
  meta: WorldMeta;
  saveData: SaveData;
  onSelect: () => void;
}) {
  const progress = getWorldProgress(saveData, meta.id);
  const rank = rankForWorld(meta.id, progress.masteredTechniques.length);
  const content = (
    <>
      <span className={styles.cardNumber}>World {meta.number}</span>
      <h2 className={styles.cardName}>{meta.name}</h2>
      <p className={styles.cardTagline}>{meta.tagline}</p>
      <span className={styles.cardFoot}>
        {meta.available ? (
          <>
            <span>
              {progress.clearedCaseIds.length > 0
                ? `${String(progress.clearedCaseIds.length)} cleared · ${rank}`
                : "Not started"}
            </span>
            <span className={styles.cardCta}>Open</span>
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
          aria-label={`${meta.name}, world ${String(meta.number)}. ${meta.tagline} ${progress.clearedCaseIds.length > 0 ? `Rank ${rank}.` : "Not started."}`}
          onClick={onSelect}
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
  onOpenSandbox,
}: WorldSelectScreenProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutSeen, setAboutSeen] = useState(readAboutSeen);
  const [cardOpen, setCardOpen] = useState(false);
  const cardButtonRef = useRef<HTMLButtonElement>(null);
  const cardWasOpenRef = useRef(false);
  const anyCleared = WORLDS.some(
    (w) => getWorldProgress(saveData, w.id).clearedCaseIds.length > 0,
  );
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Return focus to the button that opened the dialog once it closes.
  useEffect(() => {
    if (wasOpenRef.current && !aboutOpen) aboutButtonRef.current?.focus();
    wasOpenRef.current = aboutOpen;
  }, [aboutOpen]);

  useEffect(() => {
    if (cardWasOpenRef.current && !cardOpen) cardButtonRef.current?.focus();
    cardWasOpenRef.current = cardOpen;
  }, [cardOpen]);

  function openAbout(): void {
    setAboutOpen(true);
    if (!aboutSeen) {
      setAboutSeen(true);
      writeAboutSeen();
    }
  }
  return (
    <div className={styles.screen} data-world="boss-fights">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <span className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              &gt;_
            </span>
            Data Cleaning Quest
          </span>
          <div className={styles.topRight}>
            <button type="button" className={styles.aboutLink} onClick={openAbout}>
              What is this?
            </button>
            {anyCleared ? (
              <button
                ref={cardButtonRef}
                type="button"
                className={styles.aboutLink}
                onClick={() => {
                  setCardOpen(true);
                }}
              >
                Share progress
              </button>
            ) : null}
            <A11yControls a11y={a11y} onChange={onA11yChange} />
          </div>
        </header>
        <section className={styles.hero}>
          <h1 className={styles.heading}>Fight your data clean.</h1>
          <p className={styles.lede}>
            Learn real pandas and SQL on messy tables. Everything runs in your browser. No
            account, no server. Progress stays on this device.
          </p>
          <button
            ref={aboutButtonRef}
            type="button"
            className={styles.aboutButton}
            onClick={openAbout}
          >
            <span className={styles.aboutMark} aria-hidden="true">
              ?
            </span>
            What is this?
            {aboutSeen ? null : <span className={styles.newBadge}>Start here</span>}
          </button>
        </section>
        <ul className={styles.grid}>
          {WORLDS.map((meta) => (
            <WorldCard
              key={meta.id}
              meta={meta}
              saveData={saveData}
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
      </div>
      {cardOpen ? (
        <RankCardDialog
          saveData={saveData}
          onClose={() => {
            setCardOpen(false);
          }}
        />
      ) : null}
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
