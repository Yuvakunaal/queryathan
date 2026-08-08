import gsap from "gsap";
import { prefersReducedMotion } from "./motionContext";

export interface FightRevealTargets {
  railEl: HTMLElement | null;
  commandRailEl: HTMLElement | null;
  battlefieldEl: HTMLElement | null;
}

/**
 * The fight layout's mount-in moment — previously an instant hard cut
 * straight from the boot sequence. The battlefield (HP band + dataframe
 * grid) gets its own distinct slide-down: it drops into place like a panel
 * deploying, separate from the status rail/command rail's plainer fade —
 * "the dataframe IS the battlefield" earns the more deliberate entrance.
 */
export function playFightReveal({
  railEl,
  commandRailEl,
  battlefieldEl,
}: FightRevealTargets): void {
  const targets = [railEl, commandRailEl, battlefieldEl].filter(
    (el): el is HTMLElement => el !== null,
  );
  if (targets.length === 0) return;

  if (prefersReducedMotion()) {
    gsap.fromTo(
      targets,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power1.inOut" },
    );
    return;
  }

  const tl = gsap.timeline();
  if (railEl) {
    tl.fromTo(
      railEl,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" },
      0,
    );
  }
  if (commandRailEl) {
    tl.fromTo(
      commandRailEl,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.32, ease: "power2.out" },
      0.06,
    );
  }
  if (battlefieldEl) {
    tl.fromTo(
      battlefieldEl,
      { opacity: 0, y: -28 },
      { opacity: 1, y: 0, duration: 0.46, ease: "power3.out" },
      0.1,
    );
  }
}
