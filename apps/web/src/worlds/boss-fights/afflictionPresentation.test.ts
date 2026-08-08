import { describe, expect, it } from "vitest";
import { ariaLabelForAffliction, BADGE_GLYPH } from "./afflictionPresentation";

describe("BADGE_GLYPH", () => {
  it("defines a glyph for every affliction kind", () => {
    expect(BADGE_GLYPH).toEqual({
      null: "NaN",
      dup: "=",
      ws: "_",
      dtype: "#",
      outlier: "^",
      date: "@",
    });
  });
});

describe("ariaLabelForAffliction", () => {
  it("matches Phase 1's exact null-cell wording", () => {
    expect(ariaLabelForAffliction("null", "temp_c", 14, null)).toBe(
      "temp_c, row 14, missing value",
    );
  });

  it("describes a duplicate row without a value (the row itself is the problem)", () => {
    expect(ariaLabelForAffliction("dup", "email", 3, "a@b.com")).toBe(
      "email, row 3, duplicate row",
    );
  });

  it.each([
    ["dtype", "quantity, row 5, wrong data type, value out of stock"],
    ["ws", "quantity, row 5, whitespace or casing issue, value out of stock"],
    ["outlier", "quantity, row 5, out of range, value out of stock"],
    ["date", "quantity, row 5, invalid date, value out of stock"],
  ] as const)("includes the value for kind %s", (kind, expected) => {
    expect(ariaLabelForAffliction(kind, "quantity", 5, "out of stock")).toBe(expected);
  });
});
