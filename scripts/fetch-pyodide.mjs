#!/usr/bin/env node
// Downloads the pinned Pyodide runtime into apps/web/public/pyodide/ (gitignored).
// Never fetches @latest — version + sha256 are pinned here and only change via a
// reviewed diff to this file. Individual scientific packages (pandas, numpy) are
// NOT in pyodide-core; how the worker loads them (self-hosted full wheels vs a
// pinned, CSP-allowlisted CDN indexURL) is a decision for pyodide.worker.ts, not
// this script.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PYODIDE_VERSION = "314.0.4";
const ASSET_NAME = `pyodide-core-${PYODIDE_VERSION}.tar.bz2`;
const EXPECTED_SHA256 =
  "e775e35fe447beeceaf6f33ab2d2242454a8b6e5401d9769d118eca164d234db";
const DOWNLOAD_URL = `https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/${ASSET_NAME}`;

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetDir = join(rootDir, "apps/web/public/pyodide");
const versionMarker = join(targetDir, ".pyodide-version");
const tmpArchive = join(rootDir, `.tmp-${ASSET_NAME}`);

if (existsSync(versionMarker) && readVersionMarker() === PYODIDE_VERSION) {
  console.log(`pyodide ${PYODIDE_VERSION} already present, skipping fetch.`);
  process.exit(0);
}

console.log(`Fetching pyodide-core ${PYODIDE_VERSION} from ${DOWNLOAD_URL} ...`);
const response = await fetch(DOWNLOAD_URL);
if (!response.ok) {
  throw new Error(`Download failed: ${response.status} ${response.statusText}`);
}
const buffer = Buffer.from(await response.arrayBuffer());

const actualSha256 = createHash("sha256").update(buffer).digest("hex");
if (actualSha256 !== EXPECTED_SHA256) {
  throw new Error(
    `Checksum mismatch for ${ASSET_NAME}.\n  expected: ${EXPECTED_SHA256}\n  actual:   ${actualSha256}\nAborting — refusing to extract an unverified archive.`,
  );
}

writeFileSync(tmpArchive, buffer);

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
try {
  execFileSync("tar", ["xjf", tmpArchive, "-C", targetDir, "--strip-components=1"]);
} finally {
  unlinkSync(tmpArchive);
}

writeFileSync(versionMarker, PYODIDE_VERSION);
console.log(`pyodide-core ${PYODIDE_VERSION} verified and extracted to ${targetDir}`);

function readVersionMarker() {
  try {
    return readFileSync(versionMarker, "utf8").trim();
  } catch {
    return null;
  }
}
