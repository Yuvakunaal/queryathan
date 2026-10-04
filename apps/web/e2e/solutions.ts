/**
 * One known-good answer per case and engine. The solutions suite plays every
 * case with these, so a change to the engines, the win logic or a case's data
 * that makes a case unwinnable (or makes a wrong answer win) fails CI.
 */
export interface Solution {
  world: string;
  caseId: string;
  python: string;
  sql: string;
}

const MOJIBAKE: [string, string][] = [
  ["é", "Ã©"],
  ["ë", "Ã«"],
  ["ø", "Ã¸"],
  ["ú", "Ãº"],
  ["í", "Ã­"],
  ["ü", "Ã¼"],
  ["á", "Ã¡"],
  ["ñ", "Ã±"],
  ["ç", "Ã§"],
  ["Ç", "Ã‡"],
  ["É", "Ã‰"],
  ["ö", "Ã¶"],
  ["ä", "Ã¤"],
  ["è", "Ã¨"],
];
const unmojibake = (column: string): string =>
  MOJIBAKE.reduce((acc, [good, bad]) => `REPLACE(${acc}, '${bad}', '${good}')`, column);

const FIX_TEXT_PY = `def fix(s):
    try:
        return s.encode('cp1252').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s
`;
const PHONE_PY = String.raw`df['phone'] = df['phone'].str.replace(r'\D', '', regex=True).str[-10:].str.replace(r'(\d{3})(\d{3})(\d{4})', r'\1-\2-\3', regex=True)`;
const PHONE_SQL_EXPR = String.raw`regexp_replace(substr(regexp_replace(phone, '\D', ''), -10), '^(\d{3})(\d{3})(\d{4})$', '$1-$2-$3')`;
const JOIN_COLUMNS = "d.*, c.customer_name, c.city";
const KEY_FIX_PY = "df['customer_id'] = df['customer_id'].str.strip().str.upper()\n";
const KEY_FIX_SQL = "UPDATE data SET customer_id = UPPER(TRIM(customer_id));\n";

