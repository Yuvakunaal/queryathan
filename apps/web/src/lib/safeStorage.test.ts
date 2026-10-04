import { afterEach, describe, expect, it, vi } from "vitest";
import { readStored, removeStored, writeStored } from "./safeStorage";

describe("safeStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("stores, reads and removes", () => {
    expect(writeStored("k", "v")).toBe(true);
    expect(readStored("k")).toBe("v");
    removeStored("k");
    expect(readStored("k")).toBeNull();
  });

  it("never throws when storage refuses", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(writeStored("k", "v")).toBe(false);
    expect(readStored("k")).toBeNull();
    expect(() => {
      removeStored("k");
    }).not.toThrow();
  });
});
