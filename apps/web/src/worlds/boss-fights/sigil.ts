/**
 * The decaying ASCII sigil (spec §9) — a 13x6 frame whose interior fill
 * character steps down a density ramp as the affliction clears. ASCII only
 * (U+0020-U+007E), so it renders identically in every monospace fallback.
 */

const SIGIL_TEMPLATE = [
  "+===========+",
  "| ##     ## |",
  "|           |",
  "|  #######  |",
  "+===========+",
];

function fillCharForRatio(ratio: number): string {
  if (ratio > 0.75) return "#";
  if (ratio > 0.5) return "=";
  if (ratio > 0.25) return ":";
  if (ratio > 0) return ".";
  return " ";
}

export function renderSigil(remaining: number, initial: number): string {
  const ratio = initial > 0 ? remaining / initial : 0;
  const fillChar = fillCharForRatio(ratio);
  return SIGIL_TEMPLATE.map((line) => line.replaceAll("#", fillChar)).join("\n");
}
