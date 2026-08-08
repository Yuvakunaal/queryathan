#!/usr/bin/env node
// Generates the synthetic, CC0 mid-boss dataset for World 1's CASE_SHIFT
// case — a product catalog merged from multiple vendor feeds, exercising
// no_whitespace + consistent_casing + valid_dtype together (3 stacked
// afflictions). Deterministic (seeded PRNG).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROW_COUNT = 200;
const WHITESPACE_COUNT = 16;
const CASING_COUNT = 18;
const BAD_QUANTITY_COUNT = 13;

const PRODUCT_NAMES = [
  "Wireless Mouse",
  "USB-C Hub",
  "Mechanical Keyboard",
  "Monitor Stand",
  "Desk Lamp",
  "Webcam",
  "Laptop Sleeve",
  "Cable Organizer",
];
const CATEGORIES = ["ELECTRONICS", "ACCESSORIES", "OFFICE", "PERIPHERALS"];

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

const random = mulberry32(0x43415345); // "CASE"

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

function lowerCaseRandomly(value) {
  return random() < 0.5 ? value.toLowerCase() : value[0] + value.slice(1).toLowerCase();
}

const startDate = Date.UTC(2026, 2, 1, 0, 0, 0);
const rows = [];

for (let i = 0; i < ROW_COUNT; i++) {
  rows.push({
    sku: `SKU-${String(1000 + i)}`,
    product_name: pick(PRODUCT_NAMES),
    category: pick(CATEGORIES),
    quantity: String(5 + Math.floor(random() * 200)),
    updated_at: new Date(startDate + i * 3600 * 1000).toISOString(),
  });
}

for (const index of sampleDistinct(range(0, ROW_COUNT - 1), WHITESPACE_COUNT)) {
  const row = rows[index];
  row.sku = random() < 0.5 ? ` ${row.sku}` : `${row.sku} `;
}

for (const index of sampleDistinct(range(0, ROW_COUNT - 1), CASING_COUNT)) {
  rows[index].category = lowerCaseRandomly(rows[index].category);
}

// A vendor feed reported quantity as free text for some rows ("out of
// stock", "12 units") instead of a clean integer, so the whole column
// comes in as pandas dtype object instead of int64 — a wrong-dtype
// affliction is a whole-column property, not a single bad cell.
const NON_NUMERIC_QUANTITY = ["out of stock", "TBD", "12 units", "n/a"];
for (const index of sampleDistinct(range(0, ROW_COUNT - 1), BAD_QUANTITY_COUNT)) {
  rows[index].quantity = pick(NON_NUMERIC_QUANTITY);
}

function csvField(value) {
  return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
}

const header = ["sku", "product_name", "category", "quantity", "updated_at"];
const lines = [header.join(",")];
for (const row of rows) {
  lines.push(header.map((key) => csvField(row[key])).join(","));
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(rootDir, "apps/web/public/datasets/world-1/case-shift.csv");
writeFileSync(outPath, lines.join("\n") + "\n");

console.log(
  `Wrote ${String(ROW_COUNT)} rows (${String(WHITESPACE_COUNT)} whitespace SKUs, ${String(CASING_COUNT)} casing violations, ${String(BAD_QUANTITY_COUNT)} non-numeric quantities) to ${outPath}`,
);
