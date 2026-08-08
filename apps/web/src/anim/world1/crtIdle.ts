import gsap from "gsap";

const FLICKER_STEPS = 24;

/**
 * Mounts the CRT flicker + roll-bar idle effects, scoped with
 * gsap.matchMedia() so a live prefers-reduced-motion change is honored
 * without a remount. Returns a cleanup function to call on unmount.
 */
export function mountCrtIdle(
  crtEl: HTMLElement,
  rollBarEl: HTMLElement | null,
): () => void {
  const mm = gsap.matchMedia();

  mm.add(
    {
      reduced: "(prefers-reduced-motion: reduce)",
      normal: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      const conditions = context.conditions as { reduced: boolean } | undefined;

      if (conditions?.reduced) {
        gsap.set(crtEl, { "--w1-crt-opacity": 1 });
        return;
      }

      // repeatRefresh re-evaluates every function-valued target/duration on
      // each loop, so the flicker never settles into an obviously repeating
      // pattern — a phosphor instability, not a metronome.
      const flicker = gsap.timeline({ repeat: -1, repeatRefresh: true });
      for (let i = 0; i < FLICKER_STEPS; i++) {
        flicker.to(crtEl, {
          "--w1-crt-opacity": () => gsap.utils.random(0.94, 1),
          duration: () => gsap.utils.random(0.08, 0.5, 0.01),
          ease: "none",
        });
      }

      let rollTween: gsap.core.Tween | null = null;
      if (rollBarEl) {
        rollTween = gsap.fromTo(
          rollBarEl,
          { y: -140 },
          { y: "100vh", duration: 9, ease: "none", repeat: -1, repeatDelay: 6 },
        );
      }

      return () => {
        flicker.kill();
        rollTween?.kill();
      };
    },
  );

  return () => {
    mm.revert();
  };
}
