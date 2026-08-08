import { describe, expect, it } from "vitest";
import { makeBootLine, revealLine } from "./bootType";

function span(): HTMLElement {
  return document.createElement("span");
}

describe("revealLine", () => {
  it("reveals nothing at revealedChars = 0", () => {
    const el = span();
    const line = makeBootLine([{ text: "hello", el }]);
    revealLine(line, 0);
    expect(el.textContent).toBe("");
  });

  it("reveals a partial single segment", () => {
    const el = span();
    const line = makeBootLine([{ text: "hello", el }]);
    revealLine(line, 3);
    expect(el.textContent).toBe("hel");
  });

  it("reveals the full segment once revealedChars reaches its length", () => {
    const el = span();
    const line = makeBootLine([{ text: "hello", el }]);
    revealLine(line, 5);
    expect(el.textContent).toBe("hello");
  });

  it("clamps a revealedChars beyond the line's total length", () => {
    const el = span();
    const line = makeBootLine([{ text: "hi", el }]);
    revealLine(line, 999);
    expect(el.textContent).toBe("hi");
  });

  it("handles a multi-segment line: first segment fills before the second starts", () => {
    const elA = span();
    const elB = span();
    const line = makeBootLine([
      { text: "abc", el: elA },
      { text: "OK", el: elB },
    ]);

    revealLine(line, 2);
    expect(elA.textContent).toBe("ab");
    expect(elB.textContent).toBe("");
  });

  it("handles a multi-segment line: exactly at the boundary between segments", () => {
    const elA = span();
    const elB = span();
    const line = makeBootLine([
      { text: "abc", el: elA },
      { text: "OK", el: elB },
    ]);

    revealLine(line, 3);
    expect(elA.textContent).toBe("abc");
    expect(elB.textContent).toBe("");
  });

  it("handles a multi-segment line: one character past the boundary starts the second segment", () => {
    const elA = span();
    const elB = span();
    const line = makeBootLine([
      { text: "abc", el: elA },
      { text: "OK", el: elB },
    ]);

    revealLine(line, 4);
    expect(elA.textContent).toBe("abc");
    expect(elB.textContent).toBe("O");
  });

  it("handles three segments revealing in sequence", () => {
    const elA = span();
    const elB = span();
    const elC = span();
    const line = makeBootLine([
      { text: "ab", el: elA },
      { text: "cd", el: elB },
      { text: "ef", el: elC },
    ]);

    revealLine(line, 5);
    expect(elA.textContent).toBe("ab");
    expect(elB.textContent).toBe("cd");
    expect(elC.textContent).toBe("e");
  });
});

describe("makeBootLine", () => {
  it("sums segment lengths into totalLength", () => {
    const line = makeBootLine([
      { text: "abc", el: span() },
      { text: "de", el: span() },
    ]);
    expect(line.totalLength).toBe(5);
  });
});
