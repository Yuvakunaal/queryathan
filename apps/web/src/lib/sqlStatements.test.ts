import { describe, expect, it } from "vitest";
import {
  buildsResult,
  isQuery,
  splitStatements,
  wrapLastQueryAsResult,
} from "./sqlStatements";

describe("splitStatements", () => {
  it("splits on semicolons but not inside strings, identifiers or comments", () => {
    const code = "SELECT 'a;b' AS x; -- note; here\nSELECT \"c;d\"; /* x; y */ SELECT 3";
    expect(splitStatements(code).map((s) => s.text.trim())).toEqual([
      "SELECT 'a;b' AS x",
      '-- note; here\nSELECT "c;d"',
      "/* x; y */ SELECT 3",
    ]);
  });

  it("handles doubled quotes and a missing final semicolon", () => {
    expect(splitStatements("SELECT 'it''s; ok'; SELECT 2").length).toBe(2);
    expect(splitStatements("  \n ;; ").length).toBe(0);
  });
});

describe("queries and result", () => {
  it("knows a query when it sees one, including a WITH", () => {
    expect(isQuery("  -- c\n select 1")).toBe(true);
    expect(isQuery("WITH a AS (SELECT 1) SELECT * FROM a")).toBe(true);
    expect(isQuery("UPDATE t SET a = 1")).toBe(false);
    expect(isQuery("CREATE TABLE x AS SELECT 1")).toBe(false);
  });

  it("recognises code that already builds result", () => {
    expect(buildsResult("create table result as select 1")).toBe(true);
    expect(buildsResult("CREATE OR REPLACE TABLE result AS SELECT 1")).toBe(true);
    expect(buildsResult("CREATE TABLE results AS SELECT 1")).toBe(false);
  });
});

describe("wrapLastQueryAsResult", () => {
  it("wraps a plain SELECT", () => {
    expect(wrapLastQueryAsResult("SELECT 1 AS a")).toBe(
      "CREATE TABLE result AS\nSELECT 1 AS a;",
    );
  });

  it("wraps a whole WITH ... SELECT as one statement", () => {
    const code = "with cte as (\n  select 1 as a\n)\nselect * from cte;";
    expect(wrapLastQueryAsResult(code)).toBe(
      "CREATE TABLE result AS\nwith cte as (\n  select 1 as a\n)\nselect * from cte;",
    );
  });

  it("wraps only the last statement and keeps what came before", () => {
    const code = "UPDATE data SET a = 1;\n-- the answer\nSELECT a FROM data;";
    const out = wrapLastQueryAsResult(code) ?? "";
    expect(
      out.startsWith(
        "UPDATE data SET a = 1;\n-- the answer\nCREATE TABLE result AS\nSELECT a FROM data",
      ),
    ).toBe(true);
  });

  it("does nothing when result is already built or the last statement is not a query", () => {
    expect(wrapLastQueryAsResult("CREATE TABLE result AS SELECT 1;")).toBeNull();
    expect(wrapLastQueryAsResult("UPDATE data SET a = 1;")).toBeNull();
    expect(wrapLastQueryAsResult("   ")).toBeNull();
  });
});
