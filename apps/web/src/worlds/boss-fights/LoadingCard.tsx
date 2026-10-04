import styles from "./LoadingCard.module.css";

export interface LoadingCardProps {
  title: string;
  text: string;
}

/** A centred, themed wait screen with an indeterminate bar, so a few seconds of loading reads as progress and not as a stall. */
export default function LoadingCard({ title, text }: LoadingCardProps) {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.bar} aria-hidden="true">
          <span className={styles.fill} />
        </div>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
}
