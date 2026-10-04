import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import { prepareSql } from "./sqlRewrite";
import {
  FRIENDLY_FUNCTIONS,
  dateAdd,
  dateDiffUnits,
  dateFormat,
  dateTrunc,
  parseStamp,
  parseWithFormat,
  registerFriendlyFunctions,
  splitPart,
  timestampDiff,
} from "./sqlFunctions";

describe("dates", () => {
  it("reads ISO dates and times, and rejects impossible ones", () => {
    expect(parseStamp("2026-03-09")).toMatchObject({
      y: 2026,
      mo: 3,
      d: 9,
      timed: false,
    });
    expect(parseStamp("2026-03-09 14:05:07")).toMatchObject({
      h: 14,
      mi: 5,
      s: 7,
      timed: true,
    });
    expect(parseStamp("2026-02-30")).toBeNull();
    expect(parseStamp("09/03/2026")).toBeNull();
    expect(parseStamp(null)).toBeNull();
  });

  it("gives the parts of a date", () => {
    const f = FRIENDLY_FUNCTIONS;
    expect(f.year?.("2026-03-09")).toBe(2026);
    expect(f.month?.("2026-03-09")).toBe(3);
    expect(f.day?.("2026-03-09")).toBe(9);
    expect(f.quarter?.("2026-08-01")).toBe(3);
    expect(f.dayname?.("2026-03-09")).toBe("Monday");
    expect(f.monthname?.("2026-03-09")).toBe("March");
    expect(f.dayofweek?.("2026-03-08")).toBe(1); // Sunday, MySQL numbering
    expect(f.weekday?.("2026-03-09")).toBe(0); // Monday, MySQL numbering
    expect(f.week?.("2026-01-01")).toBe(1);
    expect(f.week?.("2024-12-30")).toBe(1); // belongs to ISO week 1 of 2025
    expect(f.dayofyear?.("2026-12-31")).toBe(365);
    expect(f.year?.("nonsense")).toBeNull();
    expect(f.year?.(null)).toBeNull();
  });

  it("truncates to the start of a period", () => {
    expect(dateTrunc("month", "2026-03-19")).toBe("2026-03-01");
    expect(dateTrunc("year", "2026-03-19 10:00:00")).toBe("2026-01-01");
    expect(dateTrunc("quarter", "2026-08-19")).toBe("2026-07-01");
    expect(dateTrunc("week", "2026-03-19")).toBe("2026-03-16"); // a Monday
    expect(dateTrunc("hour", "2026-03-19 10:45:12")).toBe("2026-03-19 10:00:00");
    expect(dateTrunc("nonsense", "2026-03-19")).toBeNull();
  });

  it("adds time, clamping to the end of a shorter month", () => {
    expect(dateAdd("2026-01-31", 1, "month")).toBe("2026-02-28");
    expect(dateAdd("2024-01-31", 1, "month")).toBe("2024-02-29");
    expect(dateAdd("2026-03-09", 10, "day")).toBe("2026-03-19");
    expect(dateAdd("2026-03-09", -9, "day")).toBe("2026-02-28");
    expect(dateAdd("2026-12-15", 2, "month")).toBe("2027-02-15");
    expect(dateAdd("2026-03-09", 2, "hour")).toBe("2026-03-09 02:00:00");
    expect(dateAdd("2026-03-09", 1, "year")).toBe("2027-03-09");
  });

  it("measures the gap between dates both ways", () => {
    expect(dateDiffUnits("day", "2026-03-01", "2026-03-09")).toBe(8);
    expect(dateDiffUnits("month", "2026-01-31", "2026-02-01")).toBe(1); // boundaries crossed
    expect(timestampDiff("month", "2026-01-31", "2026-02-28")).toBe(0); // whole months elapsed
    expect(timestampDiff("month", "2026-01-15", "2026-03-15")).toBe(2);
    expect(timestampDiff("day", "2026-03-09 12:00:00", "2026-03-11 11:00:00")).toBe(1);
    expect(FRIENDLY_FUNCTIONS.datediff?.("2026-03-09", "2026-03-01")).toBe(8); // MySQL: a - b
    expect(FRIENDLY_FUNCTIONS.datediff?.("day", "2026-03-01", "2026-03-09")).toBe(8);
  });

  it("formats with MySQL and PostgreSQL patterns", () => {
    expect(dateFormat("2026-03-09 14:05:07", "%Y/%m/%d %H:%i:%s", true)).toBe(
      "2026/03/09 14:05:07",
    );
    expect(dateFormat("2026-03-09", "%M %e, %Y (%a)", true)).toBe("March 9, 2026 (Mon)");
    expect(dateFormat("2026-03-09 14:05:07", "YYYY-MM-DD HH24:MI:SS", false)).toBe(
      "2026-03-09 14:05:07",
    );
    expect(dateFormat("2026-03-09", "Dy, DD Mon YYYY", false)).toBe("Mon, 09 Mar 2026");
  });

  it("reads dates written in other layouts into ISO", () => {
    expect(parseWithFormat("09/03/2026", "DD/MM/YYYY")).toBe("2026-03-09");
    expect(parseWithFormat("03/09/2026", "MM/DD/YYYY")).toBe("2026-03-09");
    expect(parseWithFormat("9 Mar 2026", "%e %b %Y")).toBe("2026-03-09");
    expect(parseWithFormat("March 9, 2026", "Month D, YYYY".replace("D,", "DD,"))).toBe(
      "2026-03-09",
    );
    expect(parseWithFormat("2026-03-09 02:30 PM", "YYYY-MM-DD HH:MI AM")).toBe(
      "2026-03-09 14:30:00",
    );
    expect(parseWithFormat("31/02/2026", "DD/MM/YYYY")).toBeNull();
    expect(parseWithFormat("not a date", "DD/MM/YYYY")).toBeNull();
  });
});

