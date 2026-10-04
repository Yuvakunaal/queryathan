import { describe, expect, it } from "vitest";
import { currentStreak, dateKey, pickDaily, recordStreakWin } from "./daily";

const pool = [
  { world: "boss-fights", caseId: "a" },
  { world: "the-vault", caseId: "b" },
  { world: "the-twins", caseId: "c" },
] as const;

describe("daily case", () => {
  it("is stable for a date and handles an empty pool", () => {
    expect(pickDaily(pool, "2026-10-04")).toEqual(pickDaily(pool, "2026-10-04"));
    expect(pickDaily([], "2026-10-04")).toBeNull();
  });

  it("varies across dates", () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 28; day += 1) {
      seen.add(pickDaily(pool, `2026-10-${String(day).padStart(2, "0")}`)?.caseId ?? "");
    }
    expect(seen.size).toBe(3);
  });
});

describe("streak", () => {
  it("formats local dates", () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("extends on consecutive days, holds within a day, restarts after a gap", () => {
    const day1 = recordStreakWin({ last: null, count: 0 }, "2026-02-28");
    expect(day1).toEqual({ last: "2026-02-28", count: 1 });
    expect(recordStreakWin(day1, "2026-02-28")).toBe(day1);
    const day2 = recordStreakWin(day1, "2026-03-01");
    expect(day2).toEqual({ last: "2026-03-01", count: 2 });
    expect(recordStreakWin(day2, "2026-03-04")).toEqual({ last: "2026-03-04", count: 1 });
  });

  it("shows a streak only while it is still alive", () => {
    const state = { last: "2026-03-01", count: 4 };
    expect(currentStreak(state, "2026-03-01")).toBe(4);
    expect(currentStreak(state, "2026-03-02")).toBe(4);
    expect(currentStreak(state, "2026-03-03")).toBe(0);
  });
});
