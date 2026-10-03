#!/usr/bin/env node
// Generates the three synthetic, CC0 datasets for World 2 (The Vault):
// pin-tumbler.csv (phone formats), latin-lock.csv (mojibake) and warden.csv
// (emails + phones + mojibake stacked). Deterministic (seeded PRNG). All names,
// numbers and emails are invented; phone numbers use the reserved 555-01xx range.

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
const random = mulberry32(0x5641554c); // "VAUL"
const pick = (list) => list[Math.floor(random() * list.length)];
const int = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));

const FIRST = [
  "José",
  "Renée",
  "Zoë",
  "Søren",
  "Amélie",
  "Núria",
  "Mateo",
  "Priya",
  "Chen",
  "Aiko",
  "Omar",
  "Lucía",
  "Bjørn",
  "Sofia",
  "Noah",
  "Élodie",
];
const LAST = [
  "Müller",
  "García",
  "Dubois",
  "Okafor",
  "Ibáñez",
  "Nguyen",
  "Kowalski",
  "Fernández",
  "Lindqvist",
  "Haddad",
  "Çelik",
  "Rossi",
  "O'Brien",
  "Silva",
];
const CITIES = [
  "São Paulo",
  "Zürich",
  "Montréal",
  "Málaga",
  "Köln",
  "Göteborg",
  "Reykjavík",
  "Austin",
  "Denver",
  "Leeds",
];
const AREA = ["415", "212", "303", "512", "206", "617", "312"];
const DOMAINS = [
  "example.com",
  "mail.example.org",
  "corp.example.net",
  "post.example.io",
];
const COMMENTS = [
  "Called back",
  "Left voicemail",
  "Prefers email",
  "Needs invoice copy",
  "Café order",
  "Résumé attached",
  "No answer",
];

const MOJIBAKE = {
  é: "Ã©",
  è: "Ã¨",
  ñ: "Ã±",
  ü: "Ã¼",
  ö: "Ã¶",
  ç: "Ã§",
  ë: "Ã«",
  á: "Ã¡",
  í: "Ã­",
  ø: "Ã¸",
  ä: "Ã¤",
  É: "Ã‰",
  Ç: "Ã‡",
  ú: "Ãº",
  "’": "â€™",
};
function garble(text) {
  return [...text].map((ch) => MOJIBAKE[ch] ?? ch).join("");
}
function maybeGarble(text, rate) {
  return random() < rate ? garble(text) : text;
}

function phoneParts() {
  return {
    area: pick(AREA),
    mid: "555",
    last: `01${String(int(0, 99)).padStart(2, "0")}`,
  };
}
function messyPhone(p) {
  const digits = p.area + p.mid + p.last;
  switch (int(0, 6)) {
    case 0:
      return `(${p.area}) ${p.mid}-${p.last}`;
    case 1:
      return `${p.area}.${p.mid}.${p.last}`;
    case 2:
      return `+1 ${p.area} ${p.mid} ${p.last}`;
    case 3:
      return digits;
    case 4:
      return `1-${p.area}-${p.mid}-${p.last}`;
    case 5:
      return ` ${p.area}-${p.mid}-${p.last} `;
    default:
      return `${p.area}-${p.mid}-${p.last}`;
  }
}

function messyEmail(email) {
  switch (int(0, 4)) {
    case 0:
      return `  ${email}  `;
    case 1:
      return `Contact: ${email.toUpperCase()}`;
    case 2:
      return `<${email}>`;
    case 3:
      return email.replace(/^./, (c) => c.toUpperCase());
    default:
      return email;
  }
}

function csvCell(value) {
  const s = String(value);
  return /[",\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
function toCsv(columns, rows) {
  return (
    [
      columns.join(","),
      ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")),
    ].join("\n") + "\n"
  );
}

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/datasets/world-2",
);
mkdirSync(outDir, { recursive: true });

// 1. pin-tumbler: phone formats
{
  const rows = [];
  for (let i = 1; i <= 150; i++) {
    const p = phoneParts();
    rows.push({
      contact_id: i,
      name: `${pick(FIRST)} ${pick(LAST)}`.normalize("NFC"),
      phone: messyPhone(p),
      city: pick(CITIES),
    });
  }
  writeFileSync(
    join(outDir, "pin-tumbler.csv"),
    toCsv(["contact_id", "name", "phone", "city"], rows),
  );
}

// 2. latin-lock: mojibake
{
  const rows = [];
  for (let i = 1; i <= 160; i++) {
    rows.push({
      customer_id: i,
      customer: maybeGarble(`${pick(FIRST)} ${pick(LAST)}`, 0.4),
      city: maybeGarble(pick(CITIES), 0.35),
      comment: maybeGarble(pick(COMMENTS), 0.2),
    });
  }
  writeFileSync(
    join(outDir, "latin-lock.csv"),
    toCsv(["customer_id", "customer", "city", "comment"], rows),
  );
}

// 3. warden: all three stacked
{
  const rows = [];
  for (let i = 1; i <= 180; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const ascii = (s) => s.normalize("NFD").replace(/[^\w]/g, "").toLowerCase();
    const email = `${ascii(first)}.${ascii(last)}${int(1, 99)}@${pick(DOMAINS)}`;
    rows.push({
      member_id: i,
      name: maybeGarble(`${first} ${last}`, 0.4),
      email: messyEmail(email),
      phone: messyPhone(phoneParts()),
    });
  }
  writeFileSync(
    join(outDir, "warden.csv"),
    toCsv(["member_id", "name", "email", "phone"], rows),
  );
}
console.log("wrote World 2 datasets to", outDir);
