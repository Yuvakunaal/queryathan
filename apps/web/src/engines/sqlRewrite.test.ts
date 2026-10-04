import { describe, expect, it } from "vitest";
import { replaceableResult } from "./sqlRewrite";

describe("replaceableResult", () => {
  it("drops the old result before creating it", () => {
    expect(replaceableResult("CREATE TABLE result AS SELECT 1;")).toBe(
      "DROP TABLE IF EXISTS result; CREATE TABLE result AS SELECT 1;",
    );
  });

  it("accepts CREATE OR REPLACE, in any case", () => {
    expect(replaceableResult("create or replace table result as select 1")).toBe(
      "DROP TABLE IF EXISTS result; CREATE TABLE result as select 1",
    );
  });

  it("leaves other tables and IF NOT EXISTS alone", () => {
    const other =
      "CREATE TABLE results AS SELECT 1; CREATE TABLE IF NOT EXISTS result (a);";
    expect(replaceableResult(other)).toBe(other);
    expect(replaceableResult("CREATE TABLE tmp AS SELECT 1;")).toBe(
      "CREATE TABLE tmp AS SELECT 1;",
    );
  });

  it("keeps a commented-out statement a comment", () => {
    const out = replaceableResult("-- CREATE TABLE result AS SELECT 1;\nSELECT 2;");
    expect(out.split("\n")[0]?.startsWith("--")).toBe(true);
    expect(out.split("\n")[1]).toBe("SELECT 2;");
  });

  it("handles several statements and a column list", () => {
    const out = replaceableResult(
      "CREATE TABLE result (a INT); INSERT INTO result VALUES (1);\nCREATE TABLE result AS SELECT 2;",
    );
    expect(out.match(/DROP TABLE IF EXISTS result;/g)?.length).toBe(2);
  });
});
