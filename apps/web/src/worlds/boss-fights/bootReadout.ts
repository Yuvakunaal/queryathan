import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition, WorldId } from "@dcq/content-schema";
import {
  afflictionCellMap,
  isWholeTable,
  predicateDebt,
  predicateKindOrder,
} from "../../lib/affliction-cells";
import type { AfflictionKind } from "../../lib/affliction-cells";
import { SCAN_CODE } from "./afflictionPresentation";

const SHAPE_CODE: Partial<Record<WorldId, string>> = {
  "the-twins": "LINK",
  "the-architect": "SHAPE",
  "the-foundry": "SPEED",
  "the-observatory": "ANSWER",
  "the-labyrinth": "ANSWER",
  "the-timekeeper": "ANSWER",
  "the-laboratory": "ANSWER",
};

const pad = (n: number): string => String(n).padStart(3, "0");

/**
 * The two phrases of the boot sequence's "scanning" line: what is being
 * scanned for, and what was found. Cell problems are counted as cells,
 * whole-table rules (a join, a reshape, a time limit, an expected answer) as
 * checks, so no world claims to have found "cells" that are not there.
 */
export function bootReadout(
  grid: ResultGrid,
  winCondition: WinCondition,
  world: WorldId,
): { scanLabel: string; detected: string | undefined } {
  const code = (kind: AfflictionKind): string =>
    kind === "shape" ? (SHAPE_CODE[world] ?? "SHAPE") : SCAN_CODE[kind];
  const scanLabel = predicateKindOrder(winCondition).map(code).join("+");
  const wholeTable = winCondition.all.filter(isWholeTable);
  if (wholeTable.length === 0) return { scanLabel, detected: undefined };
  const checks = wholeTable.filter((p) => predicateDebt(grid, p) > 0).length;
  const cells = afflictionCellMap(grid, winCondition).size;
  const checkText = `${pad(checks)} ${checks === 1 ? "CHECK" : "CHECKS"}`;
  return {
    scanLabel,
    detected: cells === 0 ? `${checkText}  TO PASS` : `${pad(cells)} CELLS  ${checkText}`,
  };
}
