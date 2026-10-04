import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A style that uses a design token nobody defines silently falls back to the browser's
 * default (a serif font, a transparent background). This reads every stylesheet and script
 * and fails if one does, so a typo or a forgotten token is caught the day it is written.
 */
const ROOT = join(__dirname);
// Set at run time by the animation and grid code, never in a stylesheet.
const SET_BY_SCRIPT = new Set([
  "--w1-cell-seed",
  "--w1-chromatic",
  "--w1-diff-alpha",
  "--w1-diff-color",
  "--w1-hit-tint",
]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(css|tsx?)$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("design tokens", () => {
  it("every var(--token) that is used is defined somewhere", () => {
    const used = new Map<string, string>();
    const defined = new Set<string>(SET_BY_SCRIPT);
    for (const file of files(ROOT)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/var\((--[\w-]+)/g)) used.set(m[1] ?? "", file);
      for (const m of text.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1] ?? "");
      for (const m of text.matchAll(/["'`](--[\w-]+)["'`]/g)) defined.add(m[1] ?? "");
    }
    const missing = [...used]
      .filter(([name]) => !defined.has(name))
      .map(([n, f]) => `${n} (${f.replace(ROOT, "")})`);
    expect(missing).toEqual([]);
  });
});
