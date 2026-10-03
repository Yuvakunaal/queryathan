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
// 4. host-lock: URLs down to bare hostnames
{
  const HOSTS = [
    "example.com",
    "shop.example.net",
    "blog.example.org",
    "example.io",
    "docs.example.co.uk",
  ];
  const PATHS = ["", "/", "/shop?id=4", "/post/12", "/about", "/docs/start#intro"];
  const rows = [];
  for (let i = 1; i <= 140; i++) {
    const host = pick(HOSTS);
    const shape = int(0, 5);
    let site;
    if (shape === 0) site = `https://www.${host}${pick(PATHS)}`;
    else if (shape === 1) site = `http://${host}${pick(PATHS)}`;
    else if (shape === 2) site = `HTTPS://WWW.${host.toUpperCase()}`;
    else if (shape === 3) site = `${host}${pick(PATHS)}`;
    else if (shape === 4) site = `https://${host}:8080${pick(PATHS)}`;
    else site = `www.${host}`;
    rows.push({
      visit_id: i,
      visitor: `${pick(FIRST)} ${pick(LAST)}`.normalize("NFC"),
      site,
      visits: int(1, 40),
    });
  }
  writeFileSync(
    join(outDir, "host-lock.csv"),
    toCsv(["visit_id", "visitor", "site", "visits"], rows),
  );
}

// 5. serial-lock: invoice ids buried in text, plus a messy status column
{
  const STATUS = ["paid", "pending", "overdue"];
  const rows = [];
  for (let i = 1; i <= 150; i++) {
    const id = String(int(10000, 99999));
    const forms = [
      `Invoice INV-${id} paid`,
      `inv-${id}`,
      `#INV-${id} (late)`,
      `Re: Inv-${id} reminder sent`,
      `INV-${id}`,
      `see invoice inv-${id}, thanks`,
    ];
    const status = pick(STATUS);
    const shape = int(0, 3);
    rows.push({
      row_id: i,
      ref: pick(forms),
      status:
        shape === 0
          ? status.toUpperCase()
          : shape === 1
            ? ` ${status} `
            : shape === 2
              ? status.replace(/^./, (c) => c.toUpperCase())
              : status,
      amount: (int(2000, 90000) / 100).toFixed(2),
    });
  }
  writeFileSync(
    join(outDir, "serial-lock.csv"),
    toCsv(["row_id", "ref", "status", "amount"], rows),
  );
}
console.log("wrote World 2 datasets to", outDir);
