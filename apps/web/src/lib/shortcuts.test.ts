import { describe, expect, it } from "vitest";
import { isTypingTarget, shortcutGroups } from "./shortcuts";

describe("shortcuts", () => {
  it("lists run, format, panel resizing and table moves", () => {
    const text = JSON.stringify(shortcutGroups());
    expect(text).toContain("Run.");
    expect(text).toContain("Tidy the SQL");
    expect(text).toContain("larger steps");
    expect(text).toContain("swap it with the previous or next table");
  });

  it("every shortcut says what it does", () => {
    for (const group of shortcutGroups()) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.what.length).toBeGreaterThan(10);
        expect(item.keys.length).toBeGreaterThan(0);
      }
    }
  });

  it("leaves ? alone while typing in a field or the editor", () => {
    const input = document.createElement("input");
    const area = document.createElement("textarea");
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(area)).toBe(true);
    expect(isTypingTarget(editable)).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
