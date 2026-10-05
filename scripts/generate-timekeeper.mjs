#!/usr/bin/env node
// Generates World 8 (The Timekeeper): dates, calendars, time zones and change over time.
// Synthetic CC0 data, six case files and the roster. Expected answers are computed here in plain
// JavaScript on UTC numbers (so nothing depends on the machine's time zone); the end-to-end suite
// checks that real SQL and real pandas reach the very same tables.
// Run with: node scripts/generate-timekeeper.mjs
import {
  ANSWER_TAIL,
  createWorld,
  DAY,
  dateStr,
  hint,
  pad,
  round,
  sqlStarter,
  utc,
} from "./lib/kit.mjs";

const W = createWorld({
  number: 8,
  id: "the-timekeeper",
  seed: 0x544d4b50, // "TMKP"
  script: "generate-timekeeper.mjs",
  label: "World 8",
});
const { pick, int, chance, shuffle, license } = W;
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// 1. MIXED_CALENDARS: three date spellings in one column ------------------------------------
{
  const START = utc(2025, 9, 1);
  const rows = [];
  const expected = [];
  for (let i = 0; i < 60; i += 1) {
    const ms = START + int(0, 300) * DAY;
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    const style = i % 3;
    const raw =
      style === 0
        ? dateStr(ms)
        : style === 1
          ? `${pad(day)} ${MON[m]} ${y}`
          : `${MON[m]} ${day}, ${y}`;
    rows.push({ event_id: 5001 + i, raw_date: raw });
    expected.push([5001 + i, dateStr(ms)]);
  }
  const path = W.writeCsv(
    "events.csv",
    ["event_id", "raw_date"],
    shuffle(rows),
    "three spellings of a date",
  );
  W.writeCase("w8-01-mixed-calendars", {
    tier: "tutorial",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["date_parsing"],
    strings: {
      title: "MIXED_CALENDARS",
      subtitle: "Skill: reading dates that were typed three ways",
      briefing: `Three systems fed one event log, and each wrote dates its own way: 2026-03-05, 05 Mar 2026 and Mar 5, 2026 all appear in raw_date. They are text, so they cannot be sorted or compared as dates until they are converted.\n\nTurn every raw_date into one standard date written YYYY-MM-DD (for example 2026-03-05) in a column named event_date.\n\nGive one row per event with exactly these columns: event_id, event_date.\n\n${ANSWER_TAIL}`,
      task: "Convert raw_date, which uses three different spellings, to YYYY-MM-DD. Columns: event_id, event_date.",
    },
    starterCode: {
      python:
        "# df has 60 events: event_id, raw_date (three different spellings).\n# Replace df with your answer table (columns: event_id, event_date).\ndf.head()",
      sql: sqlStarter(
        "-- data has 60 events: event_id, raw_date (three different spellings).",
        "event_id, event_date",
      ),
    },
    columnHints: hint({
      event_id: [90, true],
      raw_date: [150, false],
      event_date: [120, false],
    }),
    hints: {
      python: [
        "pd.to_datetime understands many spellings. When one column mixes formats, pass format='mixed'.",
        "Then write the dates back out as text with .dt.strftime('%Y-%m-%d').",
        "df['event_date'] = pd.to_datetime(df['raw_date'], format='mixed').dt.strftime('%Y-%m-%d'); df = df[['event_id','event_date']]",
      ],
      sql: [
        "Look at the shape of each spelling with GLOB or LIKE: the ISO ones start with four digits and a dash.",
        "STR_TO_DATE(raw_date, '%d %b %Y') reads '05 Mar 2026'; STR_TO_DATE(raw_date, '%b %e, %Y') reads 'Mar 5, 2026'. A CASE expression picks the right one per row.",
        "CREATE TABLE result AS SELECT event_id, CASE WHEN raw_date GLOB '[0-9][0-9][0-9][0-9]-*' THEN raw_date WHEN raw_date GLOB '[0-9][0-9] *' THEN STR_TO_DATE(raw_date, '%d %b %Y') ELSE STR_TO_DATE(raw_date, '%b %e, %Y') END AS event_date FROM data;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["event_id", "event_date"],
          rows: expected,
          tolerance: 0,
        },
      ],
    },
  });
}

