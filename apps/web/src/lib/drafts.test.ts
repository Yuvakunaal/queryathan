import { afterEach, describe, expect, it } from "vitest";
import { readDraft, writeDraft } from "./drafts";

describe("drafts", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("keeps what was typed, per case and engine", () => {
    writeDraft("w1-01", "sql", "SELECT 1;", "-- start");
    expect(readDraft("w1-01", "sql")).toBe("SELECT 1;");
    expect(readDraft("w1-01", "python")).toBeNull();
    expect(readDraft("w1-02", "sql")).toBeNull();
  });

  it("forgets a draft that is back to the starting code or empty", () => {
    writeDraft("w1-01", "sql", "SELECT 1;", "-- start");
    writeDraft("w1-01", "sql", "-- start", "-- start");
    expect(readDraft("w1-01", "sql")).toBeNull();
    writeDraft("w1-01", "sql", "SELECT 2;", "-- start");
    writeDraft("w1-01", "sql", "   ", "-- start");
    expect(readDraft("w1-01", "sql")).toBeNull();
  });
});
