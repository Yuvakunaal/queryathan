/**
 * Makes `CREATE TABLE result ...` safe to run again. The answer table is
 * always called `result`, and learners run their query many times; plain
 * SQLite would stop with "table result already exists" the second time. This
 * puts a `DROP TABLE IF EXISTS result;` in front of each such statement (on the
 * same line, so a statement inside a comment stays a comment), and accepts the
 * `CREATE OR REPLACE TABLE` spelling other databases use. Only the table named
 * `result` is touched; every other statement runs exactly as typed.
 */
const CREATE_RESULT =
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?!IF\s)(?:"result"|`result`|\[result\]|result)(?=[\s(])/gi;

export function replaceableResult(code: string): string {
  return code.replace(CREATE_RESULT, "DROP TABLE IF EXISTS result; CREATE TABLE result");
}

const UNIT_WORDS = "year|quarter|month|week|day|hour|minute|second";

/**
 * Small spelling differences between SQL dialects that a function cannot
 * absorb, rewritten into the form SQLite and the helper functions understand:
 *  - `EXTRACT(month FROM d)`            becomes `date_part('month', d)`
 *  - `DATEDIFF(day, a, b)` and friends  get their unit quoted
 *  - `DATE_ADD(d, INTERVAL 7 DAY)`      becomes `DATE_ADD(d, 7, 'DAY')`
 *  - `CURRENT_DATE()`                   becomes `CURRENT_DATE`
 *  - `ILIKE`                            becomes `LIKE` (SQLite's LIKE already ignores case)
 * Everything else, including every string and comment, is passed through.
 */
export function dialectFriendly(code: string): string {
  return code
    .replace(/\bEXTRACT\s*\(\s*([A-Za-z_]+)\s+FROM\s+/gi, "date_part('$1', ")
    .replace(
      new RegExp(
        `\\b(DATEDIFF|DATEADD|TIMESTAMPDIFF|TIMESTAMPADD|DATE_TRUNC|DATE_PART)\\s*\\(\\s*(${UNIT_WORDS})s?\\s*,`,
        "gi",
      ),
      "$1('$2',",
    )
    .replace(
      new RegExp(`\\bINTERVAL\\s+(-?\\d+)\\s+(${UNIT_WORDS})s?\\b`, "gi"),
      "$1, '$2'",
    )
    .replace(/\b(CURRENT_DATE|CURRENT_TIMESTAMP)\s*\(\s*\)/gi, "$1")
    .replace(/\bILIKE\b/gi, "LIKE");
}

/** Everything the SQL worker does to the player's code before running it. */
export function prepareSql(code: string): string {
  return replaceableResult(dialectFriendly(code));
}
