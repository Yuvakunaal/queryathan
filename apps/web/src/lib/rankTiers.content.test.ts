import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { WorldId } from "@dcq/content-schema";
import { maxTechniquesForWorld } from "./save";

/**
 * The roster screen says "N / M techniques" and the top rank needs all M. If a case adds a
 * technique (a new skill, or a new kind of check) or removes one, the rank table in
 * save.ts must change with it, or the panel shows "7 / 6", or the top rank can never be
 * reached. This test reads the real case files so that mistake fails here.
 */
const casesDir = join(process.cwd(), "../../content/cases");

function techniquesOf(world: string): Set<string> {
  const found = new Set<string>();
  for (const file of readdirSync(join(casesDir, world))) {
    const data = JSON.parse(readFileSync(join(casesDir, world, file), "utf8")) as {
      skills?: string[];
      winCondition: { all: { predicate: string }[] };
    };
    const list = data.skills ?? [
      ...new Set(data.winCondition.all.map((p) => p.predicate)),
    ];
    for (const technique of list) found.add(technique);
  }
  return found;
}

describe("rank tiers match the techniques the cases really teach", () => {
  for (const world of readdirSync(casesDir)) {
    it(`${world}: the top rank needs exactly the techniques that exist`, () => {
      const available = techniquesOf(world);
      expect(
        maxTechniquesForWorld(world as WorldId),
        `${world} teaches ${[...available].join(", ")}; update RANK_TIERS in src/lib/save.ts`,
      ).toBe(available.size);
    });
  }
});
