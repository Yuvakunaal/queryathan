export const TEXT_SCALES = [0.875, 1, 1.125, 1.25] as const;

const A11Y_STORAGE_KEY = "dcq.a11y";

export interface A11yState {
  textScaleIndex: number;
  crtReduced: boolean;
  highContrast: boolean;
}

export function defaultA11y(): A11yState {
  const reduceIntensity =
    typeof window !== "undefined" &&
    (window.matchMedia("(prefers-contrast: more)").matches ||
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches);
  return { textScaleIndex: 1, crtReduced: reduceIntensity, highContrast: false };
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
      crtReduced: parsed.crtReduced ?? fallback.crtReduced,
      highContrast: parsed.highContrast ?? fallback.highContrast,
    };
  } catch {
    return defaultA11y();
  }
}

export function persistA11yState(a11y: A11yState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(a11y));
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
  if (a11y.crtReduced) html.dataset.dcqIntensity = "reduced";
  else delete html.dataset.dcqIntensity;
  if (a11y.highContrast) html.dataset.dcqContrast = "high";
  else delete html.dataset.dcqContrast;
}
