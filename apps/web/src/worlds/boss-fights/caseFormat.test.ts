import { describe, expect, it } from "vitest";
import { formatWinCondition, getPrimaryNullColumn } from "./caseFormat";
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
