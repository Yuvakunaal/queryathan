#!/usr/bin/env node
// Generates the synthetic, CC0 datasets for World 3 (The Twins): an orders table
// and a customers table per case. Deterministic (seeded PRNG). Everything invented.

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
const random = mulberry32(0x5457494e); // "TWIN"
const pick = (list) => list[Math.floor(random() * list.length)];
const int = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));

const FIRST = [
  "Ava",
  "Liam",
  "Mia",
  "Noah",
  "Zara",
  "Omar",
  "Priya",
  "Chen",
  "Aiko",
  "Lucia",
  "Sven",
  "Nia",
  "Ravi",
  "Elif",
  "Tomas",
];
const LAST = [
  "Stone",
  "Okafor",
  "Silva",
  "Nguyen",
  "Haddad",
  "Rossi",
  "Kim",
  "Larsen",
  "Mendes",
  "Cohen",
  "Dubois",
  "Patel",
];
const CITIES = ["Austin", "Denver", "Leeds", "Lyon", "Porto", "Osaka", "Lagos", "Quito"];
const ITEMS = [
  "Notebook",
  "Desk Lamp",
  "Keyboard",
  "Monitor Arm",
  "Webcam",
  "Headset",
  "Cable Kit",
  "Chair Mat",
];

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
  "../apps/web/public/datasets/world-3",
);
mkdirSync(outDir, { recursive: true });

const id = (n) => `C-${String(n).padStart(3, "0")}`;
function makeCustomers(count) {
  return Array.from({ length: count }, (_, i) => ({
    customer_id: id(i + 1),
    customer_name: `${pick(FIRST)} ${pick(LAST)}`,
    city: pick(CITIES),
  }));
}
function makeOrders(count, customerIds, mess) {
  return Array.from({ length: count }, (_, i) => ({
    order_id: 1000 + i,
    customer_id: mess(pick(customerIds)),
    item: pick(ITEMS),
    amount: (int(900, 24900) / 100).toFixed(2),
  }));
}
const messKey = (key) => {
  switch (int(0, 3)) {
    case 0:
      return ` ${key} `;
    case 1:
      return key.toLowerCase();
    case 2:
      return `${key} `;
    default:
      return key;
  }
};
const ORDER_COLS = ["order_id", "customer_id", "item", "amount"];
const CUSTOMER_COLS = ["customer_id", "customer_name", "city"];

// 1. key-mirror: clean keys, every order has a customer
{
  const customers = makeCustomers(40);
  const orders = makeOrders(
    120,
    customers.map((c) => c.customer_id),
    (k) => k,
  );
  writeFileSync(join(outDir, "key-mirror-orders.csv"), toCsv(ORDER_COLS, orders));
  writeFileSync(
    join(outDir, "key-mirror-customers.csv"),
    toCsv(CUSTOMER_COLS, customers),
  );
}

// 2. ghost-twin: the order keys carry stray spaces and mixed case
{
  const customers = makeCustomers(45);
  const orders = makeOrders(
    130,
    customers.map((c) => c.customer_id),
    messKey,
  );
  writeFileSync(join(outDir, "ghost-twin-orders.csv"), toCsv(ORDER_COLS, orders));
  writeFileSync(
    join(outDir, "ghost-twin-customers.csv"),
    toCsv(CUSTOMER_COLS, customers),
  );
}

// 3. double-vision: 12 customers are listed twice, so a naive join multiplies orders
{
  const customers = makeCustomers(40);
  const orders = makeOrders(
    120,
    customers.map((c) => c.customer_id),
    (k) => k,
  );
  const duplicated = [...customers];
  for (let i = 0; i < 12; i++)
    duplicated.splice(
      int(0, duplicated.length),
      0,
      customers[int(0, customers.length - 1)],
    );
  writeFileSync(join(outDir, "double-vision-orders.csv"), toCsv(ORDER_COLS, orders));
  writeFileSync(
    join(outDir, "double-vision-customers.csv"),
    toCsv(CUSTOMER_COLS, duplicated),
  );
}

// 4. the-twins: messy keys + duplicated customers + 9 orders whose customer does not exist
{
  const customers = makeCustomers(50);
  const known = customers.map((c) => c.customer_id);
  const orders = makeOrders(150, known, messKey);
  for (let i = 0; i < 9; i++) orders[int(0, orders.length - 1)].customer_id = id(900 + i);
  const duplicated = [...customers];
  for (let i = 0; i < 10; i++)
    duplicated.splice(
      int(0, duplicated.length),
      0,
      customers[int(0, customers.length - 1)],
    );
  writeFileSync(join(outDir, "the-twins-orders.csv"), toCsv(ORDER_COLS, orders));
  writeFileSync(
    join(outDir, "the-twins-customers.csv"),
    toCsv(CUSTOMER_COLS, duplicated),
  );
}
console.log("wrote World 3 datasets to", outDir);
