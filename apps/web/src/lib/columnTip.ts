import type { ColumnTip } from "./mysqlType";

/** The data attribute the column tooltip reads: the MySQL type, shown on hover or focus. */
export function tipAttributes(
  _name: string,
  tip: ColumnTip | undefined,
): Record<string, string> | undefined {
  return tip ? { "data-tip-title": tip.mysql } : undefined;
}
