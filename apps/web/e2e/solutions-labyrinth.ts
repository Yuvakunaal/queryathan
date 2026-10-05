import type { Solution } from "./solutions";

/** World 7: The Labyrinth. */
export const LABYRINTH_SOLUTIONS: Solution[] = [
  {
    world: "the-labyrinth",
    caseId: "w7-01-first-turn",
    python:
      "df['avg'] = df.groupby('dept')['salary'].transform('mean')\ndf = df[df['salary'] > df['avg']][['emp_id', 'name', 'dept', 'salary']]",
    sql: "CREATE TABLE result AS WITH dept_avg AS (SELECT dept, AVG(salary) AS avg_salary FROM data GROUP BY dept) SELECT d.emp_id, d.name, d.dept, d.salary FROM data d JOIN dept_avg a ON a.dept = d.dept WHERE d.salary > a.avg_salary;",
  },
  {
    world: "the-labyrinth",
    caseId: "w7-02-no-show",
    python:
      "done = orders[orders['status'] == 'completed']['customer_id']\ndf = df[~df['customer_id'].isin(done)][['customer_id', 'name']]",
    sql: "CREATE TABLE result AS SELECT c.customer_id, c.name FROM data c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'completed');",
  },
  {
    world: "the-labyrinth",
    caseId: "w7-03-chain-of-command",
    python: `names = dict(zip(df['emp_id'], df['name']))
mgr = {int(e): (None if pd.isna(m) else int(m)) for e, m in zip(df['emp_id'], df['manager_id'])}
def chain(i):
    return [names[i]] if mgr[i] is None else chain(mgr[i]) + [names[i]]
rows = [(int(i), names[i], len(chain(i)) - 1, ' > '.join(chain(i))) for i in names]
df = pd.DataFrame(rows, columns=['emp_id', 'name', 'depth', 'chain'])`,
    sql: "CREATE TABLE result AS WITH RECURSIVE tree AS (SELECT emp_id, name, 0 AS depth, name AS chain FROM data WHERE manager_id IS NULL UNION ALL SELECT d.emp_id, d.name, t.depth + 1, t.chain || ' > ' || d.name FROM data d JOIN tree t ON d.manager_id = t.emp_id) SELECT * FROM tree;",
  },
  {
    world: "the-labyrinth",
    caseId: "w7-04-the-two-lists",
    python: `a = set(df['email'].str.strip().str.lower())
b = set(list_b['email'].str.strip().str.lower())
df = pd.DataFrame([(e, 'A') for e in sorted(a - b)] + [(e, 'B') for e in sorted(b - a)], columns=['email', 'only_in'])`,
    sql: "CREATE TABLE result AS SELECT email, 'A' AS only_in FROM (SELECT LOWER(TRIM(email)) AS email FROM data EXCEPT SELECT LOWER(TRIM(email)) FROM list_b) UNION ALL SELECT email, 'B' FROM (SELECT LOWER(TRIM(email)) AS email FROM list_b EXCEPT SELECT LOWER(TRIM(email)) FROM data);",
  },
  {
    world: "the-labyrinth",
    caseId: "w7-05-unbroken",
    python: `d = df.drop_duplicates().copy()
d['d'] = pd.to_datetime(d['login_date'])
d = d.sort_values(['user_id', 'd'])
d['grp'] = d['d'] - pd.to_timedelta(d.groupby('user_id').cumcount(), unit='D')
g = d.groupby(['user_id', 'grp']).agg(start_date=('login_date', 'min'), end_date=('login_date', 'max'), days=('login_date', 'count')).reset_index()
df = g[g['days'] >= 3][['user_id', 'start_date', 'end_date', 'days']]`,
    sql: "CREATE TABLE result AS WITH d AS (SELECT DISTINCT user_id, login_date FROM data), n AS (SELECT user_id, login_date, date(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' days') AS grp FROM d) SELECT user_id, MIN(login_date) AS start_date, MAX(login_date) AS end_date, COUNT(*) AS days FROM n GROUP BY user_id, grp HAVING COUNT(*) >= 3;",
  },
  {
    world: "the-labyrinth",
    caseId: "w7-06-the-labyrinth",
    python: `parents = set(df['parent'])
cur = df[df['parent'] == 'Drone'][['child', 'qty']]
out = []
while len(cur):
    out.append(cur[~cur['child'].isin(parents)])
    m = cur[cur['child'].isin(parents)].merge(df, left_on='child', right_on='parent')
    cur = pd.DataFrame({'child': m['child_y'], 'qty': m['qty_x'] * m['qty_y']})
df = pd.concat(out).groupby('child', as_index=False)['qty'].sum().rename(columns={'child': 'component', 'qty': 'total_qty'})`,
    sql: "CREATE TABLE result AS WITH RECURSIVE parts AS (SELECT child, qty FROM data WHERE parent = 'Drone' UNION ALL SELECT d.child, p.qty * d.qty FROM parts p JOIN data d ON d.parent = p.child) SELECT child AS component, SUM(qty) AS total_qty FROM parts WHERE child NOT IN (SELECT parent FROM data) GROUP BY child;",
  },
];
