// Fonts are self-hosted via npm — no CDN, keeps font-src 'self' in
// vercel.json satisfiable. unicode-range on each @font-face means the
// browser only fetches the latin woff2 despite these files also declaring
// other scripts' @font-face blocks (no "latin-only" build exists for the
// variable Martian Mono package — see docs/design/world-1-visual-spec.md §2).
import "@fontsource-variable/martian-mono/standard.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./theme.css";

export { default as BossFightScreen } from "./BossFightScreen";
