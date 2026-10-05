#!/usr/bin/env node
// Generates World 7 (The Labyrinth): CTEs, subqueries, recursion and set logic. Synthetic CC0 data,
// six case files and the roster. Expected answers are computed here in plain JavaScript from the
// definition in each briefing; the end-to-end suite then checks that real SQL and real pandas reach
// the very same tables. Run with: node scripts/generate-labyrinth.mjs
import { ANSWER_TAIL, createWorld, DAY, dateStr, hint, round, sqlStarter, utc } from "./lib/kit.mjs";

const W = createWorld({
  number: 7,
  id: "the-labyrinth",
  seed: 0x4c425254, // "LBRT"
  script: "generate-labyrinth.mjs",
  label: "World 7",
});
const { pick, int, chance, shuffle, license } = W;

const FIRST = ["Ava", "Ben", "Cara", "Dev", "Elio", "Fay", "Gus", "Hana", "Ivo", "Jun", "Kai", "Lena", "Milo", "Nia", "Omar", "Pia", "Quin", "Rhea", "Sol", "Tess", "Uma", "Vik", "Wren", "Xia", "Yara", "Zed"];
const LAST = ["Alder", "Birch", "Cedar", "Dunn", "Elm", "Fir", "Grove", "Hale", "Iris", "Juniper", "Knoll", "Larch", "Moss", "Nettle", "Oak", "Pine", "Quill", "Reed", "Sage", "Thorn"];
const uniqueNames = (n) => {
  const all = [];
  for (const f of FIRST) for (const l of LAST) all.push(`${f} ${l}`);
  return shuffle(all).slice(0, n);
};

// 1. FIRST_TURN: a CTE of department averages -------------------------------------------------
{
  const DEPTS = ["Design", "Engineering", "Finance", "Operations", "Support"];
  const base = { Design: 62000, Engineering: 88000, Finance: 71000, Operations: 54000, Support: 47000 };
  const names = uniqueNames(60);
  const rows = names.map((name, i) => {
    const dept = DEPTS[i % DEPTS.length];
    return { emp_id: 101 + i, name, dept, salary: base[dept] + int(-9, 14) * 1000 };
  });
  const avg = new Map(DEPTS.map((d) => {
    const s = rows.filter((r) => r.dept === d);
    return [d, s.reduce((a, r) => a + r.salary, 0) / s.length];
  }));
  const expected = rows.filter((r) => r.salary > avg.get(r.dept)).map((r) => [r.emp_id, r.name, r.dept, r.salary]);
  const path = W.writeCsv("employees.csv", ["emp_id", "name", "dept", "salary"], shuffle(rows));
  W.writeCase("w7-01-first-turn", {
    tier: "tutorial",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["cte"],
    strings: {
      title: "FIRST_TURN",
      subtitle: "Skill: your first CTE (WITH)",
      briefing: `Finance is reviewing pay. They want to see everyone who earns MORE than the average salary of their own department. Not the company average: the average of the department they work in.\n\nA CTE (the WITH keyword) is a named, temporary result you build first and then use like a table. It is the clean way to compute 'the average per department' once and reuse it.\n\nGive one row per employee who qualifies, with exactly these columns: emp_id, name, dept, salary.\n\n${ANSWER_TAIL}`,
      task: "List the employees paid strictly above their own department's average salary. Columns: emp_id, name, dept, salary.",
    },
    starterCode: {
      python: "# df has 60 employees: emp_id, name, dept, salary.\n# Replace df with your answer table (columns: emp_id, name, dept, salary).\ndf.head()",
      sql: sqlStarter("-- data has 60 employees: emp_id, name, dept, salary.", "emp_id, name, dept, salary"),
    },
    columnHints: hint({ emp_id: [90, true], name: [150, false], dept: [130, false], salary: [100, true] }),
    hints: {
      python: [
        "You need each row's department average next to it. groupby(...).transform('mean') gives exactly that: one value per row.",
        "df['dept_avg'] = df.groupby('dept')['salary'].transform('mean'), then keep the rows where salary > dept_avg.",
        "df['avg'] = df.groupby('dept')['salary'].transform('mean'); df = df[df['salary'] > df['avg']][['emp_id','name','dept','salary']]",
      ],
      sql: [
        "First build the averages in a CTE: WITH dept_avg AS (SELECT dept, AVG(salary) AS avg_salary FROM data GROUP BY dept).",
        "Then JOIN the CTE back to data on dept and keep rows where salary > avg_salary.",
        "CREATE TABLE result AS WITH dept_avg AS (SELECT dept, AVG(salary) AS avg_salary FROM data GROUP BY dept) SELECT d.emp_id, d.name, d.dept, d.salary FROM data d JOIN dept_avg a ON a.dept = d.dept WHERE d.salary > a.avg_salary;",
      ],
    },
    winCondition: { all: [{ predicate: "result_matches", columns: ["emp_id", "name", "dept", "salary"], rows: expected, tolerance: 0 }] },
  });
}

