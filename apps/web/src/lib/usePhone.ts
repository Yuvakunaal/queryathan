import { useSyncExternalStore } from "react";

/** The widest screen that gets the phone layout. Desktop and tablet are never affected. */
export const PHONE_QUERY = "(max-width: 720px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

/** True on a phone-sized screen (720px wide or less), and follows the screen if it is resized or turned. */
export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}
