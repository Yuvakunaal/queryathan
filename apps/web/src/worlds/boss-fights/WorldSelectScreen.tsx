import { WORLDS } from "../../lib/world-meta";
import type { WorldMeta } from "../../lib/world-meta";
import { getWorldProgress, rankForWorld } from "../../lib/save";
import type { SaveData } from "../../lib/save";
import type { A11yState } from "../../lib/a11y";
import type { WorldId } from "@dcq/content-schema";
import { classNames } from "../../lib/classNames";
import A11yControls from "./A11yControls";
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

export default function WorldSelectScreen({
  saveData,
  a11y,
  onA11yChange,
  onSelectWorld,
  onOpenSandbox,
}: WorldSelectScreenProps) {
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
          <A11yControls a11y={a11y} onChange={onA11yChange} />
        </header>
        <section className={styles.hero}>
          <h1 className={styles.heading}>Fight your data clean.</h1>
          <p className={styles.lede}>
            Learn real pandas and SQL on messy tables. Everything runs in your browser. No
            account, no server. Progress stays on this device.
          </p>
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
    </div>
  );
}