// 2. WORKING_DAYS: business days between two dates ------------------------------------------
{
  const START = utc(2026, 1, 5);
  const rows = [];
  const expected = [];
  for (let i = 0; i < 70; i += 1) {
    const o = START + int(0, 90) * DAY;
    const s = o + (chance(0.1) ? 0 : int(1, 16)) * DAY;
    rows.push({ order_id: 3001 + i, ordered: dateStr(o), shipped: dateStr(s) });
    let count = 0;
    for (let t = o + DAY; t <= s; t += DAY) {
      const wd = new Date(t).getUTCDay();
      if (wd !== 0 && wd !== 6) count += 1;
    }
    expected.push([3001 + i, count]);
  }
  const path = W.writeCsv(
    "shipments.csv",
    ["order_id", "ordered", "shipped"],
    shuffle(rows),
  );
  W.writeCase("w8-02-working-days", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["date_arithmetic"],
    strings: {
      title: "WORKING_DAYS",
      subtitle: "Skill: counting business days",
      briefing: `A shipping promise is measured in working days, not calendar days: Saturdays and Sundays do not count. For each order, count how many Monday-to-Friday days passed AFTER the order date, up to and including the ship date.\n\nExamples: ordered Friday, shipped the next Monday = 1 (only Monday counts). Ordered and shipped the same day = 0. Ordered Monday, shipped Friday of that week = 4.\n\nThere are no holidays to worry about: only weekends are excluded.\n\nGive one row per order with exactly these columns: order_id, business_days.\n\n${ANSWER_TAIL}`,
      task: "Count the weekdays (Mon-Fri) after ordered up to and including shipped. Columns: order_id, business_days.",
    },
    starterCode: {
      python:
        "# df has 70 orders: order_id, ordered, shipped (YYYY-MM-DD text).\n# Replace df with your answer table (columns: order_id, business_days).\ndf.head()",
      sql: sqlStarter(
        "-- data has 70 orders: order_id, ordered, shipped (YYYY-MM-DD text).",
        "order_id, business_days",
      ),
    },
    columnHints: hint({
      order_id: [90, true],
      ordered: [120, false],
      shipped: [120, false],
      business_days: [120, true],
    }),
    hints: {
      python: [
        "numpy has a function for exactly this: np.busday_count(begin, end) counts weekdays from begin up to but NOT including end.",
        "You count from the day after 'ordered' through 'shipped', so shift both by one day: begin = ordered + 1 day, end = shipped + 1 day.",
        "import numpy as np; o = pd.to_datetime(df['ordered']).values.astype('datetime64[D]') + 1; s = pd.to_datetime(df['shipped']).values.astype('datetime64[D]') + 1; df['business_days'] = np.busday_count(o, s)",
      ],
      sql: [
        "Build a calendar for each order: a recursive CTE that starts at the day after ordered and adds a day at a time until shipped.",
        "strftime('%w', day) gives 0 for Sunday and 6 for Saturday. Count the days that are neither. Orders shipped the same day have no calendar rows, so LEFT JOIN back to data and COALESCE to 0.",
        "CREATE TABLE result AS WITH RECURSIVE cal(order_id, day, last) AS (SELECT order_id, date(ordered, '+1 day'), shipped FROM data WHERE shipped > ordered UNION ALL SELECT order_id, date(day, '+1 day'), last FROM cal WHERE day < last) SELECT d.order_id, COALESCE(SUM(CASE WHEN strftime('%w', c.day) NOT IN ('0','6') THEN 1 ELSE 0 END), 0) AS business_days FROM data d LEFT JOIN cal c ON c.order_id = d.order_id GROUP BY d.order_id;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["order_id", "business_days"],
          rows: expected,
          tolerance: 0,
        },
      ],
    },
  });
}

