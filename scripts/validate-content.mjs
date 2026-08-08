#!/usr/bin/env node
// Validates every case JSON under content/cases and every world roster under
// content/rosters against @dcq/content-schema, then cross-checks that each
// roster's caseIds actually resolve to a case file. This is the CI gate that
// lets community content PRs be a data review, not a code review
// (docs/adr/0003-win-condition-contract.md).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { caseSchema, worldRosterSchema } from "@dcq/content-schema";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const casesDir = join(rootDir, "content/cases");
const rostersDir = join(rootDir, "content/rosters");

function findJsonFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return findJsonFiles(fullPath);
    return entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

let hasErrors = false;
const caseIdsByWorld = new Map();

const caseFiles = findJsonFiles(casesDir);
for (const file of caseFiles) {
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
    const ids = caseIdsByWorld.get(result.data.world) ?? new Set();
    ids.add(result.data.id);
    caseIdsByWorld.set(result.data.world, ids);
  }
}

const rosterFiles = findJsonFiles(rostersDir);
for (const file of rosterFiles) {
  const relPath = file.slice(rootDir.length + 1);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    hasErrors = true;
    console.error(`✗ ${relPath}\n  invalid JSON: ${err.message}`);
    continue;
  }

  const result = worldRosterSchema.safeParse(parsed);
  if (!result.success) {
    hasErrors = true;
    console.error(`✗ ${relPath}`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    continue;
  }

  const knownIds = caseIdsByWorld.get(result.data.world) ?? new Set();
  const missing = result.data.caseIds.filter((id) => !knownIds.has(id));
  if (missing.length > 0) {
    hasErrors = true;
    console.error(`✗ ${relPath}`);
    for (const id of missing) {
      console.error(`  caseIds: "${id}" has no matching case file in content/cases/${result.data.world}/`);
    }
  } else {
    console.log(`✓ ${relPath}`);
  }
}

const totalFiles = caseFiles.length + rosterFiles.length;
console.log(`\n${totalFiles} content file(s) checked.`);
if (hasErrors) {
  process.exit(1);
}
