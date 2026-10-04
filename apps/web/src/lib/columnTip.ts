import type { ColumnTip } from "./mysqlType";

/** The data attributes the column tooltip reads. Spread onto any element that should show one on hover or focus. */
export function tipAttributes(
  name: string,
  tip: ColumnTip | undefined,
): Record<string, string> | undefined {
  if (!tip) return undefined;
  return {
    "data-tip-name": name,
    "data-tip-title": tip.mysql,
    "data-tip-detail": tip.lines.join("\n"),
  };
}