// 3. LOCAL_TIME: UTC stamps and per-store offsets ---------------------------------------------
{
  const STORES = [
    ["Tokyo", 540],
    ["Mumbai", 330],
    ["London", 0],
    ["Sao Paulo", -180],
    ["New York", -300],
    ["Los Angeles", -480],
  ];
  const START = utc(2026, 3, 1);
  const rows = [];
  const counts = new Map();
  for (let i = 0; i < 200; i += 1) {
    const [store, offset] = pick(STORES);
    const ms = START + int(0, 4 * 24 * 60 - 1) * 60_000 + int(0, 59) * 1000;
    const d = new Date(ms);
    const stamp = `${dateStr(ms)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    rows.push({ order_id: 8001 + i, store, utc_ts: stamp });
    const local = dateStr(ms + offset * 60_000);
    const key = `${store}|${local}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const expected = [...counts.entries()].map(([k, n]) => {
    const [store, local] = k.split("|");
    return [store, local, n];
  });
  const path = W.writeCsv(
    "store-orders.csv",
    ["order_id", "store", "utc_ts"],
    shuffle(rows),
    "timestamps are UTC",
  );
  const spath = W.writeCsv(
    "store-offsets.csv",
    ["store", "utc_offset_minutes"],
    STORES.map(([store, o]) => ({ store, utc_offset_minutes: o })),
    "minutes east of UTC",
  );
  W.writeCase("w8-03-local-time", {
    tier: "mid-boss",
    datasetPath: path,
    extraTables: [{ name: "store_offsets", path: spath }],
    reshapes: true,
    datasetLicense: license,
    skills: ["time_zones"],
    strings: {
      title: "LOCAL_TIME",
      subtitle: "Skill: time zones (UTC to local)",
      briefing: `Orders are logged in UTC, but the business day of each store is the store's own local day. An order logged at 2026-03-02 22:30:00 UTC in Tokyo (UTC+9) happened on the morning of 3 March in Tokyo.\n\nThe table store_offsets gives each store's offset from UTC in minutes (positive is east of UTC, negative is west). Offsets are fixed: ignore daylight saving.\n\nCount the orders per store per LOCAL calendar date. Give exactly these columns: store, local_date, orders. Only days that have at least one order appear.\n\nIn Python, df is the orders and store_offsets is the offsets table. In SQL, data is the orders and store_offsets is the offsets table.\n\n${ANSWER_TAIL}`,
      task: "Convert each utc_ts to the store's local time using its offset, then count orders per store and local date. Columns: store, local_date, orders.",
    },
    starterCode: {
      python:
        "# df = orders (order_id, store, utc_ts in UTC). store_offsets = store, utc_offset_minutes.\n# Replace df with your answer table (columns: store, local_date, orders).\ndf.head()",
      sql: sqlStarter(
        "-- data = orders (order_id, store, utc_ts in UTC). store_offsets = store, utc_offset_minutes.",
        "store, local_date, orders",
      ),
    },
    columnHints: hint({
      order_id: [90, true],
      store: [120, false],
      utc_ts: [170, false],
      utc_offset_minutes: [150, true],
      local_date: [120, false],
      orders: [80, true],
    }),
    hints: {
      python: [
        "Join the offsets onto the orders by store, turn utc_ts into a real datetime, and add the offset as a timedelta in minutes.",
        "pd.to_timedelta(minutes, unit='m') makes the offset. The local date is (utc + offset).dt.strftime('%Y-%m-%d').",
        "m = df.merge(store_offsets, on='store'); m['local_date'] = (pd.to_datetime(m['utc_ts']) + pd.to_timedelta(m['utc_offset_minutes'], unit='m')).dt.strftime('%Y-%m-%d'); df = m.groupby(['store','local_date']).size().reset_index(name='orders')",
      ],
      sql: [
        "JOIN store_offsets on store. SQLite's date() and datetime() accept modifiers like '+540 minutes' or '-300 minutes'.",
        "date(utc_ts, utc_offset_minutes || ' minutes') shifts the stamp then keeps just the date. GROUP BY store and that local date.",
        "CREATE TABLE result AS SELECT o.store, date(o.utc_ts, f.utc_offset_minutes || ' minutes') AS local_date, COUNT(*) AS orders FROM data o JOIN store_offsets f ON f.store = o.store GROUP BY o.store, local_date;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["store", "local_date", "orders"],
          rows: expected,
          tolerance: 0,
        },
      ],
    },
  });
}

