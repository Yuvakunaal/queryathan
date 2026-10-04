/**
 * The SQL toolbox: the everyday building blocks, grouped by what you are trying
 * to do. Each entry is what gets inserted (with a ready-to-edit shape), a one
 * line explanation, and a tiny example. The same list feeds autocomplete.
 */
export interface SqlRef {
  /** The word to complete, e.g. "DATE_TRUNC". */
  name: string;
  /** What is inserted at the cursor. */
  insert: string;
  /** How it is written, e.g. "DATE_TRUNC('month', date)". */
  syntax: string;
  detail: string;
  example?: string;
}

export interface SqlRefGroup {
  id: string;
  title: string;
  items: SqlRef[];
}

export const SQL_REFERENCE: SqlRefGroup[] = [
  {
    id: "dates",
    title: "Dates and time",
    items: [
      {
        name: "YEAR",
        insert: "YEAR()",
        syntax: "YEAR(date)",
        detail: "The year of a date.",
        example: "YEAR('2026-03-09') -> 2026",
      },
      {
        name: "MONTH",
        insert: "MONTH()",
        syntax: "MONTH(date)",
        detail: "The month number, 1 to 12.",
        example: "MONTH('2026-03-09') -> 3",
      },
      {
        name: "DAY",
        insert: "DAY()",
        syntax: "DAY(date)",
        detail: "The day of the month.",
        example: "DAY('2026-03-09') -> 9",
      },
      {
        name: "HOUR",
        insert: "HOUR()",
        syntax: "HOUR(timestamp)",
        detail: "The hour, 0 to 23 (also MINUTE and SECOND).",
        example: "HOUR('2026-03-09 14:05:00') -> 14",
      },
      {
        name: "QUARTER",
        insert: "QUARTER()",
        syntax: "QUARTER(date)",
        detail: "The quarter, 1 to 4.",
        example: "QUARTER('2026-08-01') -> 3",
      },
      {
        name: "DAYNAME",
        insert: "DAYNAME()",
        syntax: "DAYNAME(date)",
        detail: "The weekday's name (also MONTHNAME).",
        example: "DAYNAME('2026-03-09') -> Monday",
      },
      {
        name: "DATE_TRUNC",
        insert: "DATE_TRUNC('month', )",
        syntax: "DATE_TRUNC('month', date)",
        detail:
          "Cut a date back to the start of its year, quarter, month, week or day. Handy for grouping by month.",
        example: "DATE_TRUNC('month', '2026-03-19') -> 2026-03-01",
      },
      {
        name: "DATE_ADD",
        insert: "DATE_ADD(, INTERVAL 7 DAY)",
        syntax: "DATE_ADD(date, INTERVAL 7 DAY)",
        detail:
          "Move a date forward. Also DATEADD(day, 7, date) and DATE_SUB to go back. Month ends are handled for you.",
        example: "DATE_ADD('2026-01-31', INTERVAL 1 MONTH) -> 2026-02-28",
      },
      {
        name: "DATEDIFF",
        insert: "DATEDIFF(, )",
        syntax: "DATEDIFF(later, earlier)",
        detail:
          "Days between two dates. DATEDIFF(day, earlier, later) works too, with month, year, week and more.",
        example: "DATEDIFF('2026-03-09', '2026-03-01') -> 8",
      },
      {
        name: "TIMESTAMPDIFF",
        insert: "TIMESTAMPDIFF(MONTH, , )",
        syntax: "TIMESTAMPDIFF(unit, earlier, later)",
        detail: "Whole units that have fully passed, like age in complete months.",
        example: "TIMESTAMPDIFF(MONTH, '2026-01-15', '2026-03-14') -> 1",
      },
      {
        name: "EXTRACT",
        insert: "EXTRACT(MONTH FROM )",
        syntax: "EXTRACT(part FROM date)",
        detail: "Pull one part out of a date: year, month, day, hour, quarter, week.",
        example: "EXTRACT(YEAR FROM '2026-03-09') -> 2026",
      },
      {
        name: "LAST_DAY",
        insert: "LAST_DAY()",
        syntax: "LAST_DAY(date)",
        detail: "The last day of that date's month.",
        example: "LAST_DAY('2026-02-10') -> 2026-02-28",
      },
      {
        name: "DATE_FORMAT",
        insert: "DATE_FORMAT(, '%Y-%m')",
        syntax: "DATE_FORMAT(date, '%Y-%m')",
        detail:
          "Write a date in a layout. %Y year, %m month, %d day, %b short month, %M month name, %H %i %s time. TO_CHAR(date, 'YYYY-MM') does the same.",
        example: "DATE_FORMAT('2026-03-09', '%b %d') -> Mar 09",
      },
      {
        name: "TO_DATE",
        insert: "TO_DATE(, 'DD/MM/YYYY')",
        syntax: "TO_DATE(text, 'DD/MM/YYYY')",
        detail:
          "Read a date written another way into a proper date. STR_TO_DATE(text, '%d/%m/%Y') is the same. Great for messy date columns.",
        example: "TO_DATE('09/03/2026', 'DD/MM/YYYY') -> 2026-03-09",
      },
      {
        name: "STRFTIME",
        insert: "STRFTIME('%Y-%m', )",
        syntax: "STRFTIME('%Y-%m', date)",
        detail: "SQLite's own date formatter.",
        example: "STRFTIME('%Y', '2026-03-09') -> 2026",
      },
      {
        name: "NOW",
        insert: "NOW()",
        syntax: "NOW()",
        detail: "The current date and time. CURRENT_DATE gives just the date.",
        example: "NOW() -> 2026-03-09 14:05:00",
      },
    ],
  },
  {
    id: "nulls",
    title: "Missing values",
    items: [
      {
        name: "COALESCE",
        insert: "COALESCE(, 0)",
        syntax: "COALESCE(a, b, ...)",
        detail: "The first value that is not empty. The standard way to fill gaps.",
        example: "COALESCE(NULL, NULL, 3) -> 3",
      },
      {
        name: "NULLIF",
        insert: "NULLIF(, '')",
        syntax: "NULLIF(a, b)",
        detail:
          "Turns a value into empty when it equals b. Use it to make blank text a real NULL.",
        example: "NULLIF('', '') -> NULL",
      },
      {
        name: "IFNULL",
        insert: "IFNULL(, 0)",
        syntax: "IFNULL(a, b)",
        detail: "b when a is empty. NVL(a, b) is the same. ZEROIFNULL(a) gives 0.",
        example: "IFNULL(NULL, 5) -> 5",
      },
      {
        name: "CASE",
        insert: "CASE WHEN  THEN  ELSE  END",
        syntax: "CASE WHEN test THEN a ELSE b END",
        detail: "If / else inside a query. IIF(test, a, b) is the short form.",
        example: "CASE WHEN qty > 5 THEN 'big' ELSE 'small' END",
      },
      {
        name: "IS NULL",
        insert: "IS NULL",
        syntax: "column IS NULL",
        detail:
          "Test for empty. Never write = NULL; it is never true. IS NOT NULL is the opposite.",
        example: "WHERE email IS NULL",
      },
    ],
  },
  {
    id: "text",
    title: "Text",
    items: [
      {
        name: "TRIM",
        insert: "TRIM()",
        syntax: "TRIM(text)",
        detail: "Remove spaces from both ends (LTRIM and RTRIM for one end).",
        example: "TRIM('  ann ') -> ann",
      },
      {
        name: "LOWER",
        insert: "LOWER()",
        syntax: "LOWER(text)",
        detail: "All lower case. UPPER for capitals, INITCAP for Each Word Capitalised.",
        example: "INITCAP('ANN LEE') -> Ann Lee",
      },
      {
        name: "SUBSTR",
        insert: "SUBSTR(, 1, 3)",
        syntax: "SUBSTR(text, start, length)",
        detail: "Part of a text. LEFT(text, n) and RIGHT(text, n) take from each end.",
        example: "LEFT('abcdef', 3) -> abc",
      },
      {
        name: "REPLACE",
        insert: "REPLACE(, '', '')",
        syntax: "REPLACE(text, find, with)",
        detail: "Swap every occurrence of one text for another.",
        example: "REPLACE('a-b', '-', '_') -> a_b",
      },
      {
        name: "CONCAT",
        insert: "CONCAT(, ' ', )",
        syntax: "CONCAT(a, b, ...)",
        detail: "Join texts. The || operator does the same.",
        example: "CONCAT('a', 'b') -> ab",
      },
      {
        name: "LPAD",
        insert: "LPAD(, 5, '0')",
        syntax: "LPAD(text, length, fill)",
        detail: "Pad on the left, like zero-padding ids. RPAD pads on the right.",
        example: "LPAD('7', 3, '0') -> 007",
      },
      {
        name: "SPLIT_PART",
        insert: "SPLIT_PART(, ',', 1)",
        syntax: "SPLIT_PART(text, separator, n)",
        detail:
          "The nth piece of a text cut at a separator. Negative n counts from the end.",
        example: "SPLIT_PART('a,b,c', ',', 2) -> b",
      },
      {
        name: "LENGTH",
        insert: "LENGTH()",
        syntax: "LENGTH(text)",
        detail: "Number of characters. INSTR(text, part) finds where a part starts.",
        example: "LENGTH('abc') -> 3",
      },
      {
        name: "REGEXP_EXTRACT",
        insert: "REGEXP_EXTRACT(, '(\\d+)')",
        syntax: "REGEXP_EXTRACT(text, pattern)",
        detail:
          "The part matching a pattern (the (group) if there is one). Also REGEXP_REPLACE, REGEXP_SUBSTR, REGEXP_LIKE and REGEXP_COUNT.",
        example: "REGEXP_EXTRACT('id-42', '(\\d+)') -> 42",
      },
      {
        name: "LIKE",
        insert: "LIKE '%%'",
        syntax: "column LIKE '%text%'",
        detail:
          "Match with wildcards: % is anything, _ is one character. Case does not matter. ILIKE works too.",
        example: "WHERE name LIKE 'an%'",
      },
    ],
  },
  {
    id: "numbers",
    title: "Numbers",
    items: [
      {
        name: "ROUND",
        insert: "ROUND(, 2)",
        syntax: "ROUND(number, places)",
        detail: "Round to some decimal places.",
        example: "ROUND(2.567, 1) -> 2.6",
      },
      {
        name: "CEIL",
        insert: "CEIL()",
        syntax: "CEIL(number)",
        detail: "Round up (CEILING too). FLOOR rounds down, TRUNC(x, places) cuts off.",
        example: "CEIL(2.1) -> 3",
      },
      {
        name: "ABS",
        insert: "ABS()",
        syntax: "ABS(number)",
        detail: "Remove the minus sign.",
        example: "ABS(-4) -> 4",
      },
      {
        name: "MOD",
        insert: "MOD(, 2)",
        syntax: "MOD(a, b)",
        detail: "The remainder after dividing (a % b works too).",
        example: "MOD(7, 3) -> 1",
      },
      {
        name: "POWER",
        insert: "POWER(, 2)",
        syntax: "POWER(a, b)",
        detail: "a to the power of b. SQRT, LN and LOG10 are there too.",
        example: "POWER(2, 10) -> 1024",
      },
      {
        name: "GREATEST",
        insert: "GREATEST(, )",
        syntax: "GREATEST(a, b, ...)",
        detail:
          "The largest of several values (LEAST for the smallest). Empty if any is empty.",
        example: "GREATEST(1, 5, 3) -> 5",
      },
      {
        name: "CAST",
        insert: "CAST( AS INTEGER)",
        syntax: "CAST(value AS INTEGER)",
        detail: "Change the type: INTEGER, REAL or TEXT.",
        example: "CAST('42' AS INTEGER) -> 42",
      },
    ],
  },
  {
    id: "groups",
    title: "Groups and windows",
    items: [
      {
        name: "GROUP BY",
        insert: "GROUP BY ",
        syntax: "SELECT col, SUM(x) FROM t GROUP BY col",
        detail:
          "One row per group. Every column that is not inside SUM, COUNT and the like must be listed here.",
        example: "SELECT region, SUM(qty) FROM data GROUP BY region",
      },
      {
        name: "COUNT",
        insert: "COUNT(DISTINCT )",
        syntax: "COUNT(DISTINCT col)",
        detail:
          "How many rows, or with DISTINCT how many different values. COUNT(col) skips empty ones.",
        example: "COUNT(DISTINCT user_id)",
      },
      {
        name: "SUM",
        insert: "SUM()",
        syntax: "SUM(col)",
        detail: "Add up. AVG averages, MIN and MAX find the ends, MEDIAN the middle.",
        example: "SUM(qty * price)",
      },
      {
        name: "HAVING",
        insert: "HAVING ",
        syntax: "GROUP BY col HAVING COUNT(*) > 1",
        detail: "Filter groups after grouping (WHERE filters rows before).",
        example: "HAVING COUNT(*) > 1",
      },
      {
        name: "STRING_AGG",
        insert: "GROUP_CONCAT(, ', ')",
        syntax: "GROUP_CONCAT(col, ', ')",
        detail: "Join the values of a group into one text. STRING_AGG is the same.",
        example: "GROUP_CONCAT(name, ', ')",
      },
      {
        name: "ROW_NUMBER",
        insert: "ROW_NUMBER() OVER (PARTITION BY  ORDER BY )",
        syntax: "ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC)",
        detail:
          "Number rows inside each group. RANK and DENSE_RANK handle ties. Filter on it in an outer query for top-N per group.",
        example: "ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC)",
      },
      {
        name: "LAG",
        insert: "LAG(, 1) OVER (ORDER BY )",
        syntax: "LAG(col, 1) OVER (ORDER BY day)",
        detail:
          "The value from the previous row (LEAD for the next). For changes between rows.",
        example: "revenue - LAG(revenue) OVER (ORDER BY day)",
      },
      {
        name: "SUM OVER",
        insert: "SUM() OVER (ORDER BY )",
        syntax: "SUM(x) OVER (ORDER BY day)",
        detail:
          "A running total. Add ROWS BETWEEN 6 PRECEDING AND CURRENT ROW for a moving window.",
        example: "AVG(x) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)",
      },
      {
        name: "WITH",
        insert: "WITH step AS (\n  SELECT * FROM data\n)\nSELECT * FROM step;",
        syntax: "WITH name AS (SELECT ...) SELECT ... FROM name",
        detail: "Name an intermediate result so a long query reads in steps (a CTE).",
        example:
          "WITH big AS (SELECT * FROM data WHERE qty > 5) SELECT COUNT(*) FROM big",
      },
    ],
  },
  {
    id: "joins",
    title: "Joins and sets",
    items: [
      {
        name: "INNER JOIN",
        insert: "JOIN  ON ",
        syntax: "FROM a JOIN b ON a.id = b.a_id",
        detail: "Rows that have a match in both tables.",
        example: "FROM orders o JOIN customers c ON c.id = o.customer_id",
      },
      {
        name: "LEFT JOIN",
        insert: "LEFT JOIN  ON ",
        syntax: "FROM a LEFT JOIN b ON a.id = b.a_id",
        detail:
          "Every row of the left table, with empty values where the right has no match.",
        example: "FROM orders o LEFT JOIN customers c ON c.id = o.customer_id",
      },
      {
        name: "UNION ALL",
        insert: "UNION ALL",
        syntax: "SELECT ... UNION ALL SELECT ...",
        detail: "Stack the results of two queries (UNION also removes repeats).",
        example: "SELECT a FROM x UNION ALL SELECT a FROM y",
      },
      {
        name: "EXISTS",
        insert: "EXISTS (SELECT 1 FROM  WHERE )",
        syntax: "WHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id)",
        detail: "Keep a row only if a related row exists (NOT EXISTS for none).",
        example: "WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)",
      },
      {
        name: "CREATE TABLE result",
        insert: "CREATE TABLE result AS\n",
        syntax: "CREATE TABLE result AS SELECT ...",
        detail:
          "Build the answer table the cases judge. Run it as often as you like; each run replaces the old one.",
        example:
          "CREATE TABLE result AS SELECT region, SUM(qty) AS total FROM data GROUP BY region;",
      },
    ],
  },
];

