#!/usr/bin/env node
// Generates the synthetic, CC0 mid-boss dataset for World 1's DOUBLE_TAKE
// case — a signup log with a "double-submit" bug (duplicate rows) stacked
// on top of missing emails, exercising no_nulls + no_duplicates together.
// Deterministic (seeded PRNG).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROW_COUNT = 180;
const DUPLICATE_COUNT = 14;
const NULL_EMAIL_COUNT = 11;

const FIRST_NAMES = ["Ada", "Ravi", "Mei", "Diego", "Fatima", "Noah", "Yuki", "Leila"];
const LAST_NAMES = ["Owusu", "Nakamura", "Silva", "Petrov", "Haddad", "Kowalski"];
const SKUS = ["SKU-1001", "SKU-1042", "SKU-2077", "SKU-3310", "SKU-4488"];

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

const random = mulberry32(0x44424c54); // "DBLT"

function pick(list) {
  return list[Math.floor(random() * list.length)];
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

const startDate = Date.UTC(2026, 1, 1, 9, 0, 0);
const rows = [];

for (let i = 0; i < ROW_COUNT - DUPLICATE_COUNT; i++) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
  rows.push({
    order_id: i + 1,
    customer_email: email,
    item_sku: pick(SKUS),
    quantity: 1 + Math.floor(random() * 4),
    submitted_at: new Date(startDate + i * 17 * 60 * 1000).toISOString(),
  });
}

// Double-submit bug: re-insert exact copies of some earlier rows (with a
// fresh order_id, since that's an auto-increment surrogate key — the
// business-key duplicate is customer_email + item_sku + submitted_at).
const sourceIndices = sampleDistinct(range(0, rows.length - 1), DUPLICATE_COUNT);
let nextOrderId = rows.length + 1;
for (const sourceIndex of sourceIndices) {
  const source = rows[sourceIndex];
  rows.push({ ...source, order_id: nextOrderId });
  nextOrderId++;
}

const nullIndices = sampleDistinct(range(0, rows.length - 1), NULL_EMAIL_COUNT);
for (const index of nullIndices) {
  rows[index].customer_email = "";
}

const header = ["order_id", "customer_email", "item_sku", "quantity", "submitted_at"];
const lines = [header.join(",")];
for (const row of rows) {
  lines.push(header.map((key) => row[key]).join(","));
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(rootDir, "apps/web/public/datasets/world-1/double-take.csv");
writeFileSync(outPath, lines.join("\n") + "\n");

console.log(
  `Wrote ${String(rows.length)} rows (${String(DUPLICATE_COUNT)} duplicate submissions, ${String(NULL_EMAIL_COUNT)} missing emails) to ${outPath}`,
);
