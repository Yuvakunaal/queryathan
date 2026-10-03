import gsap from "gsap";
import { prefersReducedMotion } from "./motionContext";

/** Staggered fade-up for the engine tiles — the only motion this screen needs before a player commits to a choice. */
export function playEngineSelectReveal(tileEls: HTMLElement[]): void {
  if (tileEls.length === 0) return;

  if (prefersReducedMotion()) {
    gsap.set(tileEls, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(
    tileEls,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.08 },
  );
}
