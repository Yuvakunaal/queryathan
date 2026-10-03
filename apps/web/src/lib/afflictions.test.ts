import { describe, expect, it } from "vitest";
import {
  countDuplicates,
  countNulls,
  countWhitespace,
  countCasing,
  countOutliers,
  duplicateRowIndices,
  normalizeDtype,
  dtypeMatches,
  dtypeMismatchRowIndices,
  patternMismatchRowIndices,
  mojibakeRowIndices,
} from "./afflictions";
import type { ResultGrid } from "@dcq/engine-adapters";

describe("countNulls", () => {
  it("counts null values in the given column", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }, { email: null }],
      dtypes: {},
      index: [0, 1, 2],
    };
    expect(countNulls(grid, "email")).toBe(2);
  });

  it("returns 0 when there are no nulls", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }],
      dtypes: {},
      index: [0],
    };
    expect(countNulls(grid, "email")).toBe(0);
  });

  it("returns 0 for an empty grid", () => {
    const grid: ResultGrid = { columns: ["email"], rows: [], dtypes: {}, index: [] };
    expect(countNulls(grid, "email")).toBe(0);
  });
});

describe("countDuplicates", () => {
  it("counts extra occurrences beyond the first for a single column", () => {
    const grid: ResultGrid = {
      columns: ["id"],
      rows: [{ id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }],
      dtypes: {},
      index: [0, 1, 2, 3],
    };
    // id=1 appears 3 times -> 2 extras beyond the first occurrence.
    expect(countDuplicates(grid, ["id"])).toBe(2);
  });

  it("treats a composite key across multiple columns", () => {
    const grid: ResultGrid = {
      columns: ["first", "last"],
      rows: [
        { first: "A", last: "B" },
        { first: "A", last: "B" },
        { first: "A", last: "C" },
      ],
      dtypes: {},
      index: [0, 1, 2],
    };
    expect(countDuplicates(grid, ["first", "last"])).toBe(1);
  });

  it("does not conflate differently-split values across the composite key", () => {
    // Adversarial case for a naive string-join key: "x|y" + "z" and "x" + "y|z"
    // would collide under a "|"-joined key. JSON.stringify of the tuple keeps
    // them distinct.
    const grid: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: "x|y", b: "z" },
        { a: "x", b: "y|z" },
      ],
      dtypes: {},
      index: [0, 1],
    };
    expect(countDuplicates(grid, ["a", "b"])).toBe(0);
  });

  it("treats null and the string 'null' as distinct values", () => {
    const grid: ResultGrid = {
      columns: ["a"],
      rows: [{ a: null }, { a: "null" }],
      dtypes: {},
      index: [0, 1],
    };
    expect(countDuplicates(grid, ["a"])).toBe(0);
  });

  it("returns 0 when every row is unique", () => {
    const grid: ResultGrid = {
      columns: ["id"],
      rows: [{ id: 1 }, { id: 2 }],
      dtypes: {},
      index: [0, 1],
    };
    expect(countDuplicates(grid, ["id"])).toBe(0);
  });

  it("never flags the first occurrence of a repeated row", () => {
    const grid: ResultGrid = {
      columns: ["id"],
      rows: [{ id: 1 }, { id: 1 }, { id: 1 }],
      dtypes: {},
      index: [0, 1, 2],
    };
    expect(duplicateRowIndices(grid, ["id"])).toEqual([1, 2]);
  });
});

describe("countWhitespace", () => {
  it("flags leading/trailing whitespace on string cells", () => {
    const grid: ResultGrid = {
      columns: ["name"],
      rows: [{ name: " Ada" }, { name: "Ada" }, { name: "Ada " }],
      dtypes: {},
      index: [0, 1, 2],
    };
    expect(countWhitespace(grid, "name")).toBe(2);
  });

  it("does not flag null cells", () => {
    const grid: ResultGrid = {
      columns: ["name"],
      rows: [{ name: null }],
      dtypes: {},
      index: [0],
    };
    expect(countWhitespace(grid, "name")).toBe(0);
  });

  it("does not flag non-string cells", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: 30 }],
      dtypes: {},
      index: [0],
    };
    expect(countWhitespace(grid, "age")).toBe(0);
  });
});

