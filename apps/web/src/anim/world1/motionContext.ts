/**
 * One-shot event-triggered timelines (recoil, shatter, diff flash) just
 * re-check the media query at invocation time — they're short-lived and
 * naturally pick up a changed OS preference on the next run. Continuous
 * idle effects (CRT flicker, boot cursor) use gsap.matchMedia() directly
 * in their own module so a live preference change is honored while mounted.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
