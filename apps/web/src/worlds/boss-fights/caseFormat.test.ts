import { describe, expect, it } from "vitest";
import {
  formatWinCondition,
  getPrimaryNullColumn,
  predicateKinds,
  misnamedAnswerTable,
} from "./caseFormat";
import type { WinCondition } from "@dcq/content-schema";

describe("getPrimaryNullColumn", () => {
  it("returns the column of a no_nulls predicate", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "temp_c" }],
    };
    expect(getPrimaryNullColumn(winCondition)).toBe("temp_c");
  });

  it("returns null when there is no no_nulls predicate", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_duplicates", columns: ["id"] }],
    };
    expect(getPrimaryNullColumn(winCondition)).toBeNull();
  });

  it("finds no_nulls even when it isn't the first predicate", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_duplicates", columns: ["id"] },
        { predicate: "no_nulls", column: "email" },
      ],
    };
    expect(getPrimaryNullColumn(winCondition)).toBe("email");
  });
});

describe("formatWinCondition", () => {
  it("formats a single no_nulls predicate", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "temp_c" }],
    };
    expect(formatWinCondition(winCondition)).toBe("no_nulls(temp_c)");
  });

  it("formats a single no_duplicates predicate with its column list", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_duplicates", columns: ["first", "last"] }],
    };
    expect(formatWinCondition(winCondition)).toBe("no_duplicates(first,last)");
  });

  it("joins multiple predicates with AND", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_duplicates", columns: ["id"] },
      ],
    };
    expect(formatWinCondition(winCondition)).toBe(
      "no_nulls(email) AND no_duplicates(id)",
    );
  });
});

describe("predicateKinds", () => {
  it("returns the distinct predicate kinds in a win condition", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_whitespace", column: "email" },
      ],
    };
    expect(predicateKinds(winCondition)).toEqual(["no_nulls", "no_whitespace"]);
  });

  it("deduplicates repeated predicate kinds across multiple columns", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_nulls", column: "phone" },
      ],
    };
    expect(predicateKinds(winCondition)).toEqual(["no_nulls"]);
  });
});

describe("misnamedAnswerTable", () => {
  it("finds a table created under another name", () => {
    expect(misnamedAnswerTable("CREATE TABLE joined AS SELECT 1;")).toBe("joined");
    expect(misnamedAnswerTable("create view v as select 1")).toBe("v");
    expect(misnamedAnswerTable('CREATE TABLE IF NOT EXISTS "totals" (a)')).toBe("totals");
  });

  it("is quiet when the answer is called result, or nothing is created", () => {
    expect(misnamedAnswerTable("CREATE TABLE result AS SELECT 1;")).toBeNull();
    expect(
      misnamedAnswerTable(
        "CREATE TABLE tmp AS SELECT 1; CREATE TABLE result AS SELECT 2;",
      ),
    ).toBeNull();
    expect(misnamedAnswerTable("SELECT * FROM data;")).toBeNull();
    expect(
      misnamedAnswerTable("-- CREATE TABLE joined AS SELECT 1\nSELECT 1;"),
    ).toBeNull();
  });
});
