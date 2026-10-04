import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { defaultA11y, loadA11yState, persistA11yState } from "./a11y";
import type { A11yState } from "./a11y";

beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
});

describe("defaultA11y", () => {
  it("defaults to the middle text scale, CRT effect off, no high contrast", () => {
    expect(defaultA11y()).toEqual({
      textScaleIndex: 1,
      theme: "dark",
      crtReduced: true,
      highContrast: false,
      sound: true,
      typing: true,
      volume: 0.8,
    });
  });
});

describe("loadA11yState / persistA11yState", () => {
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
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  });

  it("returns the default state when nothing has been persisted", () => {
    expect(loadA11yState()).toEqual(defaultA11y());
  });

  it("round-trips a persisted state", () => {
    const state: A11yState = {
      textScaleIndex: 3,
      theme: "light",
      crtReduced: true,
      highContrast: true,
      sound: true,
      typing: true,
      volume: 0.8,
    };
    persistA11yState(state);
    expect(loadA11yState()).toEqual(state);
  });

  it("falls back to defaults for a partially-corrupt stored value", () => {
    store.set("dcq.a11y", JSON.stringify({ textScaleIndex: 2 }));
    expect(loadA11yState()).toEqual({
      textScaleIndex: 2,
      theme: "dark",
      crtReduced: true,
      highContrast: false,
      sound: true,
      typing: true,
      volume: 0.8,
    });
  });

  it("falls back to defaults entirely for invalid JSON", () => {
    store.set("dcq.a11y", "{not json");
    expect(loadA11yState()).toEqual(defaultA11y());
  });
});
