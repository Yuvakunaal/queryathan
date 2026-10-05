import { useEffect, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import type { WorldMeta } from "../../lib/world-meta";
import { prefersReducedMotion } from "../../anim/world1/motionContext";
import Planet from "./Planet";
import styles from "./TravelSequence.module.css";

export interface TravelSequenceProps {
  world: WorldMeta;
  /** Called once the screen is fully hidden behind the flight: the moment to switch screens. */
  onCovered: () => void;
  /** Called when the flight has faded out and can be removed. */
  onDone: () => void;
  /** Called when the flight is cut short, so its sound can be faded out. */
  onSkip?: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

const STAR_COUNT = 280;

/** A perspective starfield on a canvas. `speed.v` is how fast the stars rush past; above ~4 they stretch into streaks. */
function runStars(
  canvas: HTMLCanvasElement,
  speed: { v: number },
  tint: string,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;
  let width = 0;
  let height = 0;
  const resize = (): void => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const spawn = (z: number): Star => ({
    x: (Math.random() * 2 - 1) * 1.4,
    y: (Math.random() * 2 - 1) * 1.4,
    z,
  });
  const stars = Array.from({ length: STAR_COUNT }, () =>
    spawn(0.08 + Math.random() * 0.92),
  );
  let last = performance.now();
  const tick = (): void => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height * 0.44;
    const focal = Math.min(width, height) * 0.55;
    const v = speed.v;
    for (let i = 0; i < stars.length; i += 1) {
      const s = stars[i];
      if (!s) continue;
      s.z -= v * dt * 0.42;
      const px = cx + (s.x / s.z) * focal;
      const py = cy + (s.y / s.z) * focal;
      if (s.z <= 0.02 || px < -40 || px > width + 40 || py < -40 || py > height + 40) {
        stars[i] = spawn(1);
        continue;
      }
      const tail = Math.max(0.0015, v * 0.0115);
      const bx = cx + (s.x / (s.z + tail)) * focal;
      const by = cy + (s.y / (s.z + tail)) * focal;
      const near = 1 - s.z;
      ctx.lineWidth = 0.5 + near * 2.1;
      ctx.globalAlpha = Math.min(1, 0.18 + near * 0.95);
      ctx.strokeStyle = v > 5 && near > 0.45 ? tint : "#e9f0ff";
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  gsap.ticker.add(tick);
  window.addEventListener("resize", resize);
  return () => {
    gsap.ticker.remove(tick);
    window.removeEventListener("resize", resize);
  };
}

/**
 * The flight to a world: the rocket lifts off, the stars stretch into a warp,
 * the destination planet swells out of the dark, and the flight fades to reveal
 * the world. About 3.5 seconds; click, Enter, Space or Escape skips it. People
 * who ask their system for reduced motion get a short, still arrival card.
 */
export default function TravelSequence({
  world,
  onCovered,
  onDone,
  onSkip,
}: TravelSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planetRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<SVGGElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const atmosRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const legsRef = useRef<SVGGElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const departRef = useRef<HTMLDivElement>(null);
  const arriveRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const finishedRef = useRef(false);
  const coveredRef = useRef(false);
  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  onCoveredRef.current = onCovered;
  onDoneRef.current = onDone;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  function cover(): void {
    if (coveredRef.current) return;
    coveredRef.current = true;
    onCoveredRef.current();
  }

  function finish(skipped = true): void {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (skipped) onSkipRef.current?.();
    cover();
    timelineRef.current?.kill();
    const root = rootRef.current;
    if (!root) {
      onDoneRef.current();
      return;
    }
    gsap.to(root, {
      opacity: 0,
      duration: 0.25,
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
      } else if (event.key === "Tab") {
        // The skip button is the only control; keep focus on it.
        event.preventDefault();
        skipRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
    // finish only reads refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let stopStars: () => void = () => undefined;
    const ctx = gsap.context(() => {
      const planet = planetRef.current;
      const rocket = rocketRef.current;
      if (!planet || !rocket) return;

      if (prefersReducedMotion()) {
        gsap.set(
          [
            rocket,
            warpRef.current,
            departRef.current,
            orbitRef.current,
            atmosRef.current,
            dustRef.current,
          ],
          { display: "none" },
        );
        gsap.set(planet, { scale: 0.8, opacity: 1 });
        gsap.set(arriveRef.current, { opacity: 1 });
        const tl = gsap.timeline({
          onComplete: () => {
            finish(false);
          },
        });
        timelineRef.current = tl;
        tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25 })
          .call(cover)
          .to({}, { duration: 0.9 })
          .to(fillRef.current, { scaleX: 1, duration: 0.01 });
        return;
      }

      const height = window.innerHeight;
      const light = document.documentElement.dataset.dcqTheme === "light";
      const speed = { v: 0.12 };
      if (canvasRef.current)
        stopStars = runStars(canvasRef.current, speed, world.planet.light);

      // Where the planet's surface ends up once we have descended: its top edge at 72% of the screen.
      const size = planet.offsetWidth;
      const kFinal = 5.2;
      const limbTop = height * 0.72;
      const planetDrop = limbTop - height * 0.44 + 0.34 * size * kFinal;
      // The rocket's feet (at 80% of its height) rest on that edge.
      const rocketH = rocket.offsetHeight;
      const landScale = 0.95;
      const landY = limbTop - height * 0.5 - 0.3 * rocketH * landScale + 3;

      gsap.set(root, { opacity: 0 });
      gsap.set(planet, { scale: 0.04, opacity: 0, y: 0, transformOrigin: "50% 50%" });
      gsap.set(rocket, { y: height * 0.34, scale: 1, opacity: 1, rotation: 0 });
      gsap.set(flameRef.current, { scaleY: 0.3, transformOrigin: "50% 0%" });
      gsap.set(legsRef.current, { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(glowRef.current, { opacity: 0 });
      gsap.set(atmosRef.current, { opacity: 0 });
      gsap.set([warpRef.current, orbitRef.current, arriveRef.current], {
        opacity: 0,
        y: 8,
      });
      gsap.set(departRef.current, { opacity: 0, y: 8 });
      gsap.set(fillRef.current, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(flashRef.current, { opacity: 0 });
      const puffs = dustRef.current ? Array.from(dustRef.current.children) : [];
      gsap.set(puffs, { opacity: 0, scale: 0.2 });

      const tl = gsap.timeline({
        onComplete: () => {
          finish(false);
        },
      });
      timelineRef.current = tl;
      tl.to(root, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0)
        .to(departRef.current, { opacity: 1, y: 0, duration: 0.4 }, 0.1)
        // lift-off
        .to(flameRef.current, { scaleY: 1.5, duration: 0.9, ease: "power2.out" }, 0.25)
        .to(rocket, { y: height * 0.1, duration: 1.4, ease: "power2.in" }, 0.35)
        .to(speed, { v: 1.4, duration: 1.0, ease: "power2.in" }, 0.2)
        // warp
        .to(departRef.current, { opacity: 0, duration: 0.25 }, 0.95)
        .to(warpRef.current, { opacity: 1, y: 0, duration: 0.3 }, 1.05)
        .to(speed, { v: 18, duration: 1.1, ease: "power3.in" }, 1.0)
        .to(planet, { opacity: 1, scale: 0.22, duration: 1.2, ease: "power1.in" }, 1.1)
        .to(
          rocket,
          { y: -height * 0.04, scale: 0.8, duration: 0.9, ease: "power1.inOut" },
          1.5,
        )
        // the jump: the screen changes behind the light
        .to(flashRef.current, { opacity: 0.85, duration: 0.14, ease: "power2.in" }, 2.05)
        .call(cover, undefined, 2.12)
        .to(flashRef.current, { opacity: 0, duration: 0.5, ease: "power2.out" }, 2.19)
        // out of warp: the planet grows from a point of light into a world
        .to(warpRef.current, { opacity: 0, duration: 0.2 }, 2.15)
        .to(speed, { v: 0.9, duration: 1.0, ease: "power3.out" }, 2.2)
        .to(planet, { scale: 1, duration: 1.3, ease: "power2.out" }, 2.2)
        .to(orbitRef.current, { opacity: 1, y: 0, duration: 0.4 }, 2.5)
        // descent: the planet swells into a horizon, the air thickens and glows,
        // the rocket burns hard against the heat
        .to(speed, { v: 0.12, duration: 1.2, ease: "power2.out" }, 3.3)
        .to(canvasRef.current, { opacity: 0.2, duration: 1.4 }, 3.4)
        .to(
          planet,
          { scale: kFinal, y: planetDrop, duration: 1.4, ease: "power2.inOut" },
          3.3,
        )
        .to(atmosRef.current, { opacity: 1, duration: 1.0, ease: "power1.in" }, 3.5)
        .to(glowRef.current, { opacity: 1, duration: 0.5 }, 3.5)
        .to(glowRef.current, { opacity: 0, duration: 0.8 }, 4.2)
        .to(flameRef.current, { scaleY: 2.1, duration: 0.5, ease: "power2.out" }, 3.5)
        .to(
          rocket,
          { y: landY, scale: landScale, duration: 1.35, ease: "power2.inOut" },
          3.3,
        )
        .to(legsRef.current, { scaleY: 1, duration: 0.35, ease: "back.out(2)" }, 4.15)
        // touchdown: a small settle, the engine cuts, dust rolls out
        .to(rocket, { y: landY + 4, duration: 0.12, ease: "power1.in" }, 4.6)
        .to(rocket, { y: landY, duration: 0.3, ease: "elastic.out(1, 0.5)" }, 4.72)
        .to(flameRef.current, { scaleY: 0, opacity: 0, duration: 0.3 }, 4.62)
        .to(orbitRef.current, { opacity: 0, duration: 0.25 }, 4.5)
        .to(arriveRef.current, { opacity: 1, y: 0, duration: 0.5 }, 4.85)
        .to(fillRef.current, { scaleX: 1, duration: 4.9, ease: "none" }, 0.2);
      puffs.forEach((puff, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        const spread = 40 + (i >> 1) * 34;
        tl.fromTo(
          puff,
          { x: 0, y: 0, opacity: 0.7, scale: 0.3 },
          {
            x: dir * spread,
            y: -(6 + (i % 3) * 5),
            opacity: 0,
            scale: 1.5 + (i % 4) * 0.4,
            duration: 1.1,
            ease: "power2.out",
          },
          4.62 + (i % 3) * 0.03,
        );
      });
      // Leaving: on a dark theme the flight simply fades; on a light theme it
      // dissolves through the planet's own light so the white page never meets a dark one.
      if (light) {
        tl.to(
          flashRef.current,
          { opacity: 1, duration: 0.45, ease: "power1.in" },
          5.5,
        ).to(root, { opacity: 0, duration: 0.5, ease: "power1.out" }, 5.9);
      } else {
        tl.to(root, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 5.5);
      }

      // a living flame and an engine shake that grows with the burn
      gsap.to(flameRef.current, {
        scaleX: 0.82,
        duration: 0.07,
        repeat: -1,
        yoyo: true,
        ease: "none",
      });
      gsap.to(rocket, {
        x: 1.6,
        duration: 0.05,
        repeat: 44,
        yoyo: true,
        ease: "none",
        delay: 0.3,
      });
      gsap.to(rocket, {
        x: 2.6,
        duration: 0.045,
        repeat: 22,
        yoyo: true,
        ease: "none",
        delay: 3.4,
      });
    }, root);
    return () => {
      stopStars();
      ctx.revert();
    };
    // finish and cover only read refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  const { light, dark } = world.planet;
  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-world="boss-fights"
      data-travel={world.id}
      role="dialog"
      aria-modal="true"
      aria-label={`Travelling to ${world.name}`}
      style={{ "--t-light": light, "--t-dark": dark } as CSSProperties}
      onClick={() => {
        finish();
      }}
    >
      <div className={styles.backdrop} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.stars} aria-hidden="true" />
      <div className={styles.horizon} aria-hidden="true" />

      <div ref={planetRef} className={styles.planet} aria-hidden="true">
        <Planet look={world.planet} className={styles.planetArt} />
      </div>

      <div ref={atmosRef} className={styles.atmos} aria-hidden="true" />

      <div ref={rocketRef} className={styles.rocket} aria-hidden="true">
        <div ref={glowRef} className={styles.heat} />
        <svg viewBox="0 0 60 140" width="100%" height="100%" focusable="false">
          <defs>
            <linearGradient id="rk-body" x1="0" x2="1">
              <stop offset="0" stopColor="#c9d3df" />
              <stop offset="0.45" stopColor="#ffffff" />
              <stop offset="1" stopColor="#9aa7b6" />
            </linearGradient>
            <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff6c8" />
              <stop offset="0.35" stopColor="#ffb340" />
              <stop offset="1" stopColor={light} stopOpacity="0" />
            </linearGradient>
          </defs>
          <g ref={flameRef}>
            <path
              d="M22 92 C 20 118, 28 134, 30 140 C 32 134, 40 118, 38 92Z"
              fill="url(#rk-flame)"
            />
          </g>
          <g ref={legsRef}>
            <path
              d="M20 90 L8 112 M40 90 L52 112"
              stroke="#aab4c2"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M3 113 H14 M46 113 H57"
              stroke="#e8eef5"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </g>
          <path d="M16 70 L4 98 L16 94Z" fill={light} />
          <path d="M44 70 L56 98 L44 94Z" fill={light} />
          <path
            d="M30 4 C 44 22, 46 52, 42 92 L18 92 C 14 52, 16 22, 30 4Z"
            fill="url(#rk-body)"
          />
          <circle cx="30" cy="44" r="7.5" fill="#1d2433" />
          <circle cx="30" cy="44" r="5.2" fill={light} opacity="0.85" />
          <circle cx="28" cy="42" r="1.8" fill="#ffffff" opacity="0.8" />
          <rect x="18" y="74" width="24" height="4" fill={light} opacity="0.9" />
          <path d="M22 92 L38 92 L36 98 L24 98Z" fill="#46505e" />
        </svg>
      </div>

      <div ref={dustRef} className={styles.dust} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className={styles.puff} />
        ))}
      </div>

      <div ref={flashRef} className={styles.flash} aria-hidden="true" />

      <div className={styles.hudTop}>
        <div ref={departRef} className={styles.caption}>
          <span className={styles.eyebrow}>Launching</span>
          <span className={styles.big}>Plotting a course to {world.name}</span>
        </div>
        <div ref={warpRef} className={styles.caption}>
          <span className={styles.eyebrow}>Warp engaged</span>
          <span className={styles.big}>Hold on tight</span>
        </div>
        <div ref={orbitRef} className={styles.caption}>
          <span className={styles.eyebrow}>Entering the atmosphere</span>
          <span className={styles.big}>Descending to {world.name}</span>
        </div>
      </div>
      <div className={styles.hud}>
        <div ref={arriveRef} className={styles.caption} role="status">
          <span className={styles.eyebrow}>
            World {world.number} · {world.discipline}
          </span>
          <span className={styles.big}>Touchdown on {world.name}</span>
          <span className={styles.epithet}>{world.epithet}</span>
        </div>
      </div>

      <div className={styles.track} aria-hidden="true">
        <div ref={fillRef} className={styles.fill} />
      </div>
      <button
        ref={skipRef}
        type="button"
        className={styles.skip}
        onClick={(event) => {
          event.stopPropagation();
          finish();
        }}
      >
        Skip flight
      </button>
    </div>
  );
}