/** Every function-like name, for autocomplete (duplicates by name are collapsed). */
export function sqlCompletionItems(): SqlRef[] {
  const seen = new Set<string>();
  const items: SqlRef[] = [];
  for (const group of SQL_REFERENCE) {
    for (const item of group.items) {
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      items.push(item);
    }
  }
  return items;
}

/** The functions whose names should complete even though the entry is a phrase (STRING_AGG -> GROUP_CONCAT). */
export const EXTRA_COMPLETIONS: SqlRef[] = [
  "DATEADD",
  "DATE_SUB",
  "DATE_PART",
  "TO_CHAR",
  "STR_TO_DATE",
  "MONTHNAME",
  "WEEK",
  "DAYOFWEEK",
  "MINUTE",
  "SECOND",
  "INITCAP",
  "LEFT",
  "RIGHT",
  "RPAD",
  "REPEAT",
  "STARTSWITH",
  "ENDSWITH",
  "CONTAINS",
  "NVL",
  "NVL2",
  "ZEROIFNULL",
  "LEAST",
  "TRUNC",
  "POW",
  "LN",
  "REGEXP_REPLACE",
  "REGEXP_SUBSTR",
  "REGEXP_LIKE",
  "REGEXP_COUNT",
  "RANK",
  "DENSE_RANK",
  "LEAD",
  "NTILE",
  "MEDIAN",
  "CURRENT_DATE",
].map((name) => ({
  name,
  insert: `${name}()`,
  syntax: `${name}(...)`,
  detail: "",
}));