// 2. NO_SHOW: anti-join, and the NOT IN / NULL trap ------------------------------------------
{
  const names = uniqueNames(48);
  const customers = names.map((name, i) => ({ customer_id: 2001 + i, name }));
  const never = new Set(shuffle(customers).slice(0, 7).map((c) => c.customer_id));
  const cancelledOnly = new Set(shuffle(customers.filter((c) => !never.has(c.customer_id))).slice(0, 6).map((c) => c.customer_id));
  const orders = [];
  let oid = 9001;
  for (const c of customers) {
    if (never.has(c.customer_id)) continue;
    const n = int(1, 4);
    for (let i = 0; i < n; i += 1) {
      const status = cancelledOnly.has(c.customer_id) ? "cancelled" : i === 0 ? "completed" : pick(["completed", "completed", "cancelled", "refunded"]);
      orders.push({ order_id: oid++, customer_id: c.customer_id, amount: int(900, 24000) / 100, status });
    }
  }
  // guest checkouts: completed orders with no customer
  for (let i = 0; i < 5; i += 1) orders.push({ order_id: oid++, customer_id: "", amount: int(900, 24000) / 100, status: "completed" });
  const expected = customers
    .filter((c) => !orders.some((o) => o.customer_id === c.customer_id && o.status === "completed"))
    .map((c) => [c.customer_id, c.name]);
  const path = W.writeCsv("customers.csv", ["customer_id", "name"], shuffle(customers));
  const opath = W.writeCsv("orders.csv", ["order_id", "customer_id", "amount", "status"], shuffle(orders), "guest checkouts have an empty customer_id");
  W.writeCase("w7-02-no-show", {
    tier: "mid-boss",
    datasetPath: path,
    extraTables: [{ name: "orders", path: opath }],
    reshapes: true,
    datasetLicense: license,
    skills: ["anti_join"],
    strings: {
      title: "NO_SHOW",
      subtitle: "Skill: finding what is missing (anti-join)",
      briefing: `Marketing wants a win-back list: customers who have never completed an order. A customer with only cancelled or refunded orders counts. A customer with no orders at all counts too.\n\nThe orders table is right beside the customers table. Some completed orders are guest checkouts and have an empty customer_id. Think about what an empty value does to a lookup before you trust it.\n\nGive one row per customer on the list, with exactly these columns: customer_id, name.\n\nIn Python, df is the customers table and orders is the orders table. In SQL, data is the customers table and orders is the orders table.\n\n${ANSWER_TAIL}`,
      task: "List every customer with no completed order at all. Columns: customer_id, name.",
    },
    starterCode: {
      python: "# df = customers (customer_id, name). orders = order_id, customer_id, amount, status.\n# Replace df with your answer table (columns: customer_id, name).\ndf.head()",
      sql: sqlStarter("-- data = customers (customer_id, name). orders = order_id, customer_id, amount, status.", "customer_id, name"),
    },
    columnHints: hint({ customer_id: [110, true], name: [150, false], order_id: [90, true], amount: [90, true], status: [110, false] }),
    hints: {
      python: [
        "Find the customers who DO have a completed order first: orders[orders['status'] == 'completed']['customer_id'].",
        "Keep the customers whose id is NOT in that list: ~df['customer_id'].isin(...). A missing customer_id in orders is harmless here.",
        "done = orders[orders['status']=='completed']['customer_id']; df = df[~df['customer_id'].isin(done)][['customer_id','name']]",
      ],
      sql: [
        "'Customers with no matching order' is an anti-join. NOT EXISTS (SELECT 1 FROM orders ...) says exactly that.",
        "Beware: customer_id NOT IN (SELECT customer_id FROM orders ...) returns NOTHING if the subquery contains even one NULL. NOT EXISTS has no such trap.",
        "CREATE TABLE result AS SELECT c.customer_id, c.name FROM data c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'completed');",
      ],
    },
    winCondition: { all: [{ predicate: "result_matches", columns: ["customer_id", "name"], rows: expected, tolerance: 0 }] },
  });
}

