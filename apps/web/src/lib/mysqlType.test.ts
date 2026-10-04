import { describe, expect, it } from "vitest";
import { describeColumn } from "./mysqlType";

const type = (values: (string | number | boolean | null)[]): string =>
  describeColumn("c", values, undefined, "sql").mysql;

describe("MySQL type of a column", () => {
  it("picks the smallest integer type that holds every value", () => {
    expect(type([1, 2, 100])).toBe("TINYINT");
    expect(type([-128, 127])).toBe("TINYINT");
    expect(type([-129, 5])).toBe("SMALLINT");
    expect(type([1000, 32_767])).toBe("SMALLINT");
    expect(type([40_000, 1])).toBe("MEDIUMINT");
    expect(type([1_000_000_000])).toBe("INT");
    expect(type([3_000_000_000])).toBe("BIGINT");
  });

  it("gives decimals exactly the precision they need", () => {
    expect(type([144.59, 9.54, 152.78])).toBe("DECIMAL(5,2)");
    expect(type([0.5, 12])).toBe("DECIMAL(3,1)");
    expect(type([1234567.891])).toBe("DECIMAL(10,3)");
    expect(type([0.1234567])).toBe("DOUBLE");
  });

  it("recognises dates and times written the standard way", () => {
    expect(type(["2026-03-09", "2026-12-31"])).toBe("DATE");
    expect(type(["2026-03-09 14:05:00"])).toBe("DATETIME");
    expect(type(["2026-03-09T14:05:00.000Z", "2026-03-09T15:00:00.000Z"])).toBe(
      "DATETIME(3)",
    );
    expect(type(["14:05:00", "09:00:01"])).toBe("TIME");
    expect(type(["2026-02-30"])).toBe("VARCHAR(10)"); // not a real date
  });

  it("sizes text to the longest value, and switches to TEXT when it is long", () => {
    expect(type(["C-044", "C-1", "C-0450 "])).toBe("VARCHAR(7)");
    expect(type(["x".repeat(300)])).toBe("TEXT");
    expect(type(["x".repeat(70_000)])).toBe("MEDIUMTEXT");
  });

  it("handles booleans, empties and mixed columns", () => {
    expect(type([true, false, null])).toBe("BOOLEAN");
    expect(type(["true", "FALSE"])).toBe("BOOLEAN");
    expect(type([null, null])).toBe("VARCHAR(255)");
    expect(type([1, "a"])).toBe("VARCHAR(1)");
  });

  it("says whether NULL is needed and whether it could be a key", () => {
    const withGaps = describeColumn("c", [1, null, 3], "int64", "python");
    expect(withGaps.lines[0]).toContain("NULL allowed: 1 of 3");
    const key = describeColumn("c", [1, 2, 3], "int64", "sql");
    expect(key.lines[0]).toContain("NOT NULL fits");
    expect(key.lines.join(" ")).toContain("could be a key");
    expect(key.lines.join(" ")).toContain("SQLite stores it as INTEGER");
    expect(withGaps.lines.join(" ")).toContain("pandas dtype: int64");
  });

  it("notes whole numbers kept as text, and the Z on UTC times", () => {
    const text = describeColumn("c", ["12", "340"], "object", "sql");
    expect(text.mysql).toBe("VARCHAR(3)");
    expect(text.lines.join(" ")).toContain("INT column would hold them");
    const utc = describeColumn("c", ["2026-01-01T00:00:00.000Z"], "object", "sql");
    expect(utc.lines.join(" ")).toContain("drop the Z");
  });
});
