#!/usr/bin/env node
// Generates the synthetic, CC0 datasets for World 4 (The Architect): tables that
// need reshaping. Deterministic (seeded PRNG). Everything invented.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
const random = mulberry32(0x41524348); // "ARCH"
const pick = (list) => list[Math.floor(random() * list.length)];
const int = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));

const csvCell = (v) => {
  const s = String(v);
  return /[",\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const toCsv = (cols, rows) =>
  [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join(
    "\n",
  ) + "\n";
const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/datasets/world-4",
);
mkdirSync(outDir, { recursive: true });
const sums = {};

const PRODUCTS = [
  "Notebook",
  "Desk Lamp",
  "Keyboard",
  "Monitor Arm",
  "Webcam",
  "Headset",
  "Cable Kit",
  "Chair Mat",
  "Mouse Pad",
  "USB Hub",
  "Stand",
  "Dock",
];
const STORES = [
  "Austin",
  "Denver",
  "Leeds",
  "Lyon",
  "Porto",
  "Osaka",
  "Lagos",
  "Quito",
  "Oslo",
  "Kyoto",
];
const NAMES = [
  "Ana Silva",
  "Ben Okafor",
  "Chen Wu",
  "Dara Nguyen",
  "Eli Cohen",
  "Fay Larsen",
  "Gus Patel",
  "Hana Kim",
  "Ivo Rossi",
  "Jo Mendes",
];
const REGIONS = [
  "North",
  "South",
  "East",
  "West",
  "Central",
  "Coastal",
  "Highland",
  "Lakes",
  "Islands",
  "Plains",
  "Delta",
  "Valley",
  "Ridge",
  "Bay",
  "Prairie",
  "Forest",
];
const CHANNELS = ["web", "retail", "partner"];
const MANAGERS = ["Kim", "Okafor", "Silva", "Cohen", "Nguyen"];

// 1. melt-form: wide months -> long
{
  const rows = PRODUCTS.map((product) => ({
    product,
    jan: int(100, 999),
    feb: int(100, 999),
    mar: int(100, 999),
  }));
  sums.meltForm = rows.reduce((s, r) => s + r.jan + r.feb + r.mar, 0);
  writeFileSync(
    join(outDir, "melt-form.csv"),
    toCsv(["product", "jan", "feb", "mar"], rows),
  );
}
// 2. pivot-plan: long -> wide
{
  const rows = [];
  const totals = { jan: 0, feb: 0, mar: 0 };
  for (const store of STORES) {
    for (const month of ["jan", "feb", "mar"]) {
      const revenue = int(100000, 999999) / 100;
      totals[month] += revenue;
      rows.push({ store, month, revenue: revenue.toFixed(2) });
    }
  }
  sums.pivotPlan = Object.fromEntries(
    Object.entries(totals).map(([k, v]) => [k, Math.round(v * 100) / 100]),
  );
  writeFileSync(
    join(outDir, "pivot-plan.csv"),
    toCsv(["store", "month", "revenue"], rows),
  );
}
// 3. json-vault: JSON in a column -> flat columns
{
  const rows = [];
  let total = 0;
  for (let i = 1; i <= 80; i++) {
    const t = int(500, 49900) / 100;
    total += t;
    rows.push({
      order_id: 5000 + i,
      payload: JSON.stringify({
        customer: { id: int(1, 40), name: pick(NAMES) },
        total: Number(t.toFixed(2)),
      }),
    });
  }
  sums.jsonVault = Math.round(total * 100) / 100;
  writeFileSync(join(outDir, "json-vault.csv"), toCsv(["order_id", "payload"], rows));
}
// 4. the-architect: JSON metadata + wide quarters -> flat and long
{
  const rows = REGIONS.map((region, i) => ({
    id: i + 1,
    region,
    meta: JSON.stringify({ channel: pick(CHANNELS), manager: pick(MANAGERS) }),
    q1: int(1000, 9000),
    q2: int(1000, 9000),
    q3: int(1000, 9000),
    q4: int(1000, 9000),
  }));
  sums.architect = rows.reduce((s, r) => s + r.q1 + r.q2 + r.q3 + r.q4, 0);
  writeFileSync(
    join(outDir, "the-architect.csv"),
    toCsv(["id", "region", "meta", "q1", "q2", "q3", "q4"], rows),
  );
}
// The checksums below are copied into each case's column_sum predicate.
console.log("wrote World 4 datasets to", outDir, sums);
