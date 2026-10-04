import { readStored, removeStored, writeStored } from "./safeStorage";

/**
 * The code a player has typed for a case, kept on this device so a reload, the
 * browser's Back button or a slip of the mouse never costs them their work. One
 * draft per case and engine. A draft equal to the starting code is not kept.
 */
const keyFor = (caseId: string, engine: string): string =>
  `dcq.draft.${caseId}.${engine}`;

export function readDraft(caseId: string, engine: string): string | null {
  return readStored(keyFor(caseId, engine));
}

export function writeDraft(
  caseId: string,
  engine: string,
  value: string,
  starter: string,
): void {
  if (value === starter || value.trim() === "") removeStored(keyFor(caseId, engine));
  else writeStored(keyFor(caseId, engine), value);
}
