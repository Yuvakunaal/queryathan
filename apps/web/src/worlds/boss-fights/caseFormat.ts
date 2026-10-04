import type { Predicate, WinCondition } from "@dcq/content-schema";

export function getPrimaryNullColumn(winCondition: WinCondition): string | null {
  const predicate = winCondition.all.find((p) => p.predicate === "no_nulls");
  return predicate?.predicate === "no_nulls" ? predicate.column : null;
}

/** The distinct techniques a case's win condition exercises — the unit XP/rank tracking is keyed on. */
export function predicateKinds(winCondition: WinCondition): string[] {
  return Array.from(new Set(winCondition.all.map((p) => p.predicate)));
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
    case "matches_pattern":
      return `matches_pattern(${predicate.column}, /${predicate.pattern}/)`;
    case "no_mojibake":
      return `no_mojibake(${predicate.column})`;
    case "row_count":
      return `row_count = ${String(predicate.equals)}`;
    case "has_columns":
      return `has_columns(${predicate.columns.join(",")})`;
    case "runtime_under":
      return `runtime_under(${String(predicate.pythonMs)} ms python, ${String(predicate.sqlMs)} ms sql)`;
    case "lacks_columns":
      return `lacks_columns(${predicate.columns.join(",")})`;
    case "column_sum":
      return `column_sum(${predicate.column}) = ${String(predicate.equals)}`;
    case "result_matches":
      return `result_matches(${predicate.columns.join(",")}; ${String(predicate.rows.length)} rows)`;
    case "distinct_count":
      return `distinct_count(${predicate.column}) = ${String(predicate.equals)}`;
  }
}

/** What a case teaches: its authored skills, or else the kinds of predicate it is judged by. */
export function caseTechniques(caseData: {
  skills?: string[] | undefined;
  winCondition: WinCondition;
}): string[] {
  return caseData.skills ?? predicateKinds(caseData.winCondition);
}
