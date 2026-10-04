import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { buildRankCard, rankCardText } from "../../lib/rank-card";
import type { SaveData } from "../../lib/save";
import { CARD_HEIGHT, CARD_WIDTH, drawRankCard } from "./drawRankCard";
import styles from "./RankCardDialog.module.css";

export interface RankCardDialogProps {
  saveData: SaveData;
  onClose: () => void;
}

const FOCUSABLE =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

/** A shareable summary of progress: a PNG drawn locally and a text version. Nothing leaves the device. */
export default function RankCardDialog({ saveData, onClose }: RankCardDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const card = useMemo(() => buildRankCard(saveData), [saveData]);
  const text = useMemo(() => rankCardText(card), [card]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawRankCard(ctx, card);
  }, [card]);

  function download(): void {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) {
        setStatus("Could not make the image in this browser. Copy the text instead.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "data-cleaning-quest-progress.png";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Image saved.");
    }, "image/png");
  }

  function copy(): void {
    navigator.clipboard.writeText(text).then(
      () => {
        setStatus("Copied.");
      },
      () => {
        setStatus("Copy was blocked. Select the text below and copy it by hand.");
      },
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rank-card-title"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 id="rank-card-title" className={styles.title}>
            Share your progress
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className={styles.body}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            role="img"
            aria-label={text}
          />
          <p className={styles.note}>
            Made on this device from your saved progress. It holds no name or account, and
            nothing is uploaded.
          </p>
          <pre className={styles.text} tabIndex={0} aria-label="Progress as text">
            {text}
          </pre>
        </div>
        <div className={styles.footer}>
          <span className={styles.status} role="status">
            {status}
          </span>
          <button type="button" className={styles.secondary} onClick={copy}>
            Copy text
          </button>
          <button type="button" className={styles.primary} onClick={download}>
            Download image
          </button>
        </div>
      </div>
    </div>
  );
}
