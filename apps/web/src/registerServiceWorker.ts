/**
 * Registers the offline cache (public/sw.js) in production builds only: in
 * development a cache-first worker would hide edits. Failure is silent and
 * harmless: the app works the same, just not offline.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // No offline support in this browser or context; nothing else depends on it.
    });
  });
}
