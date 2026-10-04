import { describe, expect, it } from "vitest";
import { CUES, playCue, setSoundEnabled } from "./sound";

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
