import gsap from "gsap";
import { prefersReducedMotion } from "./motionContext";

// Mirrors theme.css tokens — GSAP's color interpolation needs resolvable
// values, not var() references, so these are kept in sync by hand.
const AMBER_500 = "#FFB000";
const RULE_STRONG = "#2A3A33";

export interface RecoilOptions {
  battlefieldEl: HTMLElement;
  crtEl: HTMLElement | null;
  clearedThisTurn: number;
  totalAffliction: number;
}

/** Boss-hit recoil — the grid IS the boss, so the battlefield wrapper recoils. */
export function playBossHitRecoil({
  battlefieldEl,
  crtEl,
  clearedThisTurn,
  totalAffliction,
}: RecoilOptions): void {
  if (clearedThisTurn <= 0) {
    playNoProgressFlash(battlefieldEl);
    return;
  }

  if (prefersReducedMotion()) {
    playReducedRecoil(battlefieldEl);
    return;
  }

  const amp = gsap.utils.clamp(
    4,
    14,
    9 * (totalAffliction > 0 ? clearedThisTurn / totalAffliction : 0),
  );

  gsap
    .timeline()
    .to(battlefieldEl, { x: -amp, skewX: 1.2, duration: 0.07, ease: "power4.out" })
    .to(battlefieldEl, {
      x: amp * 0.45,
      skewX: 0.4,
      duration: 0.04,
      ease: "power2.inOut",
    })
    .to(battlefieldEl, { x: 0, skewX: 0, duration: 0.31, ease: "elastic.out(1, 0.45)" });

  gsap
    .timeline()
    .to(battlefieldEl, { "--w1-chromatic": 2.5, duration: 0.1, ease: "power2.out" }, 0)
    .to(battlefieldEl, { "--w1-chromatic": 0, duration: 0.1, ease: "power2.in" }, 0.1);

  if (crtEl) {
    gsap
      .timeline()
      .to(crtEl, { "--w1-crt-opacity": 0.55, duration: 0.045, ease: "power2.out" }, 0)
      .to(crtEl, { "--w1-crt-opacity": 1, duration: 0.045, ease: "power2.in" }, 0.045);
  }
}

function playReducedRecoil(battlefieldEl: HTMLElement): void {
  gsap
    .timeline()
    .to(battlefieldEl, { "--w1-hit-tint": 0.18, duration: 0.1, ease: "power2.out" })
    .to(battlefieldEl, { "--w1-hit-tint": 0, duration: 0.16, ease: "power1.inOut" });
  gsap
    .timeline()
    .to(battlefieldEl, { borderColor: "#35F06B", duration: 0.13, ease: "power2.out" })
    .to(battlefieldEl, {
      borderColor: RULE_STRONG,
      duration: 0.13,
      ease: "power1.inOut",
    });
}

/** A run that changed cells but cleared nothing — silence would read as a bug. */
function playNoProgressFlash(battlefieldEl: HTMLElement): void {
  gsap
    .timeline()
    .to(battlefieldEl, { borderColor: AMBER_500, duration: 0.1 })
    .to(battlefieldEl, { borderColor: RULE_STRONG, duration: 0.1 });
}
