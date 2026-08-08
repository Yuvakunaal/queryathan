import { describe, expect, it } from "vitest";
import { renderSigil } from "./sigil";

/** Interior rows only (1-3), pipes stripped — avoids matching the border's own "=" glyphs. */
function interior(sigil: string): string {
  return sigil
    .split("\n")
    .slice(1, 4)
    .map((line) => line.replace(/\|/g, ""))
    .join("\n");
}

describe("renderSigil", () => {
  it("uses '#' fill when ratio > 0.75", () => {
    // 20/23 ≈ 0.87
    expect(interior(renderSigil(20, 23))).toContain("#");
    expect(interior(renderSigil(20, 23))).not.toMatch(/[=:.]/);
  });

  it("uses '=' fill when 0.50 < ratio <= 0.75", () => {
    // 15/23 ≈ 0.65
    expect(interior(renderSigil(15, 23))).toContain("=");
    expect(interior(renderSigil(15, 23))).not.toMatch(/[#:.]/);
  });

  it("uses ':' fill when 0.25 < ratio <= 0.50", () => {
    // 8/23 ≈ 0.35
    expect(interior(renderSigil(8, 23))).toContain(":");
    expect(interior(renderSigil(8, 23))).not.toMatch(/[#=.]/);
  });

  it("uses '.' fill when 0 < ratio <= 0.25", () => {
    // 2/23 ≈ 0.09
    expect(interior(renderSigil(2, 23))).toContain(".");
    expect(interior(renderSigil(2, 23))).not.toMatch(/[#=:]/);
  });

  it("is a hollow frame with only spaces in the interior at zero remaining", () => {
    const sigil = renderSigil(0, 23);
    expect(interior(sigil)).not.toMatch(/[#=:.]/);
    expect(sigil.split("\n")[0]).toBe("+===========+");
  });

  it("preserves the frame characters regardless of ratio", () => {
    const lines = renderSigil(23, 23).split("\n");
    expect(lines[0]).toBe("+===========+");
    expect(lines[4]).toBe("+===========+");
  });

  it("treats the boundary ratio (exactly 0.75) as the '=' band, not '#'", () => {
    // predicate is "r > 0.75" for '#', so exactly 0.75 falls to the next band.
    expect(interior(renderSigil(3, 4))).toContain("=");
    expect(interior(renderSigil(3, 4))).not.toContain("#");
  });
});
