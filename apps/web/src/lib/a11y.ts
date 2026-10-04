import { writeStored } from "./safeStorage";

export const TEXT_SCALES = [0.875, 1, 1.125, 1.25] as const;

const A11Y_STORAGE_KEY = "dcq.a11y";

export type ThemeMode = "dark" | "light";

export interface A11yState {
  textScaleIndex: number;
  theme: ThemeMode;
  crtReduced: boolean;
  highContrast: boolean;
  /** Sound cues (quiet). On by default; the SFX button turns them off. */
  sound: boolean;
  /** Keyboard sounds while typing, separate from the effect tones. */
  typing: boolean;
  /** Master volume for every sound, 0 to 1. */
  volume: number;
}

export function defaultA11y(): A11yState {
  // The CRT scanline overlay is decoration that some people find tiring, so
  // it starts off; the CRT button turns it on. The theme follows the system
  // setting until the player picks one.
  const prefersLight =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return {
    textScaleIndex: 1,
    theme: prefersLight ? "light" : "dark",
    crtReduced: true,
    highContrast: false,
    sound: true,
    typing: true,
    volume: 0.8,
  };
}

export function loadA11yState(): A11yState {
  if (typeof window === "undefined") return defaultA11y();
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return defaultA11y();
    const parsed = JSON.parse(raw) as Partial<A11yState>;
    const fallback = defaultA11y();
    return {
      textScaleIndex: parsed.textScaleIndex ?? fallback.textScaleIndex,
      theme:
        parsed.theme === "light" || parsed.theme === "dark"
          ? parsed.theme
          : fallback.theme,
      crtReduced: parsed.crtReduced ?? fallback.crtReduced,
      highContrast: parsed.highContrast ?? fallback.highContrast,
      sound: parsed.sound ?? fallback.sound,
      typing: parsed.typing ?? fallback.typing,
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : fallback.volume,
    };
  } catch {
    return defaultA11y();
  }
}

export function persistA11yState(a11y: A11yState): void {
  if (typeof window === "undefined") return;
  writeStored(A11Y_STORAGE_KEY, JSON.stringify(a11y));
}

/**
 * Applies the current a11y state to <html> as CSS custom properties/data
 * attributes — the single place every world's CSS reads these from
 * (`--dcq-text-scale`, `[data-dcq-intensity]`, `[data-dcq-contrast]`), so
 * it must run regardless of which screen (world map or a fight) is
 * currently mounted. Previously lived only inside BossFightScreen, which
 * silently ignored a player's saved preferences on the world map — the
 * app's actual landing screen since Phase 2.
 */
export function applyA11yToDocument(a11y: A11yState): void {
  const html = document.documentElement;
  html.style.setProperty("--dcq-text-scale", String(TEXT_SCALES[a11y.textScaleIndex]));
  // The scanline overlay only makes sense on a dark screen.
  if (a11y.crtReduced || a11y.theme === "light") html.dataset.dcqIntensity = "reduced";
  else delete html.dataset.dcqIntensity;
  html.dataset.dcqTheme = a11y.theme;
  html.style.colorScheme = a11y.theme;
  if (a11y.highContrast) html.dataset.dcqContrast = "high";
  else delete html.dataset.dcqContrast;
}
