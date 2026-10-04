import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { renderSigil } from "./sigil";
import { prefersReducedMotion } from "../../anim/world1/motionContext";
import styles from "./KillSequence.module.css";

export interface KillSequenceProps {
  bossName: string;
  /** "Boss cleared", "Lock opened", ... */
  clearedLabel: string;
  onDone: () => void;
}

/**
 * Where the cut runs, in percent of the stage box. The blade travels this
 * line, the SVG slash is drawn on it, and the two halves of the boss are
 * clipped along it, so all three always agree.
 */
const CUT = { x1: 70, y1: -4, x2: 30, y2: 104 } as const;
const CUT_AT_TOP = CUT.x1 + ((CUT.x2 - CUT.x1) * (0 - CUT.y1)) / (CUT.y2 - CUT.y1);
const CUT_AT_BOTTOM = CUT.x1 + ((CUT.x2 - CUT.x1) * (100 - CUT.y1)) / (CUT.y2 - CUT.y1);
const CLIP_A = `polygon(0 0, ${String(CUT_AT_TOP)}% 0, ${String(CUT_AT_BOTTOM)}% 100%, 0 100%)`;
const CLIP_B = `polygon(${String(CUT_AT_TOP)}% 0, 100% 0, 100% 100%, ${String(CUT_AT_BOTTOM)}% 100%)`;

const PARTICLE_COUNT = 44;
const FRAGMENT_CHARS = ["#", "=", ":", ".", "+", "|", "/", "0", "1"];

/** Point on the cut, as a fraction t from the top end to the bottom end. */
function pointOnCut(t: number): { x: number; y: number } {
  return { x: CUT.x1 + (CUT.x2 - CUT.x1) * t, y: CUT.y1 + (CUT.y2 - CUT.y1) * t };
}

/**
 * The moment of victory: the boss appears with its health bar, a blade cuts
 * it in two along a diagonal, the halves fly apart and burst into data
 * fragments, the health bar empties, the name is struck through, and the
 * outcome is stamped. About 2.8 seconds; click, Enter or Escape skips it.
 * Reduced-motion users get a short fade of the same message instead.
 */