// 4. THE_SPINE: fill the missing days ----------------------------------------------------------
{
  const START = utc(2026, 2, 1);
  const DAYS = 59;
  const rows = [];
  const byDay = new Map();
  for (let i = 0; i < DAYS; i += 1) {
    if (i !== 0 && i !== DAYS - 1 && chance(0.28)) continue;
    const revenue = int(12000, 98000) / 100;
    byDay.set(i, revenue);
    rows.push({ day: dateStr(START + i * DAY), revenue: revenue.toFixed(2) });
  }
  const expected = [];
  for (let i = 0; i < DAYS; i += 1)
    expected.push([dateStr(START + i * DAY), byDay.get(i) ?? 0]);
  const path = W.writeCsv(
    "sparse-sales.csv",
    ["day", "revenue"],
    shuffle(rows),
    "days with no sales are missing, not zero",
  );
  W.writeCase("w8-04-the-spine", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["date_spine"],
    strings: {
      title: "THE_SPINE",
      subtitle: "Skill: filling the gaps in a timeline",
      briefing: `A shop logs one row per day it made sales. Days with no sales have NO row at all, which makes charts lie: a quiet Tuesday simply disappears.\n\nBuild a complete daily timeline from the first day in the table to the last, with every calendar day in between present exactly once. Days with no row get a revenue of 0.\n\nThe usual trick is a 'date spine': a table of every date, which you then join the real data onto.\n\nGive one row per calendar day with exactly these columns: day, revenue. Dates are written YYYY-MM-DD.\n\n${ANSWER_TAIL}`,
      task: "Return every calendar day from the first to the last, with revenue 0 where the day is missing. Columns: day, revenue.",
    },
    starterCode: {
      python:
        "# df has the days that had sales: day (YYYY-MM-DD), revenue.\n# Replace df with your answer table (columns: day, revenue).\ndf.head()",
      sql: sqlStarter(
        "-- data has the days that had sales: day (YYYY-MM-DD), revenue.",
        "day, revenue",
      ),
    },
    columnHints: hint({ day: [120, false], revenue: [110, true] }),
    hints: {
      python: [
        "Make the full range of dates with pd.date_range(first, last), then reindex your data onto it.",
        "Set the index to the real date, reindex(full_range, fill_value=0), then bring the date back as a column and as text.",
        "s = df.assign(day=pd.to_datetime(df['day'])).set_index('day')['revenue']; s = s.reindex(pd.date_range(s.index.min(), s.index.max()), fill_value=0); df = pd.DataFrame({'day': s.index.strftime('%Y-%m-%d'), 'revenue': s.values})",
      ],
      sql: [
        "SQL has no built-in list of dates, so build one with a recursive CTE: start at MIN(day) and keep adding date(day, '+1 day') until MAX(day).",
        "LEFT JOIN the spine to data on the date and COALESCE(revenue, 0) for the empty days.",
        "CREATE TABLE result AS WITH RECURSIVE spine(day) AS (SELECT MIN(day) FROM data UNION ALL SELECT date(day, '+1 day') FROM spine WHERE day < (SELECT MAX(day) FROM data)) SELECT s.day, COALESCE(d.revenue, 0) AS revenue FROM spine s LEFT JOIN data d ON d.day = s.day;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["day", "revenue"],
          rows: expected,
          tolerance: 0.01,
        },
      ],
    },
  });
}

