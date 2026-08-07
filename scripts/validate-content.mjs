#!/usr/bin/env node
// Validates every case JSON under content/cases against @dcq/content-schema.
// This is the CI gate that lets community content PRs be a data review, not
// a code review (docs/adr/0003-win-condition-contract.md).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { caseSchema } from "@dcq/content-schema";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const casesDir = join(rootDir, "content/cases");

function findJsonFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return findJsonFiles(fullPath);
    return entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

const files = findJsonFiles(casesDir);
let hasErrors = false;

for (const file of files) {
  const relPath = file.slice(rootDir.length + 1);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    hasErrors = true;
    console.error(`✗ ${relPath}\n  invalid JSON: ${err.message}`);
    continue;
  }

  const result = caseSchema.safeParse(parsed);
  if (!result.success) {
    hasErrors = true;
    console.error(`✗ ${relPath}`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    console.log(`✓ ${relPath}`);
  }
}

console.log(`\n${files.length} case file(s) checked.`);
if (hasErrors) {
  process.exit(1);
}
