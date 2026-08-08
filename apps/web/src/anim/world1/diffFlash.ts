import gsap from "gsap";
import { prefersReducedMotion } from "./motionContext";

const DIFF_DEL_RGB = "var(--w1-diff-del-rgb)";
const DIFF_ADD_RGB = "var(--w1-diff-add-rgb)";

export interface DiffCellRefs {
  cellEl: HTMLElement;
  gutterEl: HTMLElement;
  oldEl: HTMLElement;
  newEl: HTMLElement;
}

let activeMaster: gsap.core.Timeline | null = null;
let activeCells: DiffCellRefs[] = [];

/**
 * Wave travels in reading order (ascending row, then column) — the same
 * direction the eye scans a grid, so simultaneous changes read as a sweep.
 * Contrast with the HP shatter's randomized stagger (spec §7.2).
 *
 * If a previous wave is still playing (the player ran again mid-animation),
 * it's killed and its cells' inline styles are cleared before the new wave
 * starts, so nothing strands a non-zero --w1-diff-alpha or a stray y-offset
 * on a recycled cell.
 */
export function playDiffFlashBatch(cells: DiffCellRefs[]): gsap.core.Timeline {
  activeMaster?.kill();
  if (activeCells.length > 0) {
    const staleTargets = activeCells.flatMap((c) => [
      c.cellEl,
      c.oldEl,
      c.newEl,
      c.gutterEl,
    ]);
    gsap.set(staleTargets, { clearProps: "all" });
  }

  const reduced = prefersReducedMotion();
  const count = Math.max(1, cells.length);
  const eachMs = reduced ? Math.min(12, 400 / count) : Math.min(26, 900 / count);

  const master = gsap.timeline();
  cells.forEach((cell, i) => {
    master.add(buildCellTimeline(cell, reduced), (i * eachMs) / 1000);
  });

  activeMaster = master;
  activeCells = cells;
  return master;
}

function buildCellTimeline(
  { cellEl, gutterEl, oldEl, newEl }: DiffCellRefs,
  reduced: boolean,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  if (reduced) {
    tl.set(cellEl, { "--w1-diff-color": DIFF_DEL_RGB })
      .set(gutterEl, { textContent: "-", opacity: 1 })
      .set(oldEl, { opacity: 1, y: 0 })
      .to(cellEl, { "--w1-diff-alpha": 0.18, duration: 0.24, ease: "power1.inOut" }, 0)
      .fromTo(
        oldEl,
        { opacity: 1 },
        { opacity: 0, duration: 0.24, ease: "power1.inOut" },
        0,
      )
      .fromTo(
        newEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.24, ease: "power1.inOut" },
        0,
      )
      .set(gutterEl, { textContent: "+" }, 0.12)
      .set(cellEl, { "--w1-diff-color": DIFF_ADD_RGB }, 0.12)
      .to(cellEl, { "--w1-diff-alpha": 0, duration: 0.24, ease: "power1.inOut" }, 0.36)
      .to(gutterEl, { opacity: 0, duration: 0.24, ease: "power1.inOut" }, 0.36)
      .to(
        newEl,
        { color: "var(--w1-text-primary)", duration: 0.24, ease: "power1.inOut" },
        0.36,
      )
      .set(oldEl, { textContent: "" });
    return tl;
  }

  tl.set(cellEl, { "--w1-diff-color": DIFF_DEL_RGB })
    .set(gutterEl, { textContent: "-", opacity: 1 })
    .set(oldEl, { opacity: 1, y: 0 })
    .to(cellEl, { "--w1-diff-alpha": 0.3, duration: 0.14, ease: "power2.out" }, 0)
    .fromTo(
      oldEl,
      { opacity: 1, y: 0 },
      { opacity: 0, y: -6, duration: 0.14, ease: "power2.out" },
      0,
    )
    // 0.14 -> 0.16 : the cut. Both spans invisible, no tween.
    .set(gutterEl, { textContent: "+" }, 0.16)
    .set(cellEl, { "--w1-diff-color": DIFF_ADD_RGB }, 0.16)
    .fromTo(
      newEl,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.16, ease: "power3.out" },
      0.16,
    )
    // 0.32 -> 0.48 : hold, read the new value.
    .to(cellEl, { "--w1-diff-alpha": 0, duration: 0.24, ease: "power1.inOut" }, 0.48)
    .to(gutterEl, { opacity: 0, duration: 0.24, ease: "power1.inOut" }, 0.48)
    .to(
      newEl,
      { color: "var(--w1-text-primary)", duration: 0.24, ease: "power1.inOut" },
      0.48,
    )
    .set(oldEl, { textContent: "" });
  return tl;
}
