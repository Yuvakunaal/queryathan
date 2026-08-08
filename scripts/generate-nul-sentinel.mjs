#!/usr/bin/env node
// Generates the synthetic, CC0 tutorial-boss dataset for World 1 — 240 rows,
// 23 nulls in temp_c only, clustered per docs/design/world-1-visual-spec.md
// §0 so the HP heatmap strip has something informative to show. Deterministic
// (seeded PRNG) so re-running this script reproduces the identical CSV.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROW_COUNT = 240;
const STATIONS = ["ST-04", "ST-11", "ST-07", "ST-19", "ST-02", "ST-15"];
const OPERATORS = ["J.OKAFOR", "A.SINGH", "M.DIALLO", "R.CHEN", "P.NUNES"];

// mulberry32 — small, seedable, deterministic across Node versions/platforms.
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(0x4e554c53); // "NULS"

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function chooseNullRows() {
  const clusterA = range(40, 58); // 19 rows -> 9 nulls
  const clusterB = range(121, 133); // 13 rows -> 6 nulls
  const clustered = new Set([...clusterA, ...clusterB]);
  const remainder = range(0, ROW_COUNT - 1).filter((i) => !clustered.has(i));

  const nullRows = new Set([
    ...sampleDistinct(clusterA, 9),
    ...sampleDistinct(clusterB, 6),
    ...sampleDistinct(remainder, 8),
  ]);

  if (nullRows.size !== 23) {
    throw new Error(`Expected exactly 23 null rows, got ${String(nullRows.size)}`);
  }
  return nullRows;
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function sampleDistinct(pool, count) {
  const copy = [...pool];
  const picked = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(random() * copy.length);
    picked.push(copy[index]);
    copy.splice(index, 1);
  }
  return picked;
}

const nullRows = chooseNullRows();

const header = ["reading_id", "station", "captured_at", "temp_c", "humidity", "operator"];
const lines = [header.join(",")];

const startDate = Date.UTC(2026, 0, 1, 0, 0, 0);

for (let i = 0; i < ROW_COUNT; i++) {
  const readingId = i + 1;
  const station = pick(STATIONS);
  const capturedAt = new Date(startDate + i * 60 * 60 * 1000).toISOString();
  const tempC = nullRows.has(i) ? "" : (random() * 40 - 5).toFixed(1);
  const humidity = 20 + Math.floor(random() * 76);
  const operator = pick(OPERATORS);

  lines.push([readingId, station, capturedAt, tempC, humidity, operator].join(","));
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(rootDir, "apps/web/public/datasets/world-1/nul-sentinel.csv");
writeFileSync(outPath, lines.join("\n") + "\n");

console.log(
  `Wrote ${String(ROW_COUNT)} rows (${String(nullRows.size)} nulls in temp_c) to ${outPath}`,
);