// 5. AS_OF: the price in force on the day -----------------------------------------------------
{
  const PRODUCTS = ["Kettle", "Lamp", "Mug", "Clock", "Scale"];
  const START = utc(2025, 10, 1);
  const prices = [];
  const history = new Map();
  for (const p of PRODUCTS) {
    let price = int(800, 4000) / 100;
    let day = int(0, 5);
    const list = [];
    while (day < 220) {
      list.push({ product: p, effective_date: dateStr(START + day * DAY), price });
      price = Math.max(3, round(price * (1 + int(-12, 18) / 100), 2));
      day += int(18, 55);
    }
    history.set(p, list);
    prices.push(...list.map((r) => ({ ...r, price: r.price.toFixed(2) })));
  }
  const orders = [];
  const expected = [];
  for (let i = 0; i < 90; i += 1) {
    const product = pick(PRODUCTS);
    const day = int(6, 200);
    const date = dateStr(START + day * DAY);
    orders.push({ order_id: 6001 + i, product, ordered: date });
    const hit = history
      .get(product)
      .filter((r) => r.effective_date <= date)
      .at(-1);
    expected.push([6001 + i, hit.price]);
  }
  const path = W.writeCsv(
    "price-orders.csv",
    ["order_id", "product", "ordered"],
    shuffle(orders),
  );
  const ppath = W.writeCsv(
    "price-history.csv",
    ["product", "effective_date", "price"],
    shuffle(prices),
    "a new row each time a price changes",
  );
  W.writeCase("w8-05-as-of", {
    tier: "mid-boss",
    datasetPath: path,
    extraTables: [{ name: "prices", path: ppath }],
    reshapes: true,
    datasetLicense: license,
    skills: ["as_of_join"],
    strings: {
      title: "AS_OF",
      subtitle: "Skill: what was true on that day (as-of join)",
      briefing: `Prices change over time. The prices table has one row each time a product's price changed: from effective_date onward, the product costs that price, until the next row for the same product replaces it.\n\nFor every order, find the price that was in force on the day it was ordered: the row for that product with the latest effective_date that is on or before the order date. A price that changes ON the order date already applies.\n\nGive one row per order with exactly these columns: order_id, price.\n\nIn Python, df is the orders and prices is the price history. In SQL, data is the orders and prices is the price history.\n\n${ANSWER_TAIL}`,
      task: "For each order, pick the product's price whose effective_date is the latest one on or before the order date. Columns: order_id, price.",
    },
    starterCode: {
      python:
        "# df = orders (order_id, product, ordered). prices = product, effective_date, price.\n# Replace df with your answer table (columns: order_id, price).\ndf.head()",
      sql: sqlStarter(
        "-- data = orders (order_id, product, ordered). prices = product, effective_date, price.",
        "order_id, price",
      ),
    },
    columnHints: hint({
      order_id: [90, true],
      product: [110, false],
      ordered: [120, false],
      effective_date: [130, false],
      price: [90, true],
    }),
    hints: {
      python: [
        "pandas has a join made for this: pd.merge_asof matches each row to the latest earlier row. Both sides must be sorted by their date and the dates must be real datetimes.",
        "Use by='product' so each product only sees its own prices, and left_on='ordered', right_on='effective_date'.",
        "o = df.assign(ordered=pd.to_datetime(df['ordered'])).sort_values('ordered'); p = prices.assign(effective_date=pd.to_datetime(prices['effective_date'])).sort_values('effective_date'); df = pd.merge_asof(o, p, left_on='ordered', right_on='effective_date', by='product')[['order_id','price']]",
      ],
      sql: [
        "For each order, ask a question of the prices table: the newest row for this product that is not in the future. A correlated subquery with ORDER BY effective_date DESC LIMIT 1 does it.",
        "WHERE p.product = o.product AND p.effective_date <= o.ordered keeps only prices already in force.",
        "CREATE TABLE result AS SELECT o.order_id, (SELECT p.price FROM prices p WHERE p.product = o.product AND p.effective_date <= o.ordered ORDER BY p.effective_date DESC LIMIT 1) AS price FROM data o;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["order_id", "price"],
          rows: expected,
          tolerance: 0.001,
        },
      ],
    },
  });
}

