#!/usr/bin/env node
// Generates the synthetic, CC0 final-boss dataset for World 1's
// THE_RECKONING case — a support-ticket export combining all 6 of World 1's
// affliction types at once (nulls, duplicates, whitespace, casing, wrong
// dtype, outliers), including a deliberate real-world sequencing trap: the
// same column (first_response_hours) needs its dtype fixed BEFORE its nulls
// and outliers can be addressed. Deterministic (seeded PRNG).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROW_COUNT = 500;
const DUPLICATE_COUNT = 22;
const NULL_EMAIL_COUNT = 17;
const WHITESPACE_EMAIL_COUNT = 14;
const CASING_COUNT = 30;
const GARBAGE_RESPONSE_COUNT = 24;
const EMPTY_RESPONSE_COUNT = 16;
const OUTLIER_RESPONSE_COUNT = 9;

const FIRST_NAMES = [
  "Ada",
  "Ravi",
  "Mei",
  "Diego",
  "Fatima",
  "Noah",
  "Yuki",
  "Leila",
  "Tomas",
  "Aaliyah",
];
const LAST_NAMES = [
  "Owusu",
  "Nakamura",
  "Silva",
  "Petrov",
  "Haddad",
  "Kowalski",
  "Ibrahim",
  "Torres",
];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "pending", "closed"];
const GARBAGE_RESPONSE_VALUES = ["pending", "N/A", "TBD", "n/a", "--"];

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

const random = mulberry32(0x52434b4e); // "RCKN"

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

function titleCaseRandomVariant(value) {
  // "closed" -> "Closed" or "CLOSED" — never the already-lowercase form.
  return random() < 0.5 ? value.toUpperCase() : value[0].toUpperCase() + value.slice(1);
}

const startDate = Date.UTC(2026, 0, 5, 8, 0, 0);
const rows = [];

for (let i = 0; i < ROW_COUNT - DUPLICATE_COUNT; i++) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  rows.push({
    ticket_id: 100000 + i,
    customer_email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    priority: pick(PRIORITIES),
    status: pick(STATUSES),
    opened_at: new Date(startDate + i * 41 * 60 * 1000).toISOString(),
    first_response_hours: (random() * 47 + 0.5).toFixed(1),
  });
}

// Sync bug: a handful of tickets got re-exported as exact duplicate rows,
// same ticket_id and all — an idempotency failure, not new tickets.
for (const sourceIndex of sampleDistinct(range(0, rows.length - 1), DUPLICATE_COUNT)) {
  rows.push({ ...rows[sourceIndex] });
}

for (const index of sampleDistinct(range(0, rows.length - 1), NULL_EMAIL_COUNT)) {
  rows[index].customer_email = "";
}

const nonNullEmailIndices = range(0, rows.length - 1).filter(
  (i) => rows[i].customer_email !== "",
);
for (const index of sampleDistinct(nonNullEmailIndices, WHITESPACE_EMAIL_COUNT)) {
  rows[index].customer_email =
    random() < 0.5 ? ` ${rows[index].customer_email}` : `${rows[index].customer_email} `;
}

for (const index of sampleDistinct(range(0, rows.length - 1), CASING_COUNT)) {
  rows[index].status = titleCaseRandomVariant(rows[index].status);
}

// first_response_hours: three independent kinds of damage on one column —
// garbage text (forces object dtype), genuinely empty cells (already-null),
// and a few absurd-but-numeric outliers among the otherwise-clean values.
// A correct fix must cast to numeric BEFORE nulls/outliers can be handled.
const responsePool = range(0, rows.length - 1);
const garbageIndices = sampleDistinct(responsePool, GARBAGE_RESPONSE_COUNT);
for (const index of garbageIndices) {
  rows[index].first_response_hours = pick(GARBAGE_RESPONSE_VALUES);
}
const remainingPool = responsePool.filter((i) => !garbageIndices.includes(i));
const emptyIndices = sampleDistinct(remainingPool, EMPTY_RESPONSE_COUNT);
for (const index of emptyIndices) {
  rows[index].first_response_hours = "";
}
const outlierPool = remainingPool.filter((i) => !emptyIndices.includes(i));
for (const index of sampleDistinct(outlierPool, OUTLIER_RESPONSE_COUNT)) {
  rows[index].first_response_hours = random() < 0.5 ? "612.0" : "-4.0";
}

const header = [
  "ticket_id",
  "customer_email",
  "priority",
  "status",
  "opened_at",
  "first_response_hours",
];
const lines = [header.join(",")];
for (const row of rows) {
  lines.push(header.map((key) => row[key]).join(","));
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(rootDir, "apps/web/public/datasets/world-1/the-reckoning.csv");
writeFileSync(outPath, lines.join("\n") + "\n");

console.log(
  `Wrote ${String(rows.length)} rows to ${outPath}\n` +
    `  duplicates=${String(DUPLICATE_COUNT)} null_emails=${String(NULL_EMAIL_COUNT)} whitespace_emails=${String(WHITESPACE_EMAIL_COUNT)}\n` +
    `  casing=${String(CASING_COUNT)} garbage_response=${String(GARBAGE_RESPONSE_COUNT)} empty_response=${String(EMPTY_RESPONSE_COUNT)} outlier_response=${String(OUTLIER_RESPONSE_COUNT)}`,
);
