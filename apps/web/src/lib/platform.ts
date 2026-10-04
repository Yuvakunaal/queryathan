/** True on Apple devices, where the main shortcut key is Command rather than Control. */
export const isMac: boolean =
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.userAgent);

/** "Cmd" on a Mac, "Ctrl" elsewhere. */
export const MOD_KEY: string = isMac ? "Cmd" : "Ctrl";