export const SOLUTIONS: Solution[] = [
  // World 1: Boss Fights
  {
    world: "boss-fights",
    caseId: "w1-01-nul-sentinel",
    python: "df['temp_c'] = df['temp_c'].fillna(df['temp_c'].mean())",
    sql: "UPDATE data SET temp_c = (SELECT AVG(temp_c) FROM data) WHERE temp_c IS NULL;",
  },
  {
    world: "boss-fights",
    caseId: "w1-02-double-take",
    python:
      "df = df.dropna(subset=['customer_email'])\ndf = df.drop_duplicates(subset=['customer_email', 'item_sku', 'submitted_at']).reset_index(drop=True)",
    sql: "DELETE FROM data WHERE customer_email IS NULL;\nDELETE FROM data WHERE rowid NOT IN (SELECT MIN(rowid) FROM data GROUP BY customer_email, item_sku, submitted_at);",
  },
  {
    world: "boss-fights",
    caseId: "w1-03-case-shift",
    python:
      "df['sku'] = df['sku'].str.strip()\ndf['category'] = df['category'].str.upper()\ndf['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0).astype(int)",
    sql: "UPDATE data SET sku = TRIM(sku), category = UPPER(category), quantity = CAST(quantity AS INTEGER);",
  },
  {
    world: "boss-fights",
    caseId: "w1-04-the-reckoning",
    python: [
      "df['customer_email'] = df['customer_email'].str.strip()",
      "df = df.dropna(subset=['customer_email'])",
      "df = df.drop_duplicates(subset=['ticket_id'])",
      "df['status'] = df['status'].str.lower()",
      "df['opened_at'] = pd.to_datetime(df['opened_at'])",
      "df['first_response_hours'] = pd.to_numeric(df['first_response_hours'], errors='coerce')",
      "df = df.dropna(subset=['first_response_hours'])",
      "df = df[(df['first_response_hours'] >= 0) & (df['first_response_hours'] <= 336)].reset_index(drop=True)",
    ].join("\n"),
    sql: [
      "UPDATE data SET customer_email = TRIM(customer_email);",
      "DELETE FROM data WHERE customer_email IS NULL OR customer_email = '';",
      "DELETE FROM data WHERE rowid NOT IN (SELECT MIN(rowid) FROM data GROUP BY ticket_id);",
      "UPDATE data SET status = LOWER(status);",
      "UPDATE data SET opened_at = datetime(opened_at);",
      "DELETE FROM data WHERE first_response_hours IS NULL OR NOT (first_response_hours GLOB '*[0-9]*') OR first_response_hours GLOB '*[^0-9.-]*';",
      "UPDATE data SET first_response_hours = CAST(first_response_hours AS REAL);",
      "DELETE FROM data WHERE first_response_hours < 0 OR first_response_hours > 336;",
    ].join("\n"),
  },
  // World 2: The Vault
  {
    world: "the-vault",
    caseId: "w2-01-pin-tumbler",
    python: PHONE_PY,
    sql: `UPDATE data SET phone = ${PHONE_SQL_EXPR};`,
  },
  {
    world: "the-vault",
    caseId: "w2-02-host-lock",
    python: String.raw`df['site'] = df['site'].str.lower().str.extract(r'^(?:https?://)?(?:www\.)?([^/:?#]+)')[0]`,
    sql: String.raw`UPDATE data SET site = REGEXP_EXTRACT(LOWER(site), '^(?:https?://)?(?:www\.)?([^/:?#]+)');`,
  },
  {
    world: "the-vault",
    caseId: "w2-03-serial-lock",
    python: String.raw`df['ref'] = df['ref'].str.extract(r'(?i)(inv-\d{5})')[0].str.upper()
df['status'] = df['status'].str.strip().str.lower()`,
    sql: String.raw`UPDATE data SET ref = UPPER(REGEXP_EXTRACT(ref, '([Ii][Nn][Vv]-\d{5})')), status = LOWER(TRIM(status));`,
  },
  {
    world: "the-vault",
    caseId: "w2-04-latin-lock",
    python: `${FIX_TEXT_PY}for c in ['customer', 'city', 'comment']:\n    df[c] = df[c].apply(fix)`,
    sql: `UPDATE data SET customer = ${unmojibake("customer")}, city = ${unmojibake("city")}, comment = ${unmojibake("comment")};`,
  },
  {
    world: "the-vault",
    caseId: "w2-05-warden",
    python: `${FIX_TEXT_PY}df['name'] = df['name'].apply(fix)\n${String.raw`df['email'] = df['email'].str.extract(r'([\w.]+@[\w.]+\.[A-Za-z]{2,})')[0].str.lower()`}\n${PHONE_PY}`,
    sql: `UPDATE data SET name = ${unmojibake("name")}, email = ${String.raw`lower(regexp_extract(email, '([A-Za-z0-9._]+@[A-Za-z0-9.]+\.[A-Za-z]{2,})'))`}, phone = ${PHONE_SQL_EXPR};`,
  },
  // World 3: The Twins
  {
    world: "the-twins",
    caseId: "w3-01-key-mirror",
    python: "df = df.merge(customers, on='customer_id', how='left')",
    sql: `CREATE TABLE result AS SELECT ${JOIN_COLUMNS} FROM data d LEFT JOIN customers c ON c.customer_id = d.customer_id;`,
  },
  {
    world: "the-twins",
    caseId: "w3-02-ghost-twin",
    python: `${KEY_FIX_PY}df = df.merge(customers, on='customer_id', how='left')`,
    sql: `${KEY_FIX_SQL}CREATE TABLE result AS SELECT ${JOIN_COLUMNS} FROM data d LEFT JOIN customers c ON c.customer_id = d.customer_id;`,
  },
  {
    world: "the-twins",
    caseId: "w3-03-double-vision",
    python:
      "df = df.merge(customers.drop_duplicates('customer_id'), on='customer_id', how='left')",
    sql: `CREATE TABLE result AS SELECT ${JOIN_COLUMNS} FROM data d LEFT JOIN (SELECT DISTINCT * FROM customers) c ON c.customer_id = d.customer_id;`,
  },
  {
    world: "the-twins",
    caseId: "w3-04-the-twins",
    python: `${KEY_FIX_PY}df = df.merge(customers.drop_duplicates('customer_id'), on='customer_id', how='left')\ndf['customer_name'] = df['customer_name'].fillna('UNKNOWN')`,
    sql: `${KEY_FIX_SQL}CREATE TABLE result AS SELECT d.order_id, d.customer_id, d.item, d.amount, COALESCE(c.customer_name, 'UNKNOWN') AS customer_name, c.city FROM data d LEFT JOIN (SELECT DISTINCT * FROM customers) c ON c.customer_id = d.customer_id;`,
  },
  // World 4: The Architect
  {
    world: "the-architect",
    caseId: "w4-01-melt-form",
    python: "df = df.melt(id_vars='product', var_name='month', value_name='sales')",
    sql: "CREATE TABLE result AS SELECT product, 'jan' AS month, jan AS sales FROM data UNION ALL SELECT product, 'feb', feb FROM data UNION ALL SELECT product, 'mar', mar FROM data;",
  },
  {
    world: "the-architect",
    caseId: "w4-02-pivot-plan",
    python:
      "df = df.pivot(index='store', columns='month', values='revenue').reset_index()",
    sql: "CREATE TABLE result AS SELECT store, SUM(CASE WHEN month='jan' THEN revenue END) AS jan, SUM(CASE WHEN month='feb' THEN revenue END) AS feb, SUM(CASE WHEN month='mar' THEN revenue END) AS mar FROM data GROUP BY store;",
  },
  {
    world: "the-architect",
    caseId: "w4-03-json-vault",
    python:
      "import json\nflat = pd.json_normalize(df['payload'].apply(json.loads), sep='_')\ndf = pd.concat([df[['order_id']], flat], axis=1)",
    sql: "CREATE TABLE result AS SELECT order_id, json_extract(payload,'$.customer.id') AS customer_id, json_extract(payload,'$.customer.name') AS customer_name, json_extract(payload,'$.total') AS total FROM data;",
  },
  {
    world: "the-architect",
    caseId: "w4-04-the-architect",
    python:
      "import json\nmeta = pd.json_normalize(df['meta'].apply(json.loads))\ndf = pd.concat([df.drop(columns='meta'), meta], axis=1)\ndf = df.melt(id_vars=['id','region','channel','manager'], var_name='quarter', value_name='sales')",
    sql: ["q1", "q2", "q3", "q4"]
      .map(
        (q) =>
          `SELECT region, json_extract(meta,'$.channel') AS channel, json_extract(meta,'$.manager') AS manager, '${q}' AS quarter, ${q} AS sales FROM data`,
      )
      .join(" UNION ALL ")
      .replace(/^/, "CREATE TABLE result AS ")
      .concat(";"),
  },
  // World 5: The Foundry
  {
    world: "the-foundry",
    caseId: "w5-01-slow-lane",
    python: "df['total'] = df['qty'] * df['unit_price'] * (1 - df['discount'])",
    sql: "ALTER TABLE data ADD COLUMN total REAL;\nUPDATE data SET total = qty * unit_price * (1 - discount);",
  },
  {
    world: "the-foundry",
    caseId: "w5-02-running-laps",
    python: "df['running_total'] = df.groupby('customer_id')['amount'].cumsum()",
    sql: "DROP TABLE IF EXISTS result;\nCREATE TABLE result AS SELECT *, SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_id) AS running_total FROM data;",
  },
  // World 6: The Observatory
  {
    world: "the-observatory",
    caseId: "w6-01-first-light",
    python:
      "df = df[df['status'] == 'completed'].assign(revenue=lambda d: d['qty'] * d['unit_price']).groupby('region', as_index=False)['revenue'].sum()",
    sql: "CREATE TABLE result AS SELECT region, SUM(qty * unit_price) AS revenue FROM data WHERE status = 'completed' GROUP BY region;",
  },
  {
    world: "the-observatory",
    caseId: "w6-02-pole-position",
    python:
      "df['rank_in_category'] = df.groupby('category')['units_sold'].rank(ascending=False, method='first').astype(int)\ndf = df[df['rank_in_category'] <= 2][['category', 'product', 'units_sold', 'rank_in_category']]",
    sql: "CREATE TABLE result AS SELECT category, product, units_sold, rank_in_category FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rank_in_category FROM data) WHERE rank_in_category <= 2;",
  },
  {
    world: "the-observatory",
    caseId: "w6-03-sliding-glass",
    python:
      "df = df.sort_values('day').reset_index(drop=True)\ndf['avg_7d'] = df['revenue'].rolling(7, min_periods=1).mean()",
    sql: "CREATE TABLE result AS SELECT day, revenue, AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_7d FROM data;",
  },
  {
    world: "the-observatory",
    caseId: "w6-04-return-orbit",
    python: `df['cohort'] = pd.to_datetime(df['signup_date']).dt.strftime('%Y-%m')
df['next_month'] = (pd.to_datetime(df['signup_date']).dt.to_period('M') + 1).astype(str)
activity['month'] = pd.to_datetime(activity['active_date']).dt.strftime('%Y-%m')
back = df.merge(activity, on='user_id')
back = back[back['month'] == back['next_month']]
kept = back.groupby('cohort')['user_id'].nunique()
df = df.groupby('cohort', as_index=False).agg(users=('user_id', 'nunique'))
df['retained'] = df['cohort'].map(kept).fillna(0).astype(int)
df['retention_pct'] = (df['retained'] / df['users'] * 100).round(1)`,
    sql: "CREATE TABLE result AS SELECT strftime('%Y-%m', u.signup_date) AS cohort, COUNT(DISTINCT u.user_id) AS users, COUNT(DISTINCT a.user_id) AS retained, ROUND(100.0 * COUNT(DISTINCT a.user_id) / COUNT(DISTINCT u.user_id), 1) AS retention_pct FROM data u LEFT JOIN activity a ON a.user_id = u.user_id AND strftime('%Y-%m', a.active_date) = strftime('%Y-%m', date(u.signup_date, 'start of month', '+1 month')) GROUP BY cohort;",
  },
  {
    world: "the-observatory",
    caseId: "w6-05-break-in-the-clouds",
    python: `df['ts'] = pd.to_datetime(df['ts'])
df = df.sort_values(['user_id', 'ts'])
gap = df.groupby('user_id')['ts'].diff()
df['session'] = (gap.isna() | (gap > pd.Timedelta(minutes=30))).groupby(df['user_id']).cumsum()
per = df.groupby(['user_id', 'session']).size().reset_index(name='n')
df = per.groupby('user_id', as_index=False).agg(sessions=('session', 'count'), longest_session_events=('n', 'max'))`,
    sql: `CREATE TABLE result AS WITH gaps AS (
  SELECT user_id, ts, strftime('%s', ts) - strftime('%s', LAG(ts) OVER (PARTITION BY user_id ORDER BY ts)) AS gap FROM data
), marked AS (
  SELECT user_id, ts, SUM(CASE WHEN gap IS NULL OR gap > 1800 THEN 1 ELSE 0 END) OVER (PARTITION BY user_id ORDER BY ts) AS session FROM gaps
), per AS (
  SELECT user_id, session, COUNT(*) AS n FROM marked GROUP BY user_id, session
)
SELECT user_id, COUNT(*) AS sessions, MAX(n) AS longest_session_events FROM per GROUP BY user_id;`,
  },
  {
    world: "the-observatory",
    caseId: "w6-06-the-observatory",
    python: `first_view = df[df['step'] == 'view'].groupby('user_id').agg(device=('device', 'first'), t=('ts', 'min')).reset_index()
cart = df[df['step'] == 'cart'].merge(first_view[['user_id', 't']], on='user_id')
cart = cart[cart['ts'] > cart['t']].groupby('user_id')['ts'].min().rename('ct').reset_index()
buy = df[df['step'] == 'purchase'].merge(cart, on='user_id')
buy = buy[buy['ts'] > buy['ct']][['user_id']].drop_duplicates()
first_view['carted'] = first_view['user_id'].isin(cart['user_id'])
first_view['purchased'] = first_view['user_id'].isin(buy['user_id'])
df = first_view.groupby('device', as_index=False).agg(viewed=('user_id', 'count'), carted=('carted', 'sum'), purchased=('purchased', 'sum'))`,
    sql: `CREATE TABLE result AS WITH v AS (
  SELECT user_id, device, MIN(ts) AS t FROM data WHERE step = 'view' GROUP BY user_id, device
), c AS (
  SELECT v.user_id, MIN(d.ts) AS t FROM v JOIN data d ON d.user_id = v.user_id AND d.step = 'cart' AND d.ts > v.t GROUP BY v.user_id
), p AS (
  SELECT c.user_id FROM c JOIN data d ON d.user_id = c.user_id AND d.step = 'purchase' AND d.ts > c.t GROUP BY c.user_id
)
SELECT v.device, COUNT(*) AS viewed, COUNT(c.user_id) AS carted, COUNT(p.user_id) AS purchased FROM v LEFT JOIN c ON c.user_id = v.user_id LEFT JOIN p ON p.user_id = v.user_id GROUP BY v.device;`,
  },
];