// 6. THE_TIMEKEEPER: merging overlapping time blocks -----------------------------------------
{
  const ROOMS = ["Atlas", "Borealis", "Cirrus", "Delta"];
  const DAY0 = utc(2026, 4, 14);
  const rows = [];
  const merged = [];
  const fmt = (ms) => {
    const d = new Date(ms);
    return `${dateStr(ms)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };
  for (const room of ROOMS) {
    const list = [];
    for (let i = 0; i < 12; i += 1) {
      const start = DAY0 + (8 * 60 + int(0, 18) * 30) * 60_000;
      const end = start + int(1, 4) * 30 * 60_000;
      list.push({ start, end });
    }
    // touching booking: starts exactly when another ends
    const t = list[int(0, 11)];
    list.push({ start: t.end, end: t.end + 60 * 60_000 });
    for (const b of list) rows.push({ room, start_ts: fmt(b.start), end_ts: fmt(b.end) });
    list.sort((x, y) => x.start - y.start || x.end - y.end);
    let cur = null;
    for (const b of list) {
      if (cur && b.start <= cur.end) {
        cur.end = Math.max(cur.end, b.end);
        cur.n += 1;
      } else {
        if (cur) merged.push([room, fmt(cur.start), fmt(cur.end), cur.n]);
        cur = { start: b.start, end: b.end, n: 1 };
      }
    }
    merged.push([room, fmt(cur.start), fmt(cur.end), cur.n]);
  }
  const path = W.writeCsv(
    "bookings.csv",
    ["room", "start_ts", "end_ts"],
    shuffle(rows),
    "all on one day, written YYYY-MM-DD HH:MM",
  );
  W.writeCase("w8-06-the-timekeeper", {
    tier: "final-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["interval_merge"],
    strings: {
      title: "THE_TIMEKEEPER",
      subtitle: "Problem: not disclosed. Read the data.",
      briefing: `Meeting rooms are booked in blocks of time, and bookings in the same room often overlap or run back to back. Facilities wants to know when each room is actually occupied, as continuous blocks.\n\nMerge the bookings of each room. Two bookings belong to the same block when they overlap, or when one starts at exactly the moment another ends (back to back). A booking can lie entirely inside another, and a long booking can swallow several short ones. Rows come in no particular order.\n\nGive one row per merged block: room, block_start, block_end, bookings (how many bookings the block contains). Times are written like 2026-04-14 09:30.\n\n${ANSWER_TAIL}`,
      task: "Merge each room's overlapping or touching bookings into continuous blocks. Columns: room, block_start, block_end, bookings.",
    },
    starterCode: {
      python:
        "# df is a booking log: room, start_ts, end_ts (YYYY-MM-DD HH:MM).\n# Replace df with your answer table (columns: room, block_start, block_end, bookings).\ndf.head()",
      sql: sqlStarter(
        "-- data is a booking log: room, start_ts, end_ts (YYYY-MM-DD HH:MM).",
        "room, block_start, block_end, bookings",
      ),
    },
    columnHints: hint({
      room: [100, false],
      start_ts: [150, false],
      end_ts: [150, false],
      block_start: [150, false],
      block_end: [150, false],
      bookings: [90, true],
    }),
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["room", "block_start", "block_end", "bookings"],
          rows: merged,
          tolerance: 0,
        },
      ],
    },
  });
}

W.finish();
