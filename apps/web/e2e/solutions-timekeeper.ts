import type { Solution } from "./solutions";

/** World 8: The Timekeeper. */
export const TIMEKEEPER_SOLUTIONS: Solution[] = [
  {
    world: "the-timekeeper",
    caseId: "w8-01-mixed-calendars",
    python:
      "df['event_date'] = pd.to_datetime(df['raw_date'], format='mixed').dt.strftime('%Y-%m-%d')\ndf = df[['event_id', 'event_date']]",
    sql: "CREATE TABLE result AS SELECT event_id, CASE WHEN raw_date GLOB '[0-9][0-9][0-9][0-9]-*' THEN raw_date WHEN raw_date GLOB '[0-9][0-9] *' THEN STR_TO_DATE(raw_date, '%d %b %Y') ELSE STR_TO_DATE(raw_date, '%b %e, %Y') END AS event_date FROM data;",
  },
  {
    world: "the-timekeeper",
    caseId: "w8-02-working-days",
    python: `import numpy as np
o = pd.to_datetime(df['ordered']).values.astype('datetime64[D]') + 1
s = pd.to_datetime(df['shipped']).values.astype('datetime64[D]') + 1
df['business_days'] = np.busday_count(o, s)
df = df[['order_id', 'business_days']]`,
    sql: "CREATE TABLE result AS WITH RECURSIVE cal(order_id, day, last) AS (SELECT order_id, date(ordered, '+1 day'), shipped FROM data WHERE shipped > ordered UNION ALL SELECT order_id, date(day, '+1 day'), last FROM cal WHERE day < last) SELECT d.order_id, COALESCE(SUM(CASE WHEN strftime('%w', c.day) NOT IN ('0','6') THEN 1 ELSE 0 END), 0) AS business_days FROM data d LEFT JOIN cal c ON c.order_id = d.order_id GROUP BY d.order_id;",
  },
  {
    world: "the-timekeeper",
    caseId: "w8-03-local-time",
    python: `m = df.merge(store_offsets, on='store')
m['local_date'] = (pd.to_datetime(m['utc_ts']) + pd.to_timedelta(m['utc_offset_minutes'], unit='m')).dt.strftime('%Y-%m-%d')
df = m.groupby(['store', 'local_date']).size().reset_index(name='orders')`,
    sql: "CREATE TABLE result AS SELECT o.store, date(o.utc_ts, f.utc_offset_minutes || ' minutes') AS local_date, COUNT(*) AS orders FROM data o JOIN store_offsets f ON f.store = o.store GROUP BY o.store, local_date;",
  },
  {
    world: "the-timekeeper",
    caseId: "w8-04-the-spine",
    python: `s = df.assign(day=pd.to_datetime(df['day'])).set_index('day')['revenue']
s = s.reindex(pd.date_range(s.index.min(), s.index.max()), fill_value=0)
df = pd.DataFrame({'day': s.index.strftime('%Y-%m-%d'), 'revenue': s.values})`,
    sql: "CREATE TABLE result AS WITH RECURSIVE spine(day) AS (SELECT MIN(day) FROM data UNION ALL SELECT date(day, '+1 day') FROM spine WHERE day < (SELECT MAX(day) FROM data)) SELECT s.day, COALESCE(d.revenue, 0) AS revenue FROM spine s LEFT JOIN data d ON d.day = s.day;",
  },
  {
    world: "the-timekeeper",
    caseId: "w8-05-as-of",
    python: `o = df.assign(ordered=pd.to_datetime(df['ordered'])).sort_values('ordered')
p = prices.assign(effective_date=pd.to_datetime(prices['effective_date'])).sort_values('effective_date')
df = pd.merge_asof(o, p, left_on='ordered', right_on='effective_date', by='product')[['order_id', 'price']]`,
    sql: "CREATE TABLE result AS SELECT o.order_id, (SELECT p.price FROM prices p WHERE p.product = o.product AND p.effective_date <= o.ordered ORDER BY p.effective_date DESC LIMIT 1) AS price FROM data o;",
  },
  {
    world: "the-timekeeper",
    caseId: "w8-06-the-timekeeper",
    python: `d = df.assign(s=pd.to_datetime(df['start_ts']), e=pd.to_datetime(df['end_ts'])).sort_values(['room', 's', 'e'])
d['prev_end'] = d.groupby('room')['e'].transform(lambda x: x.cummax().shift())
d['new'] = d['prev_end'].isna() | (d['s'] > d['prev_end'])
d['block'] = d.groupby('room')['new'].cumsum()
g = d.groupby(['room', 'block']).agg(block_start=('s', 'min'), block_end=('e', 'max'), bookings=('s', 'count')).reset_index()
g['block_start'] = g['block_start'].dt.strftime('%Y-%m-%d %H:%M')
g['block_end'] = g['block_end'].dt.strftime('%Y-%m-%d %H:%M')
df = g[['room', 'block_start', 'block_end', 'bookings']]`,
    sql: `CREATE TABLE result AS WITH m AS (
  SELECT room, start_ts, end_ts, MAX(end_ts) OVER (PARTITION BY room ORDER BY start_ts, end_ts ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_end FROM data
), f AS (
  SELECT *, SUM(CASE WHEN prev_end IS NULL OR start_ts > prev_end THEN 1 ELSE 0 END) OVER (PARTITION BY room ORDER BY start_ts, end_ts) AS block FROM m
)
SELECT room, MIN(start_ts) AS block_start, MAX(end_ts) AS block_end, COUNT(*) AS bookings FROM f GROUP BY room, block;`,
  },
];