describe("text and numbers", () => {
  const f = FRIENDLY_FUNCTIONS;
  it("handles text the way other databases do", () => {
    expect(f.left?.("abcdef", 3)).toBe("abc");
    expect(f.right?.("abcdef", 2)).toBe("ef");
    expect(f.lpad?.("7", 3, "0")).toBe("007");
    expect(f.rpad?.("ab", 5, "xy")).toBe("abxyx");
    expect(f.repeat?.("ab", 3)).toBe("ababab");
    expect(f.initcap?.("jOHN o'neil-smith")).toBe("John O'neil-Smith");
    expect(splitPart("a,b,c", ",", 2)).toBe("b");
    expect(splitPart("a,b,c", ",", -1)).toBe("c");
    expect(splitPart("a,b,c", ",", 9)).toBe("");
    expect(f.substring_index?.("www.example.com", ".", 2)).toBe("www.example");
    expect(f.substring_index?.("www.example.com", ".", -2)).toBe("example.com");
    expect(f.contains?.("hello", "ell")).toBe(1);
    expect(f.translate?.("a-b", "-", "_")).toBe("a_b");
    expect(f.regexp_substr?.("order-1234-x", "\\d+")).toBe("1234");
    expect(f.regexp_count?.("a1b22c333", "\\d+")).toBe(3);
    expect(f.left?.(null, 2)).toBeNull();
  });

  it("handles numbers and nulls", () => {
    expect(f.mod?.(7, 3)).toBe(1);
    expect(f.mod?.(7, 0)).toBeNull();
    expect(f.pow?.(2, 10)).toBe(1024);
    expect(f.trunc?.(2.789, 1)).toBe(2.7);
    expect(f.trunc?.(-2.7)).toBe(-2);
    expect(f.greatest?.(1, 5, 3)).toBe(5);
    expect(f.least?.(1, null, 3)).toBeNull();
    expect(f.nvl?.(null, "x")).toBe("x");
    expect(f.nvl2?.(1, "has", "none")).toBe("has");
    expect(f.zeroifnull?.(null)).toBe(0);
    expect(f.nullifzero?.(0)).toBeNull();
  });
});

describe("in a real SQLite", () => {
  let db: Database;
  beforeAll(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    registerFriendlyFunctions(db);
    db.run(
      "CREATE TABLE t (id INTEGER, placed TEXT, name TEXT, qty INTEGER); " +
        "INSERT INTO t VALUES (1,'2026-01-31','  ann lee ',2),(2,'2026-02-14','BOB',NULL),(3,NULL,'cy',5);",
    );
  });
  const run = (sql: string): unknown[][] => db.exec(prepareSql(sql))[0]?.values ?? [];

  it("runs the functions inside queries", () => {
    expect(
      run("SELECT YEAR(placed), MONTH(placed), DAY(placed) FROM t WHERE id = 1"),
    ).toEqual([[2026, 1, 31]]);
    expect(run("SELECT COALESCE(qty, 0) FROM t ORDER BY id")).toEqual([[2], [0], [5]]);
    expect(run("SELECT DATE_TRUNC('month', placed) FROM t WHERE id = 2")).toEqual([
      ["2026-02-01"],
    ]);
    expect(run("SELECT INITCAP(TRIM(name)) FROM t WHERE id = 1")).toEqual([["Ann Lee"]]);
    expect(run("SELECT GREATEST(qty, 1) FROM t WHERE id = 3")).toEqual([[5]]);
    expect(run("SELECT YEAR(placed) FROM t WHERE id = 3")).toEqual([[null]]);
  });

  it("accepts the other dialects' spellings", () => {
    expect(run("SELECT EXTRACT(month FROM placed) FROM t WHERE id = 2")).toEqual([[2]]);
    expect(run("SELECT DATEDIFF(day, '2026-01-01', placed) FROM t WHERE id = 2")).toEqual(
      [[44]],
    );
    expect(run("SELECT DATEDIFF(placed, '2026-01-01') FROM t WHERE id = 2")).toEqual([
      [44],
    ]);
    expect(run("SELECT DATE_ADD(placed, INTERVAL 7 DAY) FROM t WHERE id = 2")).toEqual([
      ["2026-02-21"],
    ]);
    expect(run("SELECT DATEADD(month, 1, placed) FROM t WHERE id = 1")).toEqual([
      ["2026-02-28"],
    ]);
    expect(run("SELECT name FROM t WHERE name ILIKE 'bob'")).toEqual([["BOB"]]);
    expect(run("SELECT TIMESTAMPDIFF(MONTH, '2026-01-15', '2026-03-20')")).toEqual([[2]]);
    expect(run("SELECT TO_DATE('09/03/2026', 'DD/MM/YYYY')")).toEqual([["2026-03-09"]]);
    expect(run("SELECT DATE_FORMAT(placed, '%b %d') FROM t WHERE id = 1")).toEqual([
      ["Jan 31"],
    ]);
    expect(run("SELECT typeof(CURRENT_DATE())")).toEqual([["text"]]);
  });

  it("keeps SQLite's own functions working", () => {
    expect(
      run(
        "SELECT strftime('%Y', placed), length(name), upper('a'), round(2.567, 1) FROM t WHERE id = 1",
      ),
    ).toEqual([["2026", 10, "A", 2.6]]);
  });
});
