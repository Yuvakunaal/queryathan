import type { Predicate, WinCondition } from "@dcq/content-schema";

export function getPrimaryNullColumn(winCondition: WinCondition): string | null {
  const predicate = winCondition.all.find((p) => p.predicate === "no_nulls");
  return predicate?.predicate === "no_nulls" ? predicate.column : null;
}

export function formatWinCondition(winCondition: WinCondition): string {
  return winCondition.all.map(formatPredicate).join(" AND ");
}

function formatPredicate(predicate: Predicate): string {
  if (predicate.predicate === "no_nulls") return `no_nulls(${predicate.column})`;
  return `no_duplicates(${predicate.columns.join(",")})`;
}