// 3. CHAIN_OF_COMMAND: recursive CTE over an org chart ----------------------------------------
{
  const names = uniqueNames(40);
  const emp = [{ emp_id: 1, name: names[0], manager_id: "" }];
  for (let i = 1; i < 40; i += 1) {
    const pool = i < 4 ? [emp[0]] : emp.filter((e) => depthOf(e) < 4);
    emp.push({ emp_id: i + 1, name: names[i], manager_id: pick(pool).emp_id });
  }
  function depthOf(e) {
    let d = 0;
    let cur = e;
    while (cur.manager_id !== "") {
      cur = emp.find((x) => x.emp_id === cur.manager_id);
      d += 1;
    }
    return d;
  }
  const expected = emp.map((e) => {
    const chain = [];
    let cur = e;
    for (;;) {
      chain.unshift(cur.name);
      if (cur.manager_id === "") break;
      cur = emp.find((x) => x.emp_id === cur.manager_id);
    }
    return [e.emp_id, e.name, chain.length - 1, chain.join(" > ")];
  });
  const path = W.writeCsv("org.csv", ["emp_id", "name", "manager_id"], shuffle(emp), "the CEO has an empty manager_id");
  W.writeCase("w7-03-chain-of-command", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["recursive_cte"],
    strings: {
      title: "CHAIN_OF_COMMAND",
      subtitle: "Skill: walking a hierarchy (recursive CTE)",
      briefing: `An org chart is stored the way databases always store trees: each row knows only its own manager (manager_id). The CEO has none.\n\nHR needs, for every person, how deep they sit and the full reporting chain from the CEO down to them. The CEO is at depth 0. The chain lists names from the CEO to the person, joined with ' > ' (space, greater-than, space), for example: Ana Lee > Bo Kim > Cy Ray.\n\nYou cannot do this with a fixed number of joins, because the depth is not known in advance. In SQL, this is what a recursive CTE is for: it starts from the CEO and repeatedly adds the next level.\n\nGive one row per person, with exactly these columns: emp_id, name, depth, chain.\n\n${ANSWER_TAIL}`,
      task: "For every person return emp_id, name, depth (CEO = 0) and chain (names from the CEO down to the person, joined with ' > ').",
    },
    starterCode: {
      python: "# df has 40 people: emp_id, name, manager_id (empty for the CEO).\n# Replace df with your answer table (columns: emp_id, name, depth, chain).\ndf.head()",
      sql: sqlStarter("-- data has 40 people: emp_id, name, manager_id (NULL for the CEO).", "emp_id, name, depth, chain"),
    },
    columnHints: hint({ emp_id: [90, true], name: [150, false], manager_id: [110, true], depth: [80, true], chain: [360, false] }),
    hints: {
      python: [
        "Build it level by level: start with the CEO row, then repeatedly find the people whose manager_id is one of the rows you already have.",
        "Keep a dict from emp_id to its chain. Process rows until every person is placed: chain = chain_of_manager + ' > ' + name.",
        "names = dict(zip(df.emp_id, df.name)); mgr = dict(zip(df.emp_id, df.manager_id)); def chain(i): return names[i] if pd.isna(mgr[i]) else chain(int(mgr[i])) + ' > ' + names[i]",
      ],
      sql: [
        "A recursive CTE has two parts joined by UNION ALL: an anchor (the CEO: WHERE manager_id IS NULL) and a step that joins the CTE to data on data.manager_id = tree.emp_id.",
        "Carry depth + 1 and tree.chain || ' > ' || d.name down each step. Then SELECT from the CTE.",
        "CREATE TABLE result AS WITH RECURSIVE tree AS (SELECT emp_id, name, 0 AS depth, name AS chain FROM data WHERE manager_id IS NULL UNION ALL SELECT d.emp_id, d.name, t.depth + 1, t.chain || ' > ' || d.name FROM data d JOIN tree t ON d.manager_id = t.emp_id) SELECT * FROM tree;",
      ],
    },
    winCondition: { all: [{ predicate: "result_matches", columns: ["emp_id", "name", "depth", "chain"], rows: expected, tolerance: 0 }] },
  });
}

