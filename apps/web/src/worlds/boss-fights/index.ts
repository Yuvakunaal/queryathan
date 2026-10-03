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
import "./theme-vault.css";

// BossFightScreen is deliberately NOT re-exported here — App.tsx imports it
// directly (`import("./worlds/boss-fights/BossFightScreen")`) via
// React.lazy so CodeMirror/GSAP code-split away from the world map, the
// actual landing screen. Re-exporting it from this barrel (even unused)
// previously dragged those dependencies back into the eager main chunk —
// this file's own side-effect CSS imports above made Rollup unable to
// fully tree-shake an unused re-export out of it.
export type { BossFightScreenProps } from "./BossFightScreen";
export { default as WorldMapScreen } from "./WorldMapScreen";
export { default as WorldSelectScreen } from "./WorldSelectScreen";