export default function KillSequence({
  bossName,
  clearedLabel,
  onDone,
}: KillSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const bossRef = useRef<HTMLDivElement>(null);
  const halfARef = useRef<HTMLPreElement>(null);
  const halfBRef = useRef<HTMLPreElement>(null);
  const hpRef = useRef<HTMLDivElement>(null);
  const hpFillRef = useRef<HTMLDivElement>(null);
  const bladeRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<SVGLineElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const strikeRef = useRef<HTMLSpanElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const sigil = renderSigil(1, 1);
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        char: FRAGMENT_CHARS[(i * 7 + 3) % FRAGMENT_CHARS.length] ?? "#",
        t: (i % 11) / 10 + (i % 3) * 0.01,
      })),
    [],
  );

  function finish(): void {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timelineRef.current?.kill();
    const root = rootRef.current;
    if (!root) {
      onDoneRef.current();
      return;
    }
    gsap.to(root, {
      opacity: 0,
      duration: 0.22,
      ease: "power1.out",
      onComplete: () => {
        onDoneRef.current();
      },
    });
  }

  useEffect(() => {
    skipRef.current?.focus();
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        finish();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
    // finish only reads refs
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const ctx = gsap.context(() => {
      const caption = captionRef.current;
      if (prefersReducedMotion()) {
        gsap.set([bossRef.current, hpRef.current, bladeRef.current, streakRef.current], {
          display: "none",
        });
        const tl = gsap.timeline({ onComplete: finish });
        timelineRef.current = tl;
        tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3 })
          .fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1)
          .to({}, { duration: 0.9 });
        return;
      }

      const rect = stage.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const pxX = (percent: number): number => (percent / 100) * w;
      const pxY = (percent: number): number => (percent / 100) * h;
      // Blade tilt: the angle of the cut in real pixels (the stage is not square).
      const angle =
        (Math.atan2(pxX(CUT.x1 - CUT.x2), pxY(CUT.y2 - CUT.y1)) * 180) / Math.PI;
      const start = { x: pxX(CUT.x1 + 14), y: pxY(CUT.y1 - 22) };
      const end = { x: pxX(CUT.x2 - 14), y: pxY(CUT.y2 + 22) };
      const hit = pointOnCut(0.5);

      gsap.set(bladeRef.current, {
        x: start.x,
        y: start.y,
        rotation: angle - 16,
        xPercent: -50,
        yPercent: -50,
        opacity: 0,
      });
      gsap.set(streakRef.current, {
        x: pxX(hit.x),
        y: pxY(hit.y),
        rotation: angle,
        xPercent: -50,
        yPercent: -50,
        scaleY: 0,
        opacity: 0,
        transformOrigin: "50% 0%",
      });
      gsap.set(slashRef.current, {
        strokeDasharray: 200,
        strokeDashoffset: 200,
        opacity: 0,
      });
      gsap.set([halfARef.current, halfBRef.current], { transformOrigin: "50% 50%" });
      gsap.set(caption, { opacity: 0, scale: 1.5 });
      gsap.set(strikeRef.current, { scaleX: 0, transformOrigin: "0% 50%" });
      const bits = root.querySelectorAll<HTMLElement>("[data-fragment]");
      gsap.set(bits, { opacity: 0 });

      const tl = gsap.timeline({ onComplete: finish });
      timelineRef.current = tl;

      // 1. The boss arrives, with a short nervous twitch.
      tl.fromTo(
        root,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power1.out" },
        0,
      )
        .fromTo(
          bossRef.current,
          { opacity: 0, scale: 0.86, y: 18 },
          { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" },
          0.05,
        )
        .fromTo(
          haloRef.current,
          { opacity: 0, scale: 0.7 },
          { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" },
          0.05,
        )
        .fromTo(
          hpRef.current,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.3 },
          0.2,
        )
        .to(
          bossRef.current,
          { x: 3, duration: 0.04, yoyo: true, repeat: 5, ease: "none" },
          0.6,
        );

      // 2. The blade rises into view and draws back.
      tl.to(bladeRef.current, { opacity: 1, duration: 0.14 }, 0.62).to(
        bladeRef.current,
        { rotation: angle - 24, duration: 0.2, ease: "power2.out" },
        0.62,
      );

      // 3. The strike: one fast pass along the cut.
      const strike = 0.95;
      tl.to(
        bladeRef.current,
        { x: end.x, y: end.y, rotation: angle, duration: 0.2, ease: "power4.in" },
        strike,
      )
        .set(slashRef.current, { opacity: 1 }, strike + 0.07)
        .to(
          slashRef.current,
          { strokeDashoffset: 0, duration: 0.1, ease: "power2.out" },
          strike + 0.07,
        )
        .to(
          slashRef.current,
          { opacity: 0, duration: 0.7, ease: "power1.in" },
          strike + 0.25,
        )
        .fromTo(
          streakRef.current,
          { scaleY: 0, opacity: 0.9 },
          { scaleY: 1, opacity: 0, duration: 0.45, ease: "power2.out" },
          strike + 0.07,
        )
        .to(bladeRef.current, { opacity: 0, duration: 0.2 }, strike + 0.24);

      // 4. Impact: one soft flash, a shake, the health bar empties, the halves part.
      const impact = strike + 0.1;
      tl.fromTo(
        flashRef.current,
        { opacity: 0.4 },
        { opacity: 0, duration: 0.35, ease: "power2.out" },
        impact,
      )
        .to(
          stage,
          { x: -7, y: 4, duration: 0.045, yoyo: true, repeat: 7, ease: "none" },
          impact,
        )
        .to(stage, { x: 0, y: 0, duration: 0.05 }, impact + 0.4)
        .to(hpFillRef.current, { scaleX: 0, duration: 0.4, ease: "power3.out" }, impact)
        .to(
          halfARef.current,
          { x: -pxX(5), y: pxY(3), rotation: -3, duration: 0.55, ease: "power3.out" },
          impact,
        )
        .to(
          halfBRef.current,
          { x: pxX(5), y: -pxY(3), rotation: 3, duration: 0.55, ease: "power3.out" },
          impact,
        )
        .to(
          [halfARef.current, halfBRef.current],
          { opacity: 0, duration: 0.55, ease: "power1.in" },
          impact + 0.35,
        )
        .to(
          haloRef.current,
          { opacity: 0, scale: 1.25, duration: 0.8, ease: "power2.out" },
          impact,
        )
        .to(hpRef.current, { opacity: 0, duration: 0.3 }, impact + 0.6);

      // 5. Data fragments burst out of the cut and fall.
      bits.forEach((bit, i) => {
        const t = Number(bit.dataset.t ?? "0.5");
        const p = pointOnCut(t);
        const side = i % 2 === 0 ? -1 : 1;
        const spread = 40 + ((i * 37) % 90);
        gsap.set(bit, {
          x: pxX(p.x),
          y: pxY(p.y),
          xPercent: -50,
          yPercent: -50,
          scale: 0.8,
        });
        tl.to(
          bit,
          {
            keyframes: [
              { opacity: 1, duration: 0.05 },
              {
                x: pxX(p.x) + side * spread + ((i * 13) % 30),
                y: pxY(p.y) + 20 + ((i * 29) % 110),
                rotation: side * (30 + ((i * 17) % 160)),
                scale: 1 + ((i * 7) % 10) / 10,
                opacity: 0,
                duration: 0.95,
                ease: "power2.out",
              },
            ],
          },
          impact + 0.02,
        );
      });

      // 6. The name is struck through and the outcome stamped.
      tl.to(
        strikeRef.current,
        { scaleX: 1, duration: 0.25, ease: "power2.out" },
        impact + 0.45,
      )
        .to(nameRef.current, { opacity: 0.45, duration: 0.25 }, impact + 0.45)
        .to(
          caption,
          { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.2)" },
          impact + 0.6,
        )
        .to({}, { duration: 0.85 });
    }, root);

    return () => {
      ctx.revert();
    };
    // runs once on mount
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="status"
      aria-live="polite"
      onClick={finish}
    >
      <span className={styles.srOnly}>
        {bossName} defeated. {clearedLabel}.
      </span>
      <div className={styles.stage} ref={stageRef} aria-hidden="true">
        <div className={styles.halo} ref={haloRef} />
        <div className={styles.hp} ref={hpRef}>
          <span className={styles.hpName}>{bossName}</span>
          <span className={styles.hpTrack}>
            <span className={styles.hpFill} ref={hpFillRef} />
          </span>
        </div>
        <div className={styles.boss} ref={bossRef}>
          <pre className={styles.half} ref={halfARef} style={{ clipPath: CLIP_A }}>
            {sigil}
          </pre>
          <pre className={styles.half} ref={halfBRef} style={{ clipPath: CLIP_B }}>
            {sigil}
          </pre>
        </div>
        <svg
          className={styles.slashSvg}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            ref={slashRef}
            x1={CUT.x1}
            y1={CUT.y1}
            x2={CUT.x2}
            y2={CUT.y2}
            className={styles.slash}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className={styles.streak} ref={streakRef} />
        <div className={styles.blade} ref={bladeRef}>
          <svg viewBox="0 0 24 124" className={styles.bladeSvg}>
            <defs>
              <linearGradient id="kill-steel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#dfe7ee" />
                <stop offset="0.5" stopColor="#ffffff" />
                <stop offset="1" stopColor="#7d8a96" />
              </linearGradient>
            </defs>
            <polygon
              points="12,122 5.5,58 6.5,30 17.5,30 18.5,58"
              fill="url(#kill-steel)"
            />
            <line x1="12" y1="34" x2="12" y2="104" stroke="#9aa7b2" strokeWidth="0.8" />
            <rect x="1" y="24" width="22" height="6" rx="1.5" className={styles.guard} />
            <rect x="9" y="6" width="6" height="19" rx="1.5" className={styles.grip} />
            <circle cx="12" cy="4" r="3.6" className={styles.guard} />
          </svg>
        </div>
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={styles.fragment}
            data-fragment=""
            data-t={particle.t}
          >
            {particle.char}
          </span>
        ))}
        <div className={styles.caption} ref={captionRef}>
          <span className={styles.captionName}>
            <span ref={nameRef}>{bossName}</span>
            <span className={styles.strike} ref={strikeRef} />
          </span>
          <span className={styles.captionLabel}>{clearedLabel}</span>
        </div>
      </div>
      <div className={styles.flash} ref={flashRef} />
      <button type="button" className={styles.skip} ref={skipRef} onClick={finish}>
        Skip
      </button>
    </div>
  );
}
