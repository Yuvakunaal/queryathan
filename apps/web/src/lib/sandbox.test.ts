import { describe, expect, it } from "vitest";
import type { ResultGrid } from "@dcq/engine-adapters";
import { parseCsv } from "../engines/csv";
import {
  buildSandboxCase,
  gridToCsv,
  oversizeFileMessage,
  prepareSandboxCsv,
  prepareSandboxCsvWithHints,
  SANDBOX_LIMITS,
  starterIdeas,
} from "./sandbox";

function ok(text: string) {
  const result = prepareSandboxCsv(text);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

describe("prepareSandboxCsv", () => {
  it("accepts a plain CSV unchanged", () => {
    const text = "a,b\n1,2\n3,4\n";
    const data = ok(text);
    expect(data.csvText).toBe(text);
    expect(data.columns).toEqual(["a", "b"]);
    expect(data.rowCount).toBe(2);
    expect(data.notes).toEqual([]);
  });

  it("strips a byte-order mark", () => {
    expect(ok("﻿a,b\n1,2\n").columns).toEqual(["a", "b"]);
  });

  it("converts semicolon- and tab-separated files and says so", () => {
    const semi = ok("a;b\n1;2\n");
    expect(semi.columns).toEqual(["a", "b"]);
    expect(semi.csvText).toBe("a,b\n1,2\n");
    expect(semi.notes[0]).toMatch(/semicolon/);
    expect(ok("a\tb\n1\t2\n").notes[0]).toMatch(/tab/);
  });

  it("renames blank and duplicate column names so SQL can load them", () => {
    const data = ok("id,name,name,\n1,x,y,z\n");
    expect(data.columns).toEqual(["id", "name", "name_2", "column_4"]);
    expect(data.notes.length).toBe(2);
    expect(data.csvText.split("\n")[0]).toBe("id,name,name_2,column_4");
  });

  it("treats names that differ only by case as duplicates (SQLite is case-insensitive)", () => {
    expect(ok("Name,name\n1,2\n").columns).toEqual(["Name", "name_2"]);
  });

  it("pads and trims ragged rows to the header width", () => {
    const data = ok("a,b,c\n1,2\n1,2,3,4\n");
    expect(data.csvText).toBe("a,b,c\n1,2,\n1,2,3\n");
    expect(data.notes[0]).toMatch(/2 row/);
  });

  it("keeps commas and quotes inside fields intact when it has to rewrite", () => {
    const data = ok('a;b\n"x,y";"say ""hi"""\n');
    expect(data.csvText).toBe('a,b\n"x,y","say ""hi"""\n');
  });

  it("rejects empty files, header-only files and over-limit files with plain messages", () => {
    const message = (text: string): string => {
      const result = prepareSandboxCsv(text);
      return result.ok ? "" : result.message;
    };
    expect(message("   \n")).toMatch(/empty/);
    expect(message("a,b\n")).toMatch(/no data rows/);
    expect(message("a\n" + "1\n".repeat(SANDBOX_LIMITS.maxRows + 1))).toMatch(/rows/);
    const wide = Array.from(
      { length: SANDBOX_LIMITS.maxColumns + 1 },
      (_, i) => `c${String(i)}`,
    ).join(",");
    expect(message(`${wide}\n1\n`)).toMatch(/columns/);
  });
});

describe("buildSandboxCase", () => {
  it("builds a case with numeric hints and a title from the file name", () => {
    const data = ok("id,city\n1,Austin\n2,Denver\n");
    const c = buildSandboxCase("cities.csv", data);
    expect(c.strings.title).toBe("cities.csv");
    expect(c.columnHints?.id?.numeric).toBe(true);
    expect(c.columnHints?.city?.numeric).toBe(false);
  });
});

describe("gridToCsv", () => {
  it("writes nulls as empty and quotes fields that need it", () => {
    const grid: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: 1, b: null },
        { a: "x,y", b: 'q"r' },
      ],
      dtypes: {},
      index: [0, 1],
    };
    expect(gridToCsv(grid)).toBe('a,b\n1,\n"x,y","q""r"\n');
  });
});

describe("starterIdeas", () => {
  it("offers language-specific safe first queries that mention real columns", () => {
    const sql = starterIdeas("sql", ["id", "city"]);
    expect(sql.some((i) => i.code.includes('"city"'))).toBe(true);
    const py = starterIdeas("python", ["id", "city"]);
    expect(py.some((i) => i.code.includes("df.isna().sum()"))).toBe(true);
  });
});

describe("prepareSandboxCsvWithHints", () => {
  const inputs = [
    "a,b\n1,2\n3,4\n",
    "\uFEFFname;city;city;score\nAva;Austin;TX;10\n Liam ;Leeds;UK;\nZoe;Lyon;FR;7\n",
    "x\ty\n1\tfoo bar baz\n2\t\n",
    "a,b,c\n1,2\n3,4,5,6\n",
    ",b\n1,2\n",
    'q,r\n"hello, world",1\n"say ""hi""",2\n',
  ];

  it("gives the same answer as the plain function, plus hints", () => {
    for (const text of inputs) {
      const plain = prepareSandboxCsv(text);
      const hinted = prepareSandboxCsvWithHints(text);
      expect(hinted.ok).toBe(plain.ok);
      if (!plain.ok || !hinted.ok) continue;
      const { hints, ...rest } = hinted.data;
      expect(rest).toEqual(plain.data);
      expect(hints).toBeDefined();
    }
  });

  it("works out the same hints the fight screen used to get by parsing the CSV again", () => {
    for (const text of inputs) {
      const data = ok(text);
      const hinted = prepareSandboxCsvWithHints(text);
      if (!hinted.ok) throw new Error("expected ok");
      const viaParse = buildSandboxCase("x.csv", data).columnHints;
      expect(hinted.data.hints).toEqual(viaParse);
      expect(buildSandboxCase("x.csv", hinted.data).columnHints).toEqual(viaParse);
    }
    expect(parseCsv("a\n1\n").rows).toHaveLength(1);
  });

  it("passes failures through with the same message", () => {
    expect(prepareSandboxCsvWithHints("   \n")).toEqual(prepareSandboxCsv("   \n"));
  });

  it("reports the exact size of an over-limit file, with or without multi-byte text", () => {
    const big = "a\n" + "é".repeat(SANDBOX_LIMITS.maxBytes);
    const result = prepareSandboxCsvWithHints(big);
    expect(result).toEqual(prepareSandboxCsv(big));
    expect(result.ok ? "" : result.message).toMatch(
      /MB\. The sandbox handles files up to 5 MB/,
    );
  });
});

describe("oversizeFileMessage", () => {
  it("only refuses unread files above twice the limit, with the same wording as before", () => {
    expect(oversizeFileMessage(SANDBOX_LIMITS.maxBytes * 2)).toBeNull();
    expect(oversizeFileMessage(SANDBOX_LIMITS.maxBytes * 2 + 1)).toMatch(
      /^That file is 10\.0 MB\. The sandbox handles files up to 5 MB\.$/,
    );
  });
});
