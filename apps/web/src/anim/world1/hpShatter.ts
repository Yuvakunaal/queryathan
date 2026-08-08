import gsap from "gsap";
import { prefersReducedMotion } from "./motionContext";

export interface SegmentShatterOptions {
  segEl: HTMLElement;
  /** The three <b> shard children, empty for reduced motion (no shards fire). */
  shardEls: HTMLElement[];
  oldHeightPx: number;
  newHeightPx: number;
  newColor: string;
}

/**
 * Every segment whose level dropped, staggered in random order (spec §8b) —
 * contrast with the diff flash's ordered reading-order wave. The DOM's own
 * height/level must already reflect newHeightPx before this runs; the
 * animation starts scaled up to look like the old height and settles to its
 * true native size.
 */
export function playHpShatterBatch(segments: SegmentShatterOptions[]): void {
  const each = 0.018;
  for (const [i, seg] of shuffle(segments).entries()) {
    playSegmentShatter(seg, i * each);
  }
}

export function tweenHpCounter(
  numEl: HTMLElement,
  meterEl: HTMLElement,
  prevCount: number,
  nextCount: number,
): void {
  if (prefersReducedMotion()) {
    numEl.textContent = String(nextCount).padStart(3, "0");
    meterEl.setAttribute("aria-valuenow", String(nextCount));
    return;
  }

  const counter = { v: prevCount };
  gsap.to(counter, {
    v: nextCount,
    duration: 0.5,
    ease: "power2.out",
    snap: { v: 1 },
    onUpdate: () => {
      numEl.textContent = String(Math.round(counter.v)).padStart(3, "0");
    },
    onComplete: () => {
      meterEl.setAttribute("aria-valuenow", String(nextCount));
    },
  });
}

function playSegmentShatter(
  { segEl, shardEls, oldHeightPx, newHeightPx, newColor }: SegmentShatterOptions,
  delay: number,
): void {
  const startScale = oldHeightPx / newHeightPx;

  if (prefersReducedMotion()) {
    gsap.fromTo(
      segEl,
      { scaleY: startScale },
      {
        scaleY: 1,
        duration: 0.3,
        ease: "none",
        delay,
        onComplete: () => {
          gsap.set(segEl, { clearProps: "scaleY" });
        },
      },
    );
    gsap.to(segEl, {
      "--seg-color": newColor,
      duration: 0.3,
      ease: "none",
      delay,
      onComplete: () => {
        gsap.set(segEl, { clearProps: "--seg-color" });
      },
    });
    return;
  }

  if (shardEls.length > 0) {
    gsap.set(shardEls, { visibility: "visible" });
    gsap.to(shardEls, {
      y: () => gsap.utils.random(18, 30),
      x: () => gsap.utils.random(-9, 9),
      rotation: () => gsap.utils.random(-80, 80),
      opacity: 0,
      duration: 0.42,
      ease: "power2.in",
      delay,
      stagger: { each: 0.02, from: "random" },
      onComplete: () => {
        gsap.set(shardEls, { visibility: "hidden", clearProps: "transform,opacity" });
      },
    });
  }

  gsap.fromTo(
    segEl,
    { scaleY: startScale },
    {
      scaleY: 1,
      duration: 0.28,
      ease: "back.in(2.2)",
      transformOrigin: "bottom center",
      delay,
      onComplete: () => {
        gsap.set(segEl, { clearProps: "scaleY" });
      },
    },
  );

  gsap.to(segEl, {
    "--seg-color": newColor,
    duration: 0.3,
    ease: "power1.inOut",
    delay,
    onComplete: () => {
      // Once settled, hand control back to the CSS [data-level] rule so
      // [data-dcq-contrast="high"]'s redefined ramp tokens actually apply.
      gsap.set(segEl, { clearProps: "--seg-color" });
    },
  });
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}
