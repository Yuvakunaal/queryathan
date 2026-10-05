import { useId } from "react";
import type { PlanetLook } from "../../lib/world-meta";

export interface PlanetProps {
  look: PlanetLook;
  className?: string | undefined;
}

/**
 * A world's planet, drawn as one small SVG (no images to load). The two colours
 * are the lit side and the shadow side; the kind says what the surface is like:
 * craters, a ring, twin spheres, a map grid, cracks of heat, bands of light,
 * a maze, a clock face or bubbles. Used on the world cards and in the flight.
 */
export default function Planet({ look, className }: PlanetProps) {
  const uid = useId().replace(/:/g, "");
  const sphere = `p-sphere-${uid}`;
  const clip = `p-clip-${uid}`;
  const glow = `p-glow-${uid}`;
  const { kind, light, dark } = look;
  const ink = "rgb(0 0 0 / 0.28)";
  const line = "rgb(255 255 255 / 0.4)";

  const defs = (
    <defs>
      <radialGradient id={sphere} cx="34%" cy="30%" r="82%">
        <stop offset="0" stopColor={light} />
        <stop offset="0.55" stopColor={light} stopOpacity="0.55" />
        <stop offset="1" stopColor={dark} />
      </radialGradient>
      <radialGradient id={glow} cx="50%" cy="50%" r="50%">
        <stop offset="0.7" stopColor={light} stopOpacity="0.35" />
        <stop offset="1" stopColor={light} stopOpacity="0" />
      </radialGradient>
      <clipPath id={clip}>
        <circle cx="50" cy="50" r="34" />
      </clipPath>
    </defs>
  );

  if (kind === "twin") {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id={sphere} cx="34%" cy="30%" r="82%">
            <stop offset="0" stopColor={light} />
            <stop offset="1" stopColor={dark} />
          </radialGradient>
          <radialGradient id={`${sphere}-b`} cx="34%" cy="30%" r="82%">
            <stop offset="0" stopColor={dark} />
            <stop offset="1" stopColor={light} stopOpacity="0.35" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={`url(#${sphere})`} opacity="0.06" />
        <path
          d="M33 60 C 44 40, 56 40, 68 40"
          fill="none"
          stroke={line}
          strokeWidth="1.4"
          strokeDasharray="2 3"
        />
        <circle cx="34" cy="60" r="25" fill={`url(#${sphere})`} />
        <circle cx="70" cy="40" r="19" fill={`url(#${sphere}-b)`} />
        <circle cx="70" cy="40" r="19" fill="none" stroke={light} strokeOpacity="0.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      {defs}
      <circle cx="50" cy="50" r="48" fill={`url(#${glow})`} />
      {kind === "ringed" ? (
        <ellipse
          cx="50"
          cy="50"
          rx="47"
          ry="12"
          transform="rotate(-18 50 50)"
          fill="none"
          stroke={light}
          strokeOpacity="0.75"
          strokeWidth="3.2"
        />
      ) : null}
      <circle cx="50" cy="50" r="34" fill={`url(#${sphere})`} />
      <g clipPath={`url(#${clip})`}>
        {kind === "cratered" ? (
          <>
            <ellipse cx="38" cy="40" rx="8" ry="6" fill={ink} />
            <ellipse cx="62" cy="55" rx="10" ry="7" fill={ink} />
            <ellipse cx="46" cy="68" rx="6" ry="4.5" fill={ink} />
            <ellipse cx="66" cy="36" rx="4" ry="3" fill={ink} />
            <ellipse cx="30" cy="58" rx="4" ry="3" fill={ink} />
          </>
        ) : null}
        {kind === "grid" ? (
          <g fill="none" stroke={line} strokeWidth="0.9">
            <ellipse cx="50" cy="50" rx="34" ry="12" />
            <ellipse cx="50" cy="50" rx="34" ry="24" />
            <ellipse cx="50" cy="50" rx="12" ry="34" />
            <ellipse cx="50" cy="50" rx="24" ry="34" />
            <line x1="50" y1="14" x2="50" y2="86" />
            <line x1="14" y1="50" x2="86" y2="50" />
          </g>
        ) : null}
        {kind === "cracked" ? (
          <g fill="none" stroke={light} strokeWidth="1.8" strokeLinejoin="round">
            <polyline points="22,40 36,46 40,58 54,62 60,76" />
            <polyline points="40,58 30,70" />
            <polyline points="54,62 70,56 78,44" />
            <polyline points="36,46 46,32 58,30" />
          </g>
        ) : null}
        {kind === "banded" ? (
          <g fill={ink}>
            <path d="M14 36 Q50 28 86 36 L86 42 Q50 34 14 42Z" />
            <path d="M14 52 Q50 44 86 52 L86 60 Q50 52 14 60Z" opacity="0.8" />
            <path d="M14 68 Q50 60 86 68 L86 72 Q50 64 14 72Z" />
          </g>
        ) : null}
        {kind === "maze" ? (
          <g fill="none" stroke={line} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="50" cy="50" r="30" strokeDasharray="46 12 60 40" />
            <circle cx="50" cy="50" r="21" strokeDasharray="32 10 50 40" />
            <circle cx="50" cy="50" r="12" strokeDasharray="20 8 26 22" />
            <circle cx="50" cy="50" r="3.5" fill={line} />
          </g>
        ) : null}
        {kind === "clock" ? (
          <g stroke={line} strokeLinecap="round">
            {Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                x1="50"
                y1="19"
                x2="50"
                y2={i % 3 === 0 ? "26" : "23"}
                strokeWidth={i % 3 === 0 ? "2.2" : "1.2"}
                transform={`rotate(${String(i * 30)} 50 50)`}
              />
            ))}
            <line x1="50" y1="50" x2="50" y2="30" strokeWidth="2.4" />
            <line x1="50" y1="50" x2="64" y2="56" strokeWidth="2" />
            <circle cx="50" cy="50" r="2.4" fill={line} />
          </g>
        ) : null}
        {kind === "bubbles" ? (
          <g fill="none" stroke={line} strokeWidth="1.2">
            <circle cx="40" cy="56" r="9" />
            <circle cx="62" cy="44" r="6" />
            <circle cx="56" cy="68" r="4" />
            <circle cx="34" cy="38" r="3.5" />
            <circle cx="70" cy="62" r="3" />
          </g>
        ) : null}
      </g>
      {kind === "ringed" ? (
        <g transform="rotate(-18 50 50)">
          <path
            d="M3 50 A47 12 0 0 0 97 50"
            fill="none"
            stroke={light}
            strokeWidth="3.2"
          />
        </g>
      ) : null}
    </svg>
  );
}