describe("countCasing", () => {
  it("flags values that are not lowercase when case is 'lower'", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }, { email: "A@B.com" }],
      dtypes: {},
      index: [0, 1],
    };
    expect(countCasing(grid, "email", "lower")).toBe(1);
  });

  it("flags values that are not uppercase when case is 'upper'", () => {
    const grid: ResultGrid = {
      columns: ["code"],
      rows: [{ code: "US" }, { code: "us" }],
      dtypes: {},
      index: [0, 1],
    };
    expect(countCasing(grid, "code", "upper")).toBe(1);
  });

  it("flags values that are not title-cased when case is 'title'", () => {
    const grid: ResultGrid = {
      columns: ["city"],
      rows: [{ city: "New York" }, { city: "new york" }, { city: "NEW YORK" }],
      dtypes: {},
      index: [0, 1, 2],
    };
    expect(countCasing(grid, "city", "title")).toBe(2);
  });

  it("does not flag null cells", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }],
      dtypes: {},
      index: [0],
    };
    expect(countCasing(grid, "email", "lower")).toBe(0);
  });
});

describe("countOutliers", () => {
  it("flags numeric values outside the given range", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: 30 }, { age: -5 }, { age: 200 }, { age: 45 }],
      dtypes: {},
      index: [0, 1, 2, 3],
    };
    expect(countOutliers(grid, "age", 0, 120)).toBe(2);
  });

  it("treats the bounds as inclusive", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: 0 }, { age: 120 }],
      dtypes: {},
      index: [0, 1],
    };
    expect(countOutliers(grid, "age", 0, 120)).toBe(0);
  });

  it("does not flag null or non-numeric cells", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: null }, { age: "unknown" }],
      dtypes: {},
      index: [0, 1],
    };
    expect(countOutliers(grid, "age", 0, 120)).toBe(0);
  });
});

describe("normalizeDtype", () => {
  it.each([
    ["int64", "int"],
    ["int32", "int"],
    ["Int64", "int"],
    ["float64", "float"],
    ["float32", "float"],
    ["bool", "bool"],
    ["object", "string"],
    ["datetime64[ns]", "datetime"],
  ] as const)("normalizes %s to %s", (pandasDtype, expected) => {
    expect(normalizeDtype(pandasDtype)).toBe(expected);
  });

  it("returns null for an unrecognized dtype", () => {
    expect(normalizeDtype("complex128")).toBeNull();
  });
});

describe("dtypeMatches / dtypeMismatchRowIndices", () => {
  it("matches when the column's dtype normalizes to the target", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: 30 }],
      dtypes: { age: "int64" },
      index: [0],
    };
    expect(dtypeMatches(grid, "age", "int")).toBe(true);
    expect(dtypeMismatchRowIndices(grid, "age", "int")).toEqual([]);
  });

  it("flags every row when the column's dtype does not match", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: "30" }, { age: "unknown" }],
      dtypes: { age: "object" },
      index: [0, 1],
    };
    expect(dtypeMatches(grid, "age", "int")).toBe(false);
    expect(dtypeMismatchRowIndices(grid, "age", "int")).toEqual([0, 1]);
  });
});

describe("patternMismatchRowIndices", () => {
  const grid: ResultGrid = {
    columns: ["code"],
    rows: [{ code: "AB-123" }, { code: "ab123" }, { code: null }, { code: 42 }],
    dtypes: {},
    index: [0, 1, 2, 3],
  };

  it("flags non-null cells that do not match, skipping nulls", () => {
    expect(patternMismatchRowIndices(grid, "code", "^[A-Z]{2}-\\d{3}$")).toEqual([1, 3]);
  });

  it("compares numbers as strings", () => {
    expect(patternMismatchRowIndices(grid, "code", "^\\d+$")).toEqual([0, 1]);
  });
});

describe("mojibakeRowIndices", () => {
  it("flags UTF-8 read as Latin-1 and leaves clean accents alone", () => {
    const grid: ResultGrid = {
      columns: ["name"],
      rows: [
        { name: "JosÃ©" },
        { name: "José" },
        { name: "itâ€™s" },
        { name: "plain" },
        { name: null },
      ],
      dtypes: {},
      index: [0, 1, 2, 3, 4],
    };
    expect(mojibakeRowIndices(grid, "name")).toEqual([0, 2]);
  });
});
