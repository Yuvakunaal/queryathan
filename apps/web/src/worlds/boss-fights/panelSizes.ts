const RAIL_KEY = "dcq.railWidth";
const BRIEFING_KEY = "dcq.briefingHeight";

/** Storage can throw (private windows, blocked site data); a failed read just means "use the default size". */
export function loadPanelSize(key: "rail" | "briefing"): number | null {
  try {
    const raw = window.localStorage.getItem(key === "rail" ? RAIL_KEY : BRIEFING_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function savePanelSize(key: "rail" | "briefing", px: number | null): void {
  try {
    const storageKey = key === "rail" ? RAIL_KEY : BRIEFING_KEY;
    if (px === null) window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, String(Math.round(px)));
  } catch {
    // The size just will not be remembered.
  }
}
