import type { Solution } from "./solutions";

/** World 9: The Laboratory. */
export const LABORATORY_SOLUTIONS: Solution[] = [
  {
    world: "the-laboratory",
    caseId: "w9-01-the-spread",
    python:
      "df = df.groupby('lab', as_index=False)['value'].agg(n='count', mean_value='mean', std_value='std').round(3)",
    sql: "CREATE TABLE result AS SELECT lab, COUNT(*) AS n, ROUND(AVG(value), 3) AS mean_value, ROUND(STDDEV(value), 3) AS std_value FROM data GROUP BY lab;",
  },
  {
    world: "the-laboratory",
    caseId: "w9-02-three-sigma",
    python: `g = df.groupby('sensor')['value']
df['z_score'] = ((df['value'] - g.transform('mean')) / g.transform('std')).round(2)
df = df[df['z_score'].abs() > 3]`,
    sql: "CREATE TABLE result AS WITH s AS (SELECT sensor, AVG(value) AS m, STDDEV(value) AS sd FROM data GROUP BY sensor) SELECT d.reading_id, d.sensor, d.value, ROUND((d.value - s.m) / s.sd, 2) AS z_score FROM data d JOIN s ON s.sensor = d.sensor WHERE ABS((d.value - s.m) / s.sd) > 3;",
  },
  {
    world: "the-laboratory",
    caseId: "w9-03-fill-the-holes",
    python:
      "df['bp_filled'] = df['bp'].fillna(df.groupby('ward')['bp'].transform('median'))\ndf = df[['patient_id', 'ward', 'bp_filled']]",
    sql: "CREATE TABLE result AS WITH m AS (SELECT ward, MEDIAN(bp) AS med FROM data GROUP BY ward) SELECT d.patient_id, d.ward, COALESCE(d.bp, m.med) AS bp_filled FROM data d JOIN m ON m.ward = d.ward;",
  },
  {
    world: "the-laboratory",
    caseId: "w9-04-buckets",
    python: `df['age_band'] = pd.cut(df['age'], bins=[0, 25, 35, 50, 65, 200], right=False, labels=['Under 25', '25-34', '35-49', '50-64', '65+'])
df = df.groupby('age_band', as_index=False, observed=True).agg(customers=('customer_id', 'count'), avg_spend=('spend', 'mean')).round(2)`,
    sql: "CREATE TABLE result AS SELECT CASE WHEN age < 25 THEN 'Under 25' WHEN age < 35 THEN '25-34' WHEN age < 50 THEN '35-49' WHEN age < 65 THEN '50-64' ELSE '65+' END AS age_band, COUNT(*) AS customers, ROUND(AVG(spend), 2) AS avg_spend FROM data GROUP BY age_band;",
  },
  {
    world: "the-laboratory",
    caseId: "w9-05-split-test",
    python: `import math
g = df.groupby('variant')['converted'].agg(['count', 'sum'])
n1, x1 = g.loc['control']
n2, x2 = g.loc['test']
p1, p2 = x1 / n1, x2 / n2
p = (x1 + x2) / (n1 + n2)
z = (p2 - p1) / math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
df = pd.DataFrame([[round(p1, 3), round(p2, 3), round((p2 - p1) / p1 * 100, 3), round(z, 3)]], columns=['control_rate', 'test_rate', 'lift_pct', 'z_score'])`,
    sql: "CREATE TABLE result AS WITH g AS (SELECT SUM(variant = 'control') AS n1, SUM(CASE WHEN variant = 'control' THEN converted END) AS x1, SUM(variant = 'test') AS n2, SUM(CASE WHEN variant = 'test' THEN converted END) AS x2 FROM data), r AS (SELECT n1, n2, x1 * 1.0 / n1 AS p1, x2 * 1.0 / n2 AS p2, (x1 + x2) * 1.0 / (n1 + n2) AS p FROM g) SELECT ROUND(p1, 3) AS control_rate, ROUND(p2, 3) AS test_rate, ROUND((p2 - p1) / p1 * 100, 3) AS lift_pct, ROUND((p2 - p1) / SQRT(p * (1 - p) * (1.0 / n1 + 1.0 / n2)), 3) AS z_score FROM r;",
  },
  {
    world: "the-laboratory",
    caseId: "w9-06-the-laboratory",
    python: `def fit(t):
    x, y = t['dose'], t['response']
    slope = x.cov(y) / x.var()
    return pd.Series({'n': len(t), 'slope': slope, 'intercept': y.mean() - slope * x.mean(), 'r': x.corr(y)})
ok = df.dropna(subset=['response'])
out = ok.groupby('compound')[['dose', 'response']].apply(fit).reset_index()
df = out[out['n'] >= 8].round(3)`,
    sql: "CREATE TABLE result AS SELECT compound, COUNT(*) AS n, ROUND(COVAR_POP(response, dose) / VAR_POP(dose), 3) AS slope, ROUND(AVG(response) - COVAR_POP(response, dose) / VAR_POP(dose) * AVG(dose), 3) AS intercept, ROUND(CORR(response, dose), 3) AS r FROM data WHERE response IS NOT NULL GROUP BY compound HAVING COUNT(*) >= 8;",
  },
];
