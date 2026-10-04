import { describe, expect, it } from "vitest";
import { describeColumn } from "./mysqlType";

const type = (values: (string | number | boolean | null)[]): string =>
  describeColumn(values).mysql;

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
    expect(type(["12", "340"])).toBe("VARCHAR(3)");
  });
});
