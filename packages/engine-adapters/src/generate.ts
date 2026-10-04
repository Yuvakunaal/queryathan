/**
 * Closed-form generated datasets for performance cases (World 5).
 *
 * A stress test needs tens of thousands of rows, which is too much to ship as
 * a CSV and too slow to parse for a timing test. Every column is instead a
 * pure function of the row number i, so JavaScript (SQL engine) and numpy
 * (Python engine) produce identical tables, and an expected answer can be
 * computed once by a script. All arithmetic stays inside 2^53 so doubles are
 * exact in both.
 */
export type ColumnRecipe =
  | { name: string; recipe: "int_mod"; mul: number; add: number; mod: number }
  | {
      name: string;
      recipe: "float_mod";
      mul: number;
      add: number;
      mod: number;
      div: number;
    }
  | { name: string; recipe: "choice"; values: string[]; mul: number; add: number };

export interface GeneratedDataset {
  rows: number;
  columns: ColumnRecipe[];
}

export type GeneratedValue = string | number;

export function generatedValue(column: ColumnRecipe, i: number): GeneratedValue {
  switch (column.recipe) {
    case "int_mod":
      return (i * column.mul + column.add) % column.mod;
    case "float_mod":
      return ((i * column.mul + column.add) % column.mod) / column.div;
    case "choice":
      return column.values[(i * column.mul + column.add) % column.values.length] ?? "";
  }
}

export function generatedColumnKind(column: ColumnRecipe): "INTEGER" | "REAL" | "TEXT" {
  return column.recipe === "int_mod"
    ? "INTEGER"
    : column.recipe === "float_mod"
      ? "REAL"
      : "TEXT";
}

/** The Python that builds the same table with numpy, as `df`. */
export function pythonGenerateSource(spec: GeneratedDataset): string {
  const lines = [
    "import numpy as np, pandas as pd",
    `__i = np.arange(${String(spec.rows)}, dtype=np.int64)`,
    "df = pd.DataFrame({",
  ];
  for (const c of spec.columns) {
    const name = JSON.stringify(c.name);
    if (c.recipe === "int_mod") {
      lines.push(
        `    ${name}: (__i * ${String(c.mul)} + ${String(c.add)}) % ${String(c.mod)},`,
      );
    } else if (c.recipe === "float_mod") {
      lines.push(
        `    ${name}: ((__i * ${String(c.mul)} + ${String(c.add)}) % ${String(c.mod)}) / ${String(c.div)},`,
      );
    } else {
      lines.push(
        `    ${name}: np.array(${JSON.stringify(c.values)}, dtype=object)[(__i * ${String(c.mul)} + ${String(c.add)}) % ${String(c.values.length)}],`,
      );
    }
  }
  lines.push("})", "del __i");
  return lines.join("\n");
}
