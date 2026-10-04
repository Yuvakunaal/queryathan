import type { RankCardModel } from "../../lib/rank-card";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

// Fixed colors on purpose: the image looks the same wherever it is shared,
// whatever theme the player is using.
const INK = "#0b0f0d";
const PANEL = "#121815";
const RULE = "#2b3a32";
const TEXT = "#e7efe9";
const DIM = "#a3b3a9";
const GREEN = "#4ade80";
const MONO = '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
const SANS = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Paints the shareable progress card. Pure drawing: the numbers come from the model. */
export function drawRankCard(ctx: CanvasRenderingContext2D, card: RankCardModel): void {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, CARD_WIDTH - 48, CARD_HEIGHT - 48);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = GREEN;
  ctx.font = `700 26px ${MONO}`;
  ctx.fillText(">_ Data Cleaning Quest", 64, 96);

  ctx.fillStyle = TEXT;
  ctx.font = `700 64px ${SANS}`;
  ctx.fillText(card.totalCleared > 0 ? card.headline : "Just getting started", 64, 180);

  ctx.fillStyle = DIM;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(
    `${String(card.totalCleared)} cases cleared  ·  ${String(card.totalXp)} XP`,
    64,
    230,
  );

  const rowHeight = 62;
  const top = 276;
  card.worlds.forEach((world, index) => {
    const y = top + index * rowHeight;
    ctx.fillStyle = PANEL;
    ctx.fillRect(64, y, CARD_WIDTH - 128, rowHeight - 10);
    ctx.fillStyle = TEXT;
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText(world.name, 84, y + 36);
    ctx.fillStyle = world.cleared > 0 ? GREEN : DIM;
    ctx.font = `600 24px ${MONO}`;
    ctx.fillText(world.rank, 430, y + 36);
    ctx.fillStyle = DIM;
    ctx.font = `400 24px ${SANS}`;
    const detail =
      world.cleared > 0
        ? `${String(world.cleared)} cleared${world.goldStamps > 0 ? `  ·  ${String(world.goldStamps)} gold` : ""}`
        : "";
    const width = ctx.measureText(detail).width;
    ctx.fillText(detail, CARD_WIDTH - 84 - width, y + 36);
  });

  ctx.fillStyle = DIM;
  ctx.font = `400 20px ${MONO}`;
  ctx.fillText("Real pandas and SQL, in your browser.", 64, CARD_HEIGHT - 52);
}
