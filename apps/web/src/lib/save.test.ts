import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  emptySaveData,
  exportSaveAsJson,
  getWorldProgress,
  importSaveFromJson,
  loadSave,
  persistSave,
  maxTechniquesForWorld,
  rankForWorld,
  recordCaseWin,
} from "./save";
import type { SaveData } from "./save";

describe("recordCaseWin", () => {
  it("adds the case to clearedCaseIds and awards XP for each technique", () => {
    const save = emptySaveData();
    const next = recordCaseWin(save, "boss-fights", "w1-01-nul-sentinel", ["no_nulls"]);
    const progress = getWorldProgress(next, "boss-fights");
    expect(progress.clearedCaseIds).toEqual(["w1-01-nul-sentinel"]);
    expect(progress.masteredTechniques).toEqual(["no_nulls"]);
    expect(progress.xp).toBe(100);
  });

  it("awards XP per distinct technique on a stacked win", () => {
    const save = emptySaveData();
    const next = recordCaseWin(save, "boss-fights", "w1-05-mid", [
      "no_nulls",
      "no_whitespace",
      "consistent_casing",
    ]);
    expect(getWorldProgress(next, "boss-fights").xp).toBe(300);
  });

  it("does not award XP again or duplicate the case id when re-clearing", () => {
    const save = recordCaseWin(emptySaveData(), "boss-fights", "w1-01-nul-sentinel", [
      "no_nulls",
    ]);
    const next = recordCaseWin(save, "boss-fights", "w1-01-nul-sentinel", ["no_nulls"]);
    const progress = getWorldProgress(next, "boss-fights");
    expect(progress.clearedCaseIds).toEqual(["w1-01-nul-sentinel"]);
    expect(progress.xp).toBe(100);
  });

  it("accumulates mastered techniques across different cases without duplicates", () => {
    let save = emptySaveData();
    save = recordCaseWin(save, "boss-fights", "w1-01-nul-sentinel", ["no_nulls"]);
    save = recordCaseWin(save, "boss-fights", "w1-02-double-take", [
      "no_nulls",
      "no_duplicates",
    ]);
    const progress = getWorldProgress(save, "boss-fights");
    expect(progress.masteredTechniques.sort()).toEqual(["no_duplicates", "no_nulls"]);
    // First win: 100 XP. Second win: only no_duplicates is new content-wise,
    // but XP is awarded per technique the case exercises, not just newly
    // mastered ones — repeated practice of a technique still counts.
    expect(progress.xp).toBe(300);
  });

  it("does not affect other worlds' progress", () => {
    const save = recordCaseWin(emptySaveData(), "boss-fights", "w1-01", ["no_nulls"]);
    expect(getWorldProgress(save, "the-vault")).toEqual({
      clearedCaseIds: [],
      masteredTechniques: [],
      xp: 0,
    });
  });
});

describe("rankForWorld", () => {
  it("returns Recruit at zero mastered techniques", () => {
    expect(rankForWorld("boss-fights", 0)).toBe("Recruit");
  });

  it("returns Cleaner at 1-2 mastered techniques", () => {
    expect(rankForWorld("boss-fights", 1)).toBe("Cleaner");
    expect(rankForWorld("boss-fights", 2)).toBe("Cleaner");
  });

  it("returns Debugger at 3-4 mastered techniques", () => {
    expect(rankForWorld("boss-fights", 3)).toBe("Debugger");
    expect(rankForWorld("boss-fights", 4)).toBe("Debugger");
  });

  it("returns Data Sentinel once all 6 techniques are mastered", () => {
    expect(rankForWorld("boss-fights", 6)).toBe("Data Sentinel");
  });

  it("falls back to a single Recruit tier for worlds without techniques defined yet", () => {
    expect(rankForWorld("the-vault", 0)).toBe("Recruit");
  });
});

describe("maxTechniquesForWorld", () => {
  it("returns 6 for boss-fights", () => {
    expect(maxTechniquesForWorld("boss-fights")).toBe(6);
  });

  it("returns the top technique count for each world", () => {
    expect(maxTechniquesForWorld("the-vault")).toBe(5);
    expect(maxTechniquesForWorld("the-twins")).toBe(6);
    expect(maxTechniquesForWorld("the-architect")).toBe(6);
    expect(maxTechniquesForWorld("the-foundry")).toBe(4);
    expect(maxTechniquesForWorld("the-observatory")).toBe(6);
    expect(maxTechniquesForWorld("the-labyrinth")).toBe(6);
    expect(maxTechniquesForWorld("the-timekeeper")).toBe(6);
    expect(maxTechniquesForWorld("the-laboratory")).toBe(6);
  });
});

describe("exportSaveAsJson / importSaveFromJson", () => {
  it("round-trips a save through export and import", () => {
    const save = recordCaseWin(emptySaveData(), "boss-fights", "w1-01", ["no_nulls"]);
    const imported = importSaveFromJson(exportSaveAsJson(save));
    expect(imported).toEqual(save);
  });

  it("returns null for malformed JSON", () => {
    expect(importSaveFromJson("{not json")).toBeNull();
  });

  it("returns null for well-formed JSON that doesn't match the schema", () => {
    expect(importSaveFromJson(JSON.stringify({ hello: "world" }))).toBeNull();
  });

  it("returns null for a save with an unsupported version", () => {
    expect(importSaveFromJson(JSON.stringify({ version: 2, worlds: {} }))).toBeNull();
  });
});

describe("loadSave / persistSave", () => {
  const originalLocalStorage = window.localStorage;
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  });

  it("returns empty save data when nothing has been persisted", () => {
    expect(loadSave()).toEqual(emptySaveData());
  });

  it("round-trips a save through persistSave and loadSave", () => {
    const save = recordCaseWin(emptySaveData(), "boss-fights", "w1-01", ["no_nulls"]);
    persistSave(save);
    expect(loadSave()).toEqual(save);
  });

  it("falls back to empty save data when localStorage holds invalid JSON", () => {
    store.set("dcq.save", "{not json");
    expect(loadSave()).toEqual(emptySaveData());
  });

  it("falls back to empty save data when localStorage holds a value that fails schema validation", () => {
    store.set(
      "dcq.save",
      JSON.stringify({ nonsense: true } satisfies Record<string, unknown>),
    );
    expect(loadSave()).toEqual(emptySaveData());
  });
});

describe("SaveData type sanity", () => {
  it("emptySaveData produces schema-valid output", () => {
    const save: SaveData = emptySaveData();
    expect(save.version).toBe(1);
    expect(save.worlds).toEqual({});
  });
});
