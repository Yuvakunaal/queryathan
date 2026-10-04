import { MOD_KEY } from "./platform";

export interface ShortcutItem {
  /** Keys pressed together are joined with "+"; alternatives are separate entries. */
  keys: string[][];
  what: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

/** Every keyboard shortcut in the app, grouped. This is the single list the "?" sheet shows. */
export function shortcutGroups(): ShortcutGroup[] {
  return [
    {
      title: "Writing code",
      items: [
        {
          keys: [[MOD_KEY, "Enter"]],
          what: "Run. With text selected it runs just that part, on the table as it is now.",
        },
        {
          keys: [["Shift", "Alt", "F"]],
          what: "Tidy the SQL (the selection, or everything).",
        },
        {
          keys: [["Ctrl", "Space"]],
          what: "Show suggestions: column names, functions, pandas methods.",
        },
        {
          keys: [["Tab"], ["Shift", "Tab"]],
          what: "Indent or un-indent the line or selection.",
        },
        { keys: [[MOD_KEY, "/"]], what: "Comment or uncomment the line." },
        {
          keys: [
            [MOD_KEY, "Z"],
            [MOD_KEY, "Shift", "Z"],
          ],
          what: "Undo or redo (this also undoes Reset and Clear).",
        },
        {
          keys: [["Esc"]],
          what: "Leave the editor and jump to the Run button, so Tab does not get stuck.",
        },
      ],
    },
    {
      title: "Panels",
      items: [
        {
          keys: [["Tab"]],
          what: "Focus the dividers: the one between the briefing and the table, and the one above the editor.",
        },
        {
          keys: [["←"], ["→"]],
          what: "On the vertical divider: make the left panel narrower or wider. ↑ and ↓ do the same for the horizontal one.",
        },
        {
          keys: [
            ["Shift", "←"],
            ["Shift", "→"],
          ],
          what: "Move a divider in larger steps.",
        },
        {
          keys: [["Home"], ["End"]],
          what: "Send a divider to its smallest or largest size.",
        },
        {
          keys: [["Enter"]],
          what: "Put a divider back where it started (double-clicking does the same).",
        },
      ],
    },
    {
      title: "Tables",
      items: [
        { keys: [["↑"], ["↓"], ["←"], ["→"]], what: "Move between cells in a table." },
        {
          keys: [["←"], ["→"]],
          what: "On a table's grip (⠿): swap it with the previous or next table in the collage.",
        },
        {
          keys: [["←"], ["→"], ["↑"], ["↓"]],
          what: "On a line between tables: give one side more room. Shift moves faster, Home and End go to the limits, Enter centres it.",
        },
        {
          keys: [["Esc"]],
          what: "Hide a column's type tooltip. It appears when you hover a column name or focus a column chip.",
        },
      ],
    },
    {
      title: "Anywhere",
      items: [
        {
          keys: [["?"]],
          what: "Open this sheet (when you are not typing in the editor).",
        },
        { keys: [["Esc"]], what: "Close a dialog, a menu or this sheet." },
        {
          keys: [["Tab"], ["Shift", "Tab"]],
          what: "Move to the next or previous control.",
        },
        {
          keys: [["Enter"]],
          what: "On the intro screen: start the fight. Any other key or a click skips the typing.",
        },
      ],
    },
  ];
}

/** Whether a key press happened somewhere text is being typed, where "?" must stay a question mark. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