// 4. THE_TWO_LISTS: set operations with messy keys -------------------------------------------
{
  const people = uniqueNames(70).map((n) => n.toLowerCase().replace(" ", "."));
  const mk = (list) => list.map((p) => {
    let e = `${p}@example.org`;
    if (chance(0.3)) e = e.toUpperCase();
    else if (chance(0.15)) e = e[0].toUpperCase() + e.slice(1);
    if (chance(0.15)) e = ` ${e}`;
    if (chance(0.1)) e = `${e} `;
    return { email: e };
  });
  const a = people.slice(0, 48);
  const b = [...people.slice(28, 70)];
  const listA = shuffle([...mk(a), ...mk(a.slice(0, 8))]);
  const listB = shuffle([...mk(b), ...mk(b.slice(5, 11))]);
  const norm = (r) => r.email.trim().toLowerCase();
  const sa = new Set(listA.map(norm));
  const sb = new Set(listB.map(norm));
  const expected = [
    ...[...sa].filter((e) => !sb.has(e)).map((e) => [e, "A"]),
    ...[...sb].filter((e) => !sa.has(e)).map((e) => [e, "B"]),
  ];
  const path = W.writeCsv("list-a.csv", ["email"], listA, "has repeats and mixed case");
  const bpath = W.writeCsv("list-b.csv", ["email"], listB, "has repeats and mixed case");
  W.writeCase("w7-04-the-two-lists", {
    tier: "mid-boss",
    datasetPath: path,
    extraTables: [{ name: "list_b", path: bpath }],
    reshapes: true,
    datasetLicense: license,
    skills: ["set_operations"],
    strings: {
      title: "THE_TWO_LISTS",
      subtitle: "Skill: comparing lists (UNION, INTERSECT, EXCEPT)",
      briefing: `Two mailing lists must be merged. List A is the table you start with; list B is the table list_b beside it. Before merging, the team wants to know where the lists disagree.\n\nSome addresses appear more than once, and the same address is sometimes typed with different capital letters or stray spaces. 'Ann@Example.org ' and 'ann@example.org' are the same person.\n\nGive every address that is on exactly one of the two lists, written in clean lowercase with no spaces, once each, with a second column only_in saying which list it is on: 'A' or 'B'.\n\nExactly these columns: email, only_in.\n\nIn Python, df is list A and list_b is list B. In SQL, data is list A and list_b is list B.\n\n${ANSWER_TAIL}`,
      task: "Clean every address (trim, lowercase), then return those found on only one list. Columns: email, only_in ('A' or 'B').",
    },
    starterCode: {
      python: "# df = list A (email). list_b = list B (email).\n# Replace df with your answer table (columns: email, only_in).\ndf.head()",
      sql: sqlStarter("-- data = list A (email). list_b = list B (email).", "email, only_in"),
    },
    columnHints: hint({ email: [280, false], only_in: [90, false] }),
    hints: {
      python: [
        "Clean first: df['email'].str.strip().str.lower(). Turn each list into a set.",
        "Python sets have set difference: a - b are the items only in a.",
        "a = set(df['email'].str.strip().str.lower()); b = set(list_b['email'].str.strip().str.lower()); df = pd.DataFrame([(e,'A') for e in sorted(a-b)] + [(e,'B') for e in sorted(b-a)], columns=['email','only_in'])",
      ],
      sql: [
        "SQL has set operators: EXCEPT keeps rows of the first query that are not in the second. They also remove duplicates for you.",
        "Clean inside each query with LOWER(TRIM(email)). Do EXCEPT in both directions and stack the two results with UNION ALL.",
        "CREATE TABLE result AS SELECT email, 'A' AS only_in FROM (SELECT LOWER(TRIM(email)) AS email FROM data EXCEPT SELECT LOWER(TRIM(email)) FROM list_b) UNION ALL SELECT email, 'B' FROM (SELECT LOWER(TRIM(email)) AS email FROM list_b EXCEPT SELECT LOWER(TRIM(email)) FROM data);",
      ],
    },
    winCondition: { all: [{ predicate: "result_matches", columns: ["email", "only_in"], rows: expected, tolerance: 0 }] },
  });
}

