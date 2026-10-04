import { describe, expect, it } from "vitest";
import { CUES, playCue, setSoundEnabled, typingKeyFor } from "./sound";

describe("sound cues", () => {
  it("stays silent and safe without audio support", () => {
    setSoundEnabled(true);
    expect(() => {
      playCue("win");
    }).not.toThrow();
    setSoundEnabled(false);
  });

  it("keeps every cue short and quiet", () => {
    for (const notes of Object.values(CUES)) {
      for (const n of notes) {
        expect(n.gain).toBeLessThanOrEqual(0.1);
        expect(n.at + n.dur).toBeLessThan(1.2);
      }
    }
  });
});

describe("typingKeyFor", () => {
  const key = (
    k: string,
    mods: Partial<Record<"ctrlKey" | "metaKey" | "altKey", boolean>> = {},
  ) => typingKeyFor({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...mods });

  it("sounds for keys that change the text", () => {
    expect(key("a")).toBe("letter");
    expect(key("(")).toBe("letter");
    expect(key(" ")).toBe("space");
    expect(key("Enter")).toBe("enter");
    expect(key("Backspace")).toBe("back");
  });

  it("stays silent for shortcuts, navigation and modifiers", () => {
    expect(key("a", { metaKey: true })).toBeNull();
    expect(key("Enter", { ctrlKey: true })).toBeNull();
    expect(key("ArrowLeft")).toBeNull();
    expect(key("Tab")).toBeNull();
    expect(key("Shift")).toBeNull();
    expect(key("F5")).toBeNull();
  });
});
