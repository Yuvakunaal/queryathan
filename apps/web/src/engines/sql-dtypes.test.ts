import { describe, expect, it } from "vitest";
import { inferSqlDtype, inferSqlDtypes } from "./sql-dtypes";

describe("inferSqlDtype", () => {
  it("infers int64 for a column of whole numbers", () => {
    expect(inferSqlDtype([30, 45, 12])).toBe("int64");
  });

  it("infers float64 when any value is a non-integer number", () => {
    expect(inferSqlDtype([30, 45.5])).toBe("float64");
  });

  it("infers object for a column with any text value", () => {
    expect(inferSqlDtype([30, "out of stock", 12])).toBe("object");
  });

  it("skips nulls when checking numeric-ness", () => {
    expect(inferSqlDtype([30, null, 45])).toBe("int64");
  });

  it("infers object for an entirely-null column", () => {
    expect(inferSqlDtype([null, null])).toBe("object");
  });

  it("infers datetime64[ns] for ISO-8601 date strings", () => {
    expect(inferSqlDtype(["2026-01-05T08:00:00", "2026-01-05T08:41:00"])).toBe(
      "datetime64[ns]",
    );
  });

  it("infers object for a text column that isn't ISO dates", () => {
    expect(inferSqlDtype(["low", "high", "medium"])).toBe("object");
  });

  it("infers object for a mix of dates and non-date text", () => {
    expect(inferSqlDtype(["2026-01-05", "not a date"])).toBe("object");
  });

  it("infers object for raw Date.toISOString() text (ms + Z suffix) — the seed-data affliction", () => {
    expect(inferSqlDtype(["2026-01-15T09:20:00.000Z", "2026-01-15T09:41:00.000Z"])).toBe(
      "object",
    );
  });

  it("infers datetime64[ns] for SQLite's own datetime()-function output format", () => {
    expect(inferSqlDtype(["2026-01-15 09:20:00", "2026-01-15 09:41:00"])).toBe(
      "datetime64[ns]",
    );
  });
});

describe("inferSqlDtypes", () => {
  it("infers dtypes per column across rows", () => {
    const dtypes = inferSqlDtypes(
      ["age", "status"],
      [
        { age: 30, status: "open" },
        { age: 45, status: "closed" },
      ],
    );
    expect(dtypes).toEqual({ age: "int64", status: "object" });
  });
});