// 5. UNBROKEN: gaps and islands -------------------------------------------------------------
{
  const START = utc(2026, 1, 1);
  const logins = [];
  const expected = [];
  for (let u = 1; u <= 14; u += 1) {
    const days = new Set();
    let cursor = int(0, 4);
    while (cursor < 80) {
      const len = int(1, 7);
      for (let k = 0; k < len; k += 1) days.add(cursor + k);
      cursor += len + int(2, 9);
    }
    const sorted = [...days].sort((x, y) => x - y).filter((d) => d < 90);
    for (const d of sorted) {
      const times = chance(0.25) ? 2 : 1;
      for (let t = 0; t < times; t += 1) logins.push({ user_id: 700 + u, login_date: dateStr(START + d * DAY) });
    }
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
      if (j - i + 1 >= 3) expected.push([700 + u, dateStr(START + sorted[i] * DAY), dateStr(START + sorted[j] * DAY), j - i + 1]);
      i = j + 1;
    }
  }
  const path = W.writeCsv("logins.csv", ["user_id", "login_date"], shuffle(logins), "some users log in twice on a day");
  W.writeCase("w7-05-unbroken", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["gaps_and_islands"],
    strings: {
      title: "UNBROKEN",
      subtitle: "Skill: consecutive runs (gaps and islands)",
      briefing: `A learning app rewards streaks. A streak is a run of consecutive calendar days on which a user logged in at least once. Missing even one day ends the streak.\n\nThe log has one row per login, so a user can appear twice on the same day (that is still one day). Rows come in no particular order.\n\nGive one row per streak of 3 days or longer: user_id, start_date, end_date, days. Dates are written like 2026-01-31.\n\nHint for the idea (not the code): if you number each user's distinct days 1, 2, 3 and subtract that number from the date, every day in the same unbroken run lands on the same value.\n\n${ANSWER_TAIL}`,
      task: "Find every run of 3 or more consecutive login days per user. Columns: user_id, start_date, end_date, days.",
    },
    starterCode: {
      python: "# df is a login log: user_id, login_date (YYYY-MM-DD).\n# Replace df with your answer table (columns: user_id, start_date, end_date, days).\ndf.head()",
      sql: sqlStarter("-- data is a login log: user_id, login_date (YYYY-MM-DD).", "user_id, start_date, end_date, days"),
    },
    columnHints: hint({ user_id: [90, true], login_date: [120, false], start_date: [120, false], end_date: [120, false], days: [70, true] }),
    hints: {
      python: [
        "Drop repeats first: df.drop_duplicates(). Sort by user and date, and turn the date into a real date with pd.to_datetime.",
        "Within each user, subtract the day number (cumcount) from the date. Days of one unbroken run share that value, so group by (user_id, that value).",
        "d = df.drop_duplicates().assign(d=lambda x: pd.to_datetime(x['login_date'])).sort_values(['user_id','d']); d['grp'] = d['d'] - pd.to_timedelta(d.groupby('user_id').cumcount(), unit='D')",
      ],
      sql: [
        "First get distinct days: SELECT DISTINCT user_id, login_date FROM data. Then number them per user with ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date).",
        "date(login_date, '-' || rn || ' days') is the same for every day of one streak. GROUP BY user_id and that value; MIN and MAX of login_date are the start and end.",
        "CREATE TABLE result AS WITH d AS (SELECT DISTINCT user_id, login_date FROM data), n AS (SELECT user_id, login_date, date(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' days') AS grp FROM d) SELECT user_id, MIN(login_date) AS start_date, MAX(login_date) AS end_date, COUNT(*) AS days FROM n GROUP BY user_id, grp HAVING COUNT(*) >= 3;",
      ],
    },
    winCondition: { all: [{ predicate: "result_matches", columns: ["user_id", "start_date", "end_date", "days"], rows: expected, tolerance: 0 }] },
  });
}

