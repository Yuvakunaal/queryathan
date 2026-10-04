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
