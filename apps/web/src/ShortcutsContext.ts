import { createContext, useContext } from "react";

/** Lets any screen's "?" button open the keyboard shortcuts sheet, which lives once at the top of the app. */
const ShortcutsContext = createContext<() => void>(() => undefined);

export const ShortcutsProvider = ShortcutsContext.Provider;

export function useOpenShortcuts(): () => void {
  return useContext(ShortcutsContext);
}
