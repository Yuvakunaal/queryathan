import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Checks the design tokens themselves, for every world in every theme (dark,
 * light, and both high-contrast modes): the text colors against the surfaces
 * they sit on, accent colors used as text, and status colors. WCAG 2.x AA
 * needs 4.5:1 for normal text and 3:1 for large text and focus indicators.
 * Auditing tokens finds a bad color once instead of on every screen it shows
 * up on, and does not depend on timing or animation like a page scan does.
 */
const WORLDS = [
  "boss-fights",
  "the-vault",
  "the-twins",
  "the-architect",
  "the-foundry",
  "the-observatory",
  "the-labyrinth",
  "the-timekeeper",
  "the-laboratory",
  "hub",
] as const;
const MODES = [
  { name: "dark", theme: "dark", contrast: null },
  { name: "light", theme: "light", contrast: null },
  { name: "dark high contrast", theme: "dark", contrast: "high" },
  { name: "light high contrast", theme: "light", contrast: "high" },
] as const;

const SURFACES = ["bg-void", "bg-panel", "bg-panel-2", "bg-row-a", "bg-row-b"];
const STATUS = [
  "null",
  "dup",
  "dtype",
  "ws",
  "outlier",
  "date",
  "pattern",
  "encoding",
  "shape",
];

interface Need {
  fg: string;
  on: string[];
  min: number;
}
const NEEDS: Need[] = [
  { fg: "text-primary", on: SURFACES, min: 4.5 },
  { fg: "text-secondary", on: SURFACES, min: 4.5 },
  { fg: "text-dim", on: SURFACES, min: 4.5 },
  { fg: "amber-500", on: SURFACES.slice(0, 3), min: 4.5 },
  { fg: "green-500", on: SURFACES.slice(0, 3), min: 4.5 },
  { fg: "green-300", on: ["bg-void", "bg-panel"], min: 4.5 },
  { fg: "title", on: ["bg-void", "bg-panel", "bg-panel-2"], min: 3 },
  { fg: "diff-del", on: ["bg-void", "bg-panel"], min: 4.5 },
  { fg: "diff-add", on: ["bg-void", "bg-panel"], min: 4.5 },
  { fg: "focus", on: ["bg-void", "bg-panel"], min: 3 },
  ...STATUS.map((kind) => ({
    fg: `status-${kind}`,
    on: ["bg-void", "bg-row-a", "bg-row-b"],
    min: 4.5,
  })),
];
// Text drawn in the "inverse" color sits on filled buttons and badges.
const INVERSE: [string, string][] = [
  ["green-500", "primary button"],
  ["amber-500", "badge"],
];

function toRgb(value: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const short = /^#([0-9a-f]{3})$/i.exec(value.trim());
  if (short?.[1]) {
    const digits = short[1].split("");
    return digits.map((c) => parseInt(c + c, 16)) as [number, number, number];
  }
  throw new Error(`unsupported color value: "${value}"`);
}
function luminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}
function ratio(a: string, b: string): number {
  const [x, y] = [luminance(toRgb(a)), luminance(toRgb(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

async function tokens(page: Page, world: string, mode: (typeof MODES)[number]) {
  return page.evaluate(
    ({ world, mode, names }) => {
      const html = document.documentElement;
      html.dataset.dcqTheme = mode.theme;
      if (mode.contrast) html.dataset.dcqContrast = mode.contrast;
      else delete html.dataset.dcqContrast;
      const probe = document.createElement("div");
      probe.dataset.world = world;
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const out: Record<string, string> = {};
      for (const name of names) out[name] = style.getPropertyValue(`--w1-${name}`).trim();
      // The boss title falls back to the "null" status color when a world sets no title color.
      out.title ||= out["status-null"] ?? "";
      probe.remove();
      return out;
    },
    {
      world,
      mode,
      names: [
        ...new Set([
          ...SURFACES,
          "text-inverse",
          ...NEEDS.map((need) => need.fg),
          ...INVERSE.map(([name]) => name),
        ]),
      ],
    },
  );
}

for (const mode of MODES) {
  test(`color tokens meet WCAG AA: ${mode.name}`, async ({ page }) => {
    await page.goto("/");
    const failures: string[] = [];
    for (const world of WORLDS) {
      const t = await tokens(page, world, mode);
      for (const need of NEEDS) {
        for (const surface of need.on) {
          const value = ratio(t[need.fg] ?? "", t[surface] ?? "");
          if (value < need.min) {
            failures.push(
              `${world}: ${need.fg} ${t[need.fg] ?? ""} on ${surface} ${t[surface] ?? ""} = ${value.toFixed(2)} (needs ${String(need.min)})`,
            );
          }
        }
      }
      for (const [fill, what] of INVERSE) {
        const value = ratio(t["text-inverse"] ?? "", t[fill] ?? "");
        if (value < 4.5) {
          failures.push(
            `${world}: text-inverse on ${fill} (${what}) = ${value.toFixed(2)} (needs 4.5)`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });
}
