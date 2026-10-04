/**
 * localStorage that never throws. Storage can be blocked (private windows,
 * strict privacy settings), full, or missing; none of that should ever crash
 * the app. A failed write just means the choice is not remembered.
 */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored. */
export function writeStored(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
