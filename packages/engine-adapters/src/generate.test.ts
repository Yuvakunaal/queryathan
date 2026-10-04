import { describe, expect, it } from "vitest";
import { generatedColumnKind, generatedValue, pythonGenerateSource } from "./generate";
import type { GeneratedDataset } from "./generate";

const spec: GeneratedDataset = {
  rows: 5,
  columns: [
    { name: "id", recipe: "int_mod", mul: 1, add: 1, mod: 1000 },
    { name: "n", recipe: "int_mod", mul: 7, add: 3, mod: 5 },
    { name: "x", recipe: "float_mod", mul: 13, add: 2, mod: 31, div: 100 },
    { name: "kind", recipe: "choice", values: ["a", "b", "c"], mul: 2, add: 1 },
  ],
};

describe("generatedValue", () => {
  it("is a pure function of the row number", () => {
    const col = (name: string) => {
      const found = spec.columns.find((c) => c.name === name);
      if (!found) throw new Error(name);
      return found;
    };
    const id = col("id");
    const n = col("n");
    const x = col("x");
    const kind = col("kind");
    expect([0, 1, 2].map((i) => generatedValue(id, i))).toEqual([1, 2, 3]);
    expect([0, 1, 2, 3].map((i) => generatedValue(n, i))).toEqual([3, 0, 2, 4]);
    expect(generatedValue(x, 1)).toBe(15 / 100);
    expect([0, 1, 2].map((i) => generatedValue(kind, i))).toEqual(["b", "a", "c"]);
  });
});

describe("generatedColumnKind", () => {
  it("maps recipes to SQL column types", () => {
    expect(spec.columns.map(generatedColumnKind)).toEqual([
      "INTEGER",
      "INTEGER",
      "REAL",
      "TEXT",
    ]);
  });
});

describe("pythonGenerateSource", () => {
  it("builds a numpy DataFrame with the same formulas, one column per recipe", () => {
    const code = pythonGenerateSource(spec);
    expect(code).toContain("np.arange(5");
    expect(code).toContain('"id": (__i * 1 + 1) % 1000');
    expect(code).toContain('"x": ((__i * 13 + 2) % 31) / 100');
    expect(code).toContain('np.array(["a","b","c"]');
    expect(code.trim().endsWith("del __i")).toBe(true);
  });
});
