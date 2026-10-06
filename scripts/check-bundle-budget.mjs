#!/usr/bin/env node
// Fails when a chunk of the production build grows past its budget, or when heavy code lands on
// the home page. Run after `pnpm build`. Sizes are gzip (what travels over the network), so the
// numbers do not depend on the machine. The budgets sit a little above today's sizes: raise one
// deliberately, in the same commit as the change that needs it.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = join(dirname(fileURLToPath(import.meta.url)), "../apps/web/dist");
const assets = join(dist, "assets");
const files = readdirSync(assets).filter((f) => f.endsWith(".js"));
const kb = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
const gz = (file) => gzipSync(readFileSync(join(assets, file))).length;

/** The chunk whose file name starts with `name-` (the hash follows). */
function chunk(name) {
  const found = files.filter((f) => f.startsWith(`${name}-`));
  if (found.length !== 1)
    throw new Error(`expected one ${name} chunk, found ${found.length}`);
  return found[0];
}

// What the home page loads: every script the HTML links.
const html = readFileSync(join(dist, "index.html"), "utf8");
const homeFiles = [...html.matchAll(/assets\/([^"']+\.js)/g)].map((m) => m[1]);

const budgets = [
  ["home page (all linked scripts)", homeFiles, 115_000],
  ["fight screen", [chunk("BossFightScreen")], 60_000],
  ["code editor (CodeMirror)", [chunk("CodeEditor")], 185_000],
  ["tips dialog", [chunk("TipsDialog")], 6_000],
  ["csv import worker", [chunk("csv-import.worker")], 5_000],
  ["sql engine worker", [chunk("sqlite.worker")], 25_000],
  ["python engine worker", [chunk("pyodide.worker")], 12_000],
];

let failed = false;
for (const [label, list, limit] of budgets) {
  const size = list.reduce((sum, f) => sum + gz(f), 0);
  const ok = size <= limit;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${kb(size)} (budget ${kb(limit)})`);
}

// The home page must not carry the editor, the SQL formatter or an engine.
const heavy = [
  ["the code editor", "cm-editor"],
  ["the SQL formatter", "nearley"],
  ["the Python runtime loader", "pyodide.asm"],
];
for (const file of homeFiles) {
  const text = readFileSync(join(assets, file), "utf8");
  for (const [what, marker] of heavy) {
    if (text.includes(marker)) {
      failed = true;
      console.log(`FAIL ${file} (on the home page) contains ${what}`);
    }
  }
}

process.exit(failed ? 1 : 0);
