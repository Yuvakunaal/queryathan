import { useId } from "react";

export interface LogoProps {
  /** Width and height in px. */
  size?: number;
  className?: string | undefined;
}

/**
 * The Queryathan mark: a porthole, a dorsal fin and the waterline. The leviathan
 * is under the surface; you are looking out. It always uses the brand
 * orange (a deeper orange on the light theme), whichever world's page it sits on. The tab icon in public/favicon.svg is the same drawing.
 */
export default function Logo({ size = 24, className }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const grad = `lg-${uid}`;
  const clip = `lc-${uid}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-a, #ffb02e)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-b, #ff6a00)" }} />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="18.5" />
        </clipPath>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="4"
      />
      <g clipPath={`url(#${clip})`}>
        <path
          d="M8 38 H56 V60 H8Z"
          style={{ fill: "var(--brand-b, #ff6a00)" }}
          opacity=".2"
        />
        <path
          d="M20 38 C 28 37, 33 28, 35 15 C 37 29, 43 36, 48 38 Z"
          fill={`url(#${grad})`}
        />
        <path
          d="M8 38 H56"
          style={{ stroke: "var(--w1-text-primary, #f5f1ea)" }}
          strokeWidth="2.2"
        />
        <path
          d="M24 44.5 H40"
          style={{ stroke: "var(--w1-text-primary, #f5f1ea)" }}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity=".45"
        />
      </g>
    </svg>
  );
}
