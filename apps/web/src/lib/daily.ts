import type { WorldId } from "@dcq/content-schema";

export interface DailyCandidate {
  world: WorldId;
  caseId: string;
}

export interface StreakState {
  /** Local date (YYYY-MM-DD) of the most recent win, or null. */
  last: string | null;
  count: number;
}

const STREAK_KEY = "dcq.streak";

/** Local calendar date as YYYY-MM-DD: "today" means the player's today. */
export function dateKey(date: Date): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  // Noon avoids daylight-saving edges when stepping back a day.
  return dateKey(new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - 1, 12));
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The same date always picks the same case, with no server involved. */
export function pickDaily(
  candidates: readonly DailyCandidate[],
  key: string,
): DailyCandidate | null {
  if (candidates.length === 0) return null;
  return candidates[hash(key) % candidates.length] ?? null;
}

/** Folds a win on `today` into the streak: same day keeps it, the next day extends it, a gap restarts it. */
export function recordStreakWin(state: StreakState, today: string): StreakState {
  if (state.last === today) return state;
  if (state.last === previousDay(today)) return { last: today, count: state.count + 1 };
  return { last: today, count: 1 };
}

/** The streak to show: it is still alive if the last win was today or yesterday. */
export function currentStreak(state: StreakState, today: string): number {
  if (state.last === today || state.last === previousDay(today)) return state.count;
  return 0;
}

export function loadStreak(): StreakState {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return { last: null, count: 0 };
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    if (typeof parsed.last === "string" && typeof parsed.count === "number") {
      return { last: parsed.last, count: Math.max(0, Math.floor(parsed.count)) };
    }
  } catch {
    // Unreadable storage just means no streak yet.
  }
  return { last: null, count: 0 };
}

export function persistStreak(state: StreakState): void {
  try {
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(state));
  } catch {
    // Not remembered; the streak simply restarts next visit.
  }
}
