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
  {
    id: "ctes",
    title: "CTEs, subqueries and sets",
    items: [
      {
        name: "WITH (CTE)",
        insert: "WITH named AS (\n  SELECT ...\n)\nSELECT * FROM named",
        syntax: "WITH name AS (SELECT ...) SELECT ... FROM name",
        detail:
          "Gives a query a name so you can build the answer in readable steps. Several CTEs are separated by commas, and each can use the ones before it.",
        example:
          "WITH t AS (SELECT dept, AVG(salary) AS a FROM data GROUP BY dept) SELECT * FROM t",
      },
      {
        name: "answer from a CTE",
        insert:
          "CREATE TABLE result AS\nWITH step AS (\n  SELECT ...\n)\nSELECT * FROM step;",
        syntax: "CREATE TABLE result AS WITH ... SELECT ...",
        detail:
          "The CTE goes after AS: CREATE TABLE result AS WITH ... SELECT .... (Or run the WITH query alone and press the 'use as answer' button.)",
        example: "CREATE TABLE result AS WITH t AS (SELECT * FROM data) SELECT * FROM t;",
      },
      {
        name: "WITH RECURSIVE",
        insert:
          "WITH RECURSIVE walk AS (\n  SELECT ... -- the start\n  UNION ALL\n  SELECT ... FROM data JOIN walk ON ... -- the next step\n)\nSELECT * FROM walk",
        syntax: "WITH RECURSIVE r AS (anchor UNION ALL step) SELECT ...",
        detail:
          "Repeats a step until nothing new is found. Use it for trees (org charts, parts lists), chains and calendars. The step must join to the CTE itself.",
        example:
          "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 5) SELECT i FROM n",
      },
      {
        name: "date spine",
        insert:
          "WITH RECURSIVE spine(day) AS (\n  SELECT MIN(day) FROM data\n  UNION ALL\n  SELECT date(day, '+1 day') FROM spine WHERE day < (SELECT MAX(day) FROM data)\n)\nSELECT * FROM spine",
        syntax: "spine of every date between two dates",
        detail:
          "A table with one row per calendar day. LEFT JOIN your data onto it so quiet days show up as zero instead of disappearing.",
        example:
          "SELECT s.day, COALESCE(d.revenue, 0) FROM spine s LEFT JOIN data d ON d.day = s.day",
      },
      {
        name: "subquery in FROM",
        insert: "SELECT * FROM (\n  SELECT ... \n) AS t",
        syntax: "FROM (SELECT ...) AS alias",
        detail:
          "Use a query as a table. Handy for filtering on a window function, which WHERE cannot do directly.",
        example:
          "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY x) AS rn FROM data) WHERE rn <= 3",
      },
      {
        name: "scalar subquery",
        insert: "(SELECT MAX() FROM data)",
        syntax: "(SELECT one_value FROM ...)",
        detail:
          "A query that returns a single value, used like a number in a SELECT or WHERE.",
        example: "SELECT * FROM data WHERE amount > (SELECT AVG(amount) FROM data)",
      },
      {
        name: "EXISTS / NOT EXISTS",
        insert: "WHERE NOT EXISTS (\n  SELECT 1 FROM other o WHERE o.id = data.id\n)",
        syntax: "WHERE [NOT] EXISTS (SELECT 1 FROM t2 WHERE t2.k = t1.k)",
        detail:
          "Keeps rows that have (or have no) match in another table. NOT EXISTS is the safe way to find 'rows with no match'.",
        example:
          "SELECT * FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)",
      },
      {
        name: "NOT IN trap",
        insert: "WHERE id NOT IN (SELECT id FROM other WHERE id IS NOT NULL)",
        syntax: "x NOT IN (SELECT ...)",
        detail:
          "If the subquery contains even one NULL, NOT IN returns no rows at all. Filter the NULLs out, or use NOT EXISTS.",
        example:
          "WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL)",
      },
      {
        name: "UNION / UNION ALL",
        insert: "SELECT ... FROM a\nUNION ALL\nSELECT ... FROM b",
        syntax: "q1 UNION [ALL] q2",
        detail:
          "Stacks results. UNION removes duplicates; UNION ALL keeps every row (and is faster). Columns must line up by position.",
        example: "SELECT email FROM a UNION SELECT email FROM b",
      },
      {
        name: "INTERSECT / EXCEPT",
        insert: "SELECT ... FROM a\nEXCEPT\nSELECT ... FROM b",
        syntax: "q1 INTERSECT q2 / q1 EXCEPT q2",
        detail:
          "INTERSECT keeps rows found in both. EXCEPT keeps rows of the first that are NOT in the second. Both remove duplicates.",
        example: "SELECT email FROM a EXCEPT SELECT email FROM b",
      },
      {
        name: "gaps and islands",
        insert:
          "SELECT user_id, MIN(d), MAX(d), COUNT(*)\nFROM (\n  SELECT user_id, d, date(d, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d) || ' days') AS grp FROM days\n)\nGROUP BY user_id, grp",
        syntax: "date minus row number = run id",
        detail:
          "Finds streaks of consecutive days: subtract each day's row number from the date and every day in an unbroken run gets the same value.",
        example: "GROUP BY user_id, grp",
      },
      {
        name: "running max (merge intervals)",
        insert:
          "MAX(end_ts) OVER (PARTITION BY room ORDER BY start_ts ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)",
        syntax: "MAX(x) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)",
        detail:
          "The largest end time seen so far, before this row. A new block starts when a row begins after that.",
        example: "CASE WHEN prev_end IS NULL OR start_ts > prev_end THEN 1 ELSE 0 END",
      },
      {
        name: "frame: ROWS BETWEEN",
        insert: "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW",
        syntax: "ROWS BETWEEN <n> PRECEDING AND CURRENT ROW",
        detail:
          "The window of rows a calculation sees. Every PRECEDING/FOLLOWING needs a number (or UNBOUNDED): ROWS BETWEEN PRECEDING AND ... is a syntax error.",
        example: "AVG(x) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)",
      },
    ],
  },
  {
    id: "stats",
    title: "Statistics, bands and lookups",
    items: [
      {
        name: "STDDEV",
        insert: "STDDEV()",
        syntax: "STDDEV(x) / STDDEV_SAMP(x) / STDDEV_POP(x)",
        detail:
          "Spread of a column. STDDEV is the sample version (divide by n - 1), the same as pandas .std(). STDDEV_POP divides by n.",
        example: "SELECT group_col, STDDEV(x) FROM data GROUP BY group_col",
      },
      {
        name: "VARIANCE",
        insert: "VARIANCE()",
        syntax: "VARIANCE(x) / VAR_SAMP(x) / VAR_POP(x)",
        detail:
          "The square of the standard deviation. VARIANCE and VAR_SAMP are the sample version.",
        example: "SELECT VAR_POP(x) FROM data",
      },
      {
        name: "MEDIAN",
        insert: "MEDIAN()",
        syntax: "MEDIAN(x)",
        detail:
          "The middle value, ignoring NULLs. Robust to outliers, so it is the usual value for filling gaps.",
        example: "SELECT ward, MEDIAN(bp) FROM data GROUP BY ward",
      },
      {
        name: "PERCENTILE",
        insert: "PERCENTILE(, 90)",
        syntax: "PERCENTILE(x, p)",
        detail:
          "The value below which p percent of the rows fall (p from 0 to 100). PERCENTILE(x, 50) is the median.",
        example: "SELECT PERCENTILE(x, 90) FROM data",
      },
      {
        name: "CORR",
        insert: "CORR(, )",
        syntax: "CORR(y, x)",
        detail:
          "Pearson correlation between two columns: from -1 to 1. Rows where either value is NULL are skipped.",
        example: "SELECT CORR(response, dose) FROM data",
      },
      {
        name: "COVAR_POP",
        insert: "COVAR_POP(, )",
        syntax: "COVAR_POP(y, x) / COVAR_SAMP(y, x)",
        detail:
          "How two columns move together. Slope of the best-fit line = COVAR_POP(y, x) / VAR_POP(x).",
        example: "COVAR_POP(response, dose) / VAR_POP(dose)",
      },
      {
        name: "z-score",
        insert: "(x - AVG(x) OVER ()) / STDDEV(x) OVER ()",
        syntax: "(value - mean) / standard deviation",
        detail:
          "How many standard deviations a value is from the average. Beyond +/-3 is the classic outlier rule. Use a CTE with GROUP BY for a per-group version.",
        example: "(value - m) / sd",
      },
      {
        name: "COALESCE fill",
        insert: "COALESCE(, )",
        syntax: "COALESCE(x, replacement)",
        detail:
          "The first value that is not NULL: fills gaps with a fixed value or a computed one such as a group median.",
        example: "COALESCE(bp, ward_median)",
      },
      {
        name: "SQRT / ROUND",
        insert: "ROUND(SQRT(), 3)",
        syntax: "SQRT(x), ROUND(x, places)",
        detail:
          "Square root and rounding, both needed for formulas such as the z statistic of an A/B test.",
        example: "ROUND(SQRT(p * (1 - p)), 3)",
      },
      {
        name: "CASE bins",
        insert: "CASE WHEN x < 10 THEN 'low' WHEN x < 20 THEN 'mid' ELSE 'high' END",
        syntax: "CASE WHEN cond THEN v ... ELSE v END",
        detail:
          "Turns numbers into labelled bands. Branches are checked top to bottom, so each needs only its upper limit.",
        example:
          "CASE WHEN age < 25 THEN 'Under 25' WHEN age < 35 THEN '25-34' ELSE '35+' END",
      },
      {
        name: "NTILE",
        insert: "NTILE(4) OVER (ORDER BY x DESC)",
        syntax: "NTILE(n) OVER (ORDER BY x)",
        detail: "Splits the ordered rows into n equal buckets (quartiles for 4).",
        example: "NTILE(4) OVER (ORDER BY spend DESC)",
      },
      {
        name: "as-of lookup",
        insert:
          "(SELECT p.price FROM prices p WHERE p.product = o.product AND p.effective_date <= o.ordered ORDER BY p.effective_date DESC LIMIT 1)",
        syntax: "correlated subquery with ORDER BY ... DESC LIMIT 1",
        detail:
          "The value that was in force on a date: the newest row that is not in the future.",
        example: "SELECT o.id, (SELECT ... LIMIT 1) AS price FROM data o",
      },
      {
        name: "local time",
        insert: "date(utc_ts, offset_minutes || ' minutes')",
        syntax: "date(ts, '+540 minutes')",
        detail:
          "Shifts a UTC stamp by an offset in minutes (negative is west of UTC) before taking its date.",
        example: "date('2026-03-02 22:30:00', '540 minutes') -> 2026-03-03",
      },
      {
        name: "weekday",
        insert: "strftime('%w', day)",
        syntax: "strftime('%w', date)",
        detail:
          "Day of the week as a text digit: 0 is Sunday and 6 is Saturday. Business days are the others.",
        example: "strftime('%w', day) NOT IN ('0', '6')",
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
  "STDDEV",
  "STDDEV_POP",
  "VARIANCE",
  "VAR_POP",
  "CORR",
  "COVAR_POP",
  "PERCENTILE",
  "CURRENT_DATE",
].map((name) => ({
  name,
  insert: `${name}()`,
  syntax: `${name}(...)`,
  detail: "",
}));
