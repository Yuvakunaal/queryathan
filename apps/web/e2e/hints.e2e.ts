import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "./fixtures";
import { expectWin, openCase, run, setCode } from "./helpers";

/**
 * A hint is a promise. Where the last SQL hint of a case is a complete
 * CREATE TABLE result statement, running it must win the case: otherwise the
 * hint is teaching something wrong.
 */
const casesDir = join(process.cwd(), "../../content/cases");
interface HintedCase {
  world: string;
  id: string;
  sql: string;
}
const hinted: HintedCase[] = [];
for (const world of readdirSync(casesDir)) {
  for (const file of readdirSync(join(casesDir, world))) {
    const data = JSON.parse(readFileSync(join(casesDir, world, file), "utf8")) as {
      id: string;
      hints?: { sql?: string[] };
    };
    const last = data.hints?.sql?.at(-1);
    if (last && /^CREATE TABLE result\b/i.test(last.trim())) {
      hinted.push({ world, id: data.id, sql: last });
    }
  }
}

for (const item of hinted) {
  test(`the last SQL hint of ${item.id} wins the case`, async ({ page }) => {
    await openCase(page, item.world, item.id, "sql");
    await setCode(page, item.sql);
    await run(page);
    await expectWin(page);
  });
}
