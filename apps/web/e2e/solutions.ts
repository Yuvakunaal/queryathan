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
];
