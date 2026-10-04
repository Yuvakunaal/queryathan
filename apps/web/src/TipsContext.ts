import { createContext, useContext } from "react";

/** Where the Tips dialog can put text: the editor of the fight that is open, if any. */
export interface Inserter {
  language: "sql" | "python";
  insert: (text: string) => void;
}

export interface TipsApi {
  /** Opens the Tips dialog (the book button in every top bar). */
  open: () => void;
  /** A fight registers its editor while it is open and clears it when it closes. */
  registerInserter: (inserter: Inserter | null) => void;
}

const NOOP: TipsApi = { open: () => undefined, registerInserter: () => undefined };

/** Lets any screen open the Tips dialog, which lives once at the top of the app, and lets a fight offer its editor to it. */
const TipsContext = createContext<TipsApi>(NOOP);

export const TipsProvider = TipsContext.Provider;

export function useTips(): TipsApi {
  return useContext(TipsContext);
}
