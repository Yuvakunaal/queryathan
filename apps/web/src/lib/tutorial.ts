const TUTORIAL_STORAGE_KEY = "dcq.tutorialSeen";

/** Storage can throw (private windows, blocked site data), so a failure just means "show the tutorial". */
export function hasSeenTutorial(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTutorialSeen(): void {
  try {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
  } catch {
    // Nothing to do: the tutorial will simply show again next visit.
  }
}
