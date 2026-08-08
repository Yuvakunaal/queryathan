import type { Predicate, WinCondition } from "@dcq/content-schema";

export function getPrimaryNullColumn(winCondition: WinCondition): string | null {
  const predicate = winCondition.all.find((p) => p.predicate === "no_nulls");
  return predicate?.predicate === "no_nulls" ? predicate.column : null;
}

export function formatWinCondition(winCondition: WinCondition): string {
  return winCondition.all.map(formatPredicate).join(" AND ");
}

function formatPredicate(predicate: Predicate): string {
  switch (predicate.predicate) {
    case "no_nulls":
      return `no_nulls(${predicate.column})`;
    case "no_duplicates":
      return `no_duplicates(${predicate.columns.join(",")})`;
    case "no_whitespace":
      return `no_whitespace(${predicate.column})`;
    case "consistent_casing":
      return `consistent_casing(${predicate.column}, ${predicate.case})`;
    case "no_outliers":
      return `no_outliers(${predicate.column}, ${String(predicate.min)}..${String(predicate.max)})`;
    case "valid_dtype":
      return `valid_dtype(${predicate.column}, ${predicate.dtype})`;
  }
}
