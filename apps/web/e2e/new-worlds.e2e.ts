import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";

/**
 * Worlds 7 to 9 judge an answer table. These are the classic wrong answers of each
 * concept: each must fail, and must not hand over the answer.
 */
async function noWin(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("NOT IN with a NULL in the subquery returns nothing, so it does not win", async ({
  page,
}) => {
  await openCase(page, "the-labyrinth", "w7-02-no-show", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT customer_id, name FROM data WHERE customer_id NOT IN (SELECT customer_id FROM orders WHERE status = 'completed');",
  );
  await run(page);
  await expect(page.getByText(/has 0 rows; the answer needs \d+/)).toBeVisible();
  await noWin(page);
});

test("counting every window row without DISTINCT days breaks the streaks", async ({
  page,
}) => {
  await openCase(page, "the-labyrinth", "w7-05-unbroken", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS WITH n AS (SELECT user_id, login_date, date(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' days') AS grp FROM data) SELECT user_id, MIN(login_date) AS start_date, MAX(login_date) AS end_date, COUNT(*) AS days FROM n GROUP BY user_id, grp HAVING COUNT(*) >= 3;",
  );
  await run(page);
  await noWin(page);
});

test("calendar days are not business days", async ({ page }) => {
  await openCase(page, "the-timekeeper", "w8-02-working-days", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT order_id, CAST(julianday(shipped) - julianday(ordered) AS INTEGER) AS business_days FROM data;",
  );
  await run(page);
  await noWin(page);
});

test("forgetting the offset puts orders on the wrong local day", async ({ page }) => {
  await openCase(page, "the-timekeeper", "w8-03-local-time", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT store, date(utc_ts) AS local_date, COUNT(*) AS orders FROM data GROUP BY store, local_date;",
  );
  await run(page);
  await noWin(page);
});

test("population standard deviation is not the sample one", async ({ page }) => {
  await openCase(page, "the-laboratory", "w9-01-the-spread", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT lab, COUNT(*) AS n, ROUND(AVG(value), 3) AS mean_value, ROUND(STDDEV_POP(value), 3) AS std_value FROM data GROUP BY lab;",
  );
  await run(page);
  await noWin(page);
});

test("bands that put 25 in the wrong place do not win", async ({ page }) => {
  await openCase(page, "the-laboratory", "w9-04-buckets", "python");
  await setCode(
    page,
    "df['age_band'] = pd.cut(df['age'], bins=[0, 25, 35, 50, 65, 200], labels=['Under 25', '25-34', '35-49', '50-64', '65+'])\ndf = df.groupby('age_band', as_index=False, observed=True).agg(customers=('customer_id', 'count'), avg_spend=('spend', 'mean')).round(2)",
  );
  await run(page);
  await noWin(page);
});

test("new SQL statistics functions are available in the sandbox-style fight", async ({
  page,
}) => {
  await openCase(page, "the-laboratory", "w9-01-the-spread", "sql");
  await setCode(
    page,
    "SELECT STDDEV(value) AS s, VARIANCE(value) AS v, CORR(value, sample_id) AS c, MEDIAN(value) AS m FROM data;",
  );
  await run(page);
  await expect(page.getByText(/no such function/i)).toHaveCount(0);
});

test("before the first run the answer HUD asks for a run instead of comparing the original data", async ({
  page,
}) => {
  await openCase(page, "the-laboratory", "w9-01-the-spread", "sql");
  await expect(
    page.getByText(/Run your code to see how close your answer is/),
  ).toBeVisible();
  await expect(page.getByText(/Your answer has \d+ rows/)).toHaveCount(0);
  await setCode(page, "CREATE TABLE result AS SELECT lab FROM data GROUP BY lab;");
  await run(page);
  await expect(page.getByText(/Run your code to see how close/)).toHaveCount(0);
  await expect(page.getByText(/missing column|Your answer has/).first()).toBeVisible();
});
