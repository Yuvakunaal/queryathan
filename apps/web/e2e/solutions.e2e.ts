import { test, expect } from "./fixtures";
import { expectWin, openCase, run, setCode, titleOf } from "./helpers";
import type { EngineName } from "./helpers";
import { SOLUTIONS } from "./solutions";

for (const solution of SOLUTIONS) {
  for (const engine of ["python", "sql"] as EngineName[]) {
    test(`${titleOf(solution.world, solution.caseId)} is winnable in ${engine}`, async ({
      page,
    }) => {
      await openCase(page, solution.world, solution.caseId, engine);
      await setCode(page, solution[engine]);
      await run(page);
      const summary = await expectWin(page);
      expect(summary).toMatch(/Runs/);
    });
  }
}