// 6. THE_LABYRINTH: a bill of materials, recursion with multiplication ------------------------
{
  const bom = [
    ["Drone", "Frame", 1], ["Drone", "Rotor Assembly", 4], ["Drone", "Flight Controller", 1], ["Drone", "Battery Pack", 1],
    ["Frame", "Arm", 4], ["Frame", "Center Plate", 2], ["Frame", "Screw M3", 16],
    ["Arm", "Carbon Tube", 1], ["Arm", "Screw M3", 2],
    ["Rotor Assembly", "Motor", 1], ["Rotor Assembly", "Propeller", 1], ["Rotor Assembly", "Screw M3", 4],
    ["Motor", "Copper Coil", 1], ["Motor", "Magnet", 6], ["Motor", "Bearing", 2],
    ["Flight Controller", "Circuit Board", 1], ["Flight Controller", "Gyro Chip", 1], ["Flight Controller", "Screw M3", 4],
    ["Battery Pack", "Cell", 4], ["Battery Pack", "Wire Harness", 1], ["Battery Pack", "Battery Case", 1],
    ["Wire Harness", "Copper Wire", 3], ["Wire Harness", "Connector", 2],
    ["Rover", "Chassis", 1], ["Rover", "Wheel Assembly", 4], ["Rover", "Flight Controller", 1],
    ["Chassis", "Steel Plate", 2], ["Chassis", "Screw M3", 8],
    ["Wheel Assembly", "Wheel", 1], ["Wheel Assembly", "Bearing", 2], ["Wheel Assembly", "Screw M3", 2],
  ];
  const parents = new Set(bom.map((r) => r[0]));
  const totals = new Map();
  const walk = (part, mult) => {
    for (const [p, c, q] of bom) {
      if (p !== part) continue;
      if (parents.has(c)) walk(c, mult * q);
      else totals.set(c, (totals.get(c) ?? 0) + mult * q);
    }
  };
  walk("Drone", 1);
  const expected = [...totals.entries()].sort().map(([c, q]) => [c, q]);
  const rows = shuffle(bom).map(([parent, child, qty]) => ({ parent, child, qty }));
  const path = W.writeCsv("bom.csv", ["parent", "child", "qty"], rows, "a bill of materials for two products");
  W.writeCase("w7-06-the-labyrinth", {
    tier: "final-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["recursive_cte"],
    strings: {
      title: "THE_LABYRINTH",
      subtitle: "Problem: not disclosed. Read the data.",
      briefing: `A factory stores what every product is made of as a bill of materials. Each row says: to make ONE parent, you need qty of a child. A child can itself be a part with its own children (a Frame is made of Arms, an Arm of tubes and screws...). A part that never appears as a parent is a raw component bought from outside.\n\nProduction wants the shopping list for ONE Drone: every raw component and the total quantity needed, across every level. The same component (like 'Screw M3') is used in many places, so its quantities must be added up. The Rover also lives in this table but must not appear in the answer, except where it shares a part with the Drone.\n\nGive one row per raw component of the Drone: component, total_qty.\n\n${ANSWER_TAIL}`,
      task: "Expand the Drone fully. For every raw component return component and total_qty (summed over all levels, multiplying quantities down the tree).",
    },
    starterCode: {
      python: "# df is a bill of materials: parent, child, qty.\n# Replace df with your answer table (columns: component, total_qty).\ndf.head()",
      sql: sqlStarter("-- data is a bill of materials: parent, child, qty.", "component, total_qty"),
    },
    columnHints: hint({ parent: [170, false], child: [170, false], qty: [70, true], component: [170, false], total_qty: [110, true] }),
    hints: {
      python: [
        "Expand level by level: start with the Drone's direct children, then replace every child that is itself a parent with its own children, multiplying the quantities.",
        "A loop works: merge the current list with df on child == parent, multiply qty columns, repeat until no row is a parent any more. Then sum per component.",
        "cur = df[df.parent=='Drone'][['child','qty']]; parents = set(df.parent); out = []\nwhile len(cur): leaf = cur[~cur.child.isin(parents)]; out.append(leaf); m = cur[cur.child.isin(parents)].merge(df, left_on='child', right_on='parent'); cur = pd.DataFrame({'child': m.child_y, 'qty': m.qty_x * m.qty_y})",
      ],
      sql: [
        "A recursive CTE again. Anchor: the Drone's direct children with their qty. Step: join to data where data.parent = the previous child, multiplying qty.",
        "Every row of the CTE is one 'path' with an accumulated quantity. Keep only rows whose child is not a parent anywhere (NOT IN (SELECT parent FROM data)), then GROUP BY child and SUM.",
        "CREATE TABLE result AS WITH RECURSIVE parts AS (SELECT child, qty FROM data WHERE parent = 'Drone' UNION ALL SELECT d.child, p.qty * d.qty FROM parts p JOIN data d ON d.parent = p.child) SELECT child AS component, SUM(qty) AS total_qty FROM parts WHERE child NOT IN (SELECT parent FROM data) GROUP BY child;",
      ],
    },
    winCondition: { all: [{ predicate: "result_matches", columns: ["component", "total_qty"], rows: expected, tolerance: 0 }] },
  });
}

W.finish();
