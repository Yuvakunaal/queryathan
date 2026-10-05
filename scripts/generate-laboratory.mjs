#!/usr/bin/env node
// Generates World 9 (The Laboratory): statistics, outliers, imputation, binning, experiments and
// regression. Synthetic CC0 data, six case files and the roster. Expected answers are computed
// here in plain JavaScript from the definition in each briefing; the end-to-end suite then checks
// that real SQL and real pandas reach the very same tables.
// Run with: node scripts/generate-laboratory.mjs
import { ANSWER_TAIL, createWorld, hint, round, sqlStarter } from "./lib/kit.mjs";

const W = createWorld({
  number: 9,
  id: "the-laboratory",
  seed: 0x4c414230, // "LAB0"
  script: "generate-laboratory.mjs",
  label: "World 9",
});
const { int, chance, shuffle, random, license } = W;

const gauss = () => {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sampleVar = (xs) => {
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
};
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// 1. THE_SPREAD: count, mean and standard deviation per group ---------------------------------
{
  const LABS = [
    ["Alder Lab", 48, 2.1],
    ["Birch Lab", 52, 4.4],
    ["Cedar Lab", 47, 1.2],
    ["Dunn Lab", 55, 3.3],
  ];
  const rows = [];
  let id = 1;
  for (const [lab, mu, sd] of LABS)
    for (let i = 0; i < 30; i += 1)
      rows.push({ sample_id: id++, lab, value: round(mu + gauss() * sd, 2).toFixed(2) });
  const expected = LABS.map(([lab]) => {
    const v = rows.filter((r) => r.lab === lab).map((r) => Number(r.value));
    return [lab, v.length, round(mean(v), 3), round(Math.sqrt(sampleVar(v)), 3)];
  });
  const path = W.writeCsv(
    "measurements.csv",
    ["sample_id", "lab", "value"],
    shuffle(rows),
  );
  W.writeCase("w9-01-the-spread", {
    tier: "tutorial",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["descriptive_stats"],
    strings: {
      title: "THE_SPREAD",
      subtitle: "Skill: mean and standard deviation per group",
      briefing: `Four labs measured the same quantity. An average alone hides how consistent each lab is, so the quality team wants the average AND the spread (standard deviation) of each lab's measurements.\n\nUse the SAMPLE standard deviation (divide by n - 1), which is what pandas .std() and SQL STDDEV compute. Round mean_value and std_value to 3 decimals.\n\nGive one row per lab with exactly these columns: lab, n, mean_value, std_value.\n\n${ANSWER_TAIL}`,
      task: "For each lab return n (how many samples), mean_value and std_value (sample standard deviation), both rounded to 3 decimals. Columns: lab, n, mean_value, std_value.",
    },
    starterCode: {
      python:
        "# df has 120 measurements: sample_id, lab, value.\n# Replace df with your answer table (columns: lab, n, mean_value, std_value).\ndf.head()",
      sql: sqlStarter(
        "-- data has 120 measurements: sample_id, lab, value.",
        "lab, n, mean_value, std_value",
      ),
    },
    columnHints: hint({
      sample_id: [100, true],
      lab: [120, false],
      value: [90, true],
      n: [60, true],
      mean_value: [120, true],
      std_value: [120, true],
    }),
    hints: {
      python: [
        "groupby('lab')['value'] followed by .agg lets you compute several statistics at once with named results.",
        ".agg(n='count', mean_value='mean', std_value='std') names each output column. Then round the two decimals.",
        "df = df.groupby('lab', as_index=False)['value'].agg(n='count', mean_value='mean', std_value='std').round(3)",
      ],
      sql: [
        "COUNT(*), AVG(value) and STDDEV(value) all work with GROUP BY lab. STDDEV is the sample standard deviation.",
        "Wrap the two statistics in ROUND(..., 3).",
        "CREATE TABLE result AS SELECT lab, COUNT(*) AS n, ROUND(AVG(value), 3) AS mean_value, ROUND(STDDEV(value), 3) AS std_value FROM data GROUP BY lab;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["lab", "n", "mean_value", "std_value"],
          rows: expected,
          tolerance: 0.002,
        },
      ],
    },
  });
}

// 2. THREE_SIGMA: z-score outliers ---------------------------------------------------------------
{
  const SENSORS = [
    ["S-North", 50],
    ["S-South", 61],
    ["S-East", 44],
    ["S-West", 57],
    ["S-Roof", 38],
  ];
  const rows = [];
  let id = 1;
  for (const [sensor, mu] of SENSORS)
    for (let i = 0; i < 40; i += 1) {
      const spike = chance(0.06);
      const v = mu + gauss() * 2.2 + (spike ? (chance(0.5) ? 1 : -1) * int(16, 26) : 0);
      rows.push({ reading_id: id++, sensor, value: round(v, 2).toFixed(2) });
    }
  const expected = [];
  for (const [sensor] of SENSORS) {
    const own = rows.filter((r) => r.sensor === sensor);
    const v = own.map((r) => Number(r.value));
    const m = mean(v);
    const sd = Math.sqrt(sampleVar(v));
    for (const r of own) {
      const z = (Number(r.value) - m) / sd;
      if (Math.abs(Math.abs(z) - 3) < 0.02)
        throw new Error("z too close to the threshold; change the seed");
      if (Math.abs(z) > 3)
        expected.push([r.reading_id, sensor, Number(r.value), round(z, 2)]);
    }
  }
  const path = W.writeCsv(
    "sensor-readings.csv",
    ["reading_id", "sensor", "value"],
    shuffle(rows),
  );
  W.writeCase("w9-02-three-sigma", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["outliers"],
    strings: {
      title: "THREE_SIGMA",
      subtitle: "Skill: spotting outliers with z-scores",
      briefing: `Five sensors report a reading now and then. Occasionally one spikes far outside its normal range. The z-score says how many standard deviations a reading sits from its own sensor's average:\n\nz = (value - sensor_mean) / sensor_std\n\nwhere sensor_mean and sensor_std are computed over that sensor's readings only, and sensor_std is the SAMPLE standard deviation (divide by n - 1). A reading is an outlier when its z-score is more than 3 away from zero in either direction (z > 3 or z < -3).\n\nGive one row per outlier with exactly these columns: reading_id, sensor, value, z_score. Round z_score to 2 decimals.\n\n${ANSWER_TAIL}`,
      task: "Find the readings whose z-score within their own sensor is beyond +/-3. Columns: reading_id, sensor, value, z_score (2 decimals).",
    },
    starterCode: {
      python:
        "# df has 200 readings: reading_id, sensor, value.\n# Replace df with your answer table (columns: reading_id, sensor, value, z_score).\ndf.head()",
      sql: sqlStarter(
        "-- data has 200 readings: reading_id, sensor, value.",
        "reading_id, sensor, value, z_score",
      ),
    },
    columnHints: hint({
      reading_id: [100, true],
      sensor: [110, false],
      value: [90, true],
      z_score: [100, true],
    }),
    hints: {
      python: [
        "You need each sensor's mean and standard deviation next to every reading. groupby(...).transform('mean') and transform('std') give one value per row.",
        "z = (value - mean) / std, per row. Keep the rows where z.abs() > 3.",
        "g = df.groupby('sensor')['value']; df['z_score'] = ((df['value'] - g.transform('mean')) / g.transform('std')).round(2); df = df[df['z_score'].abs() > 3]",
      ],
      sql: [
        "Compute the per-sensor mean and standard deviation in a CTE: AVG(value) and STDDEV(value) GROUP BY sensor, then JOIN it back.",
        "Filter in the outer query: ABS((value - mean) / sd) > 3. Round the z-score you output.",
        "CREATE TABLE result AS WITH s AS (SELECT sensor, AVG(value) AS m, STDDEV(value) AS sd FROM data GROUP BY sensor) SELECT d.reading_id, d.sensor, d.value, ROUND((d.value - s.m) / s.sd, 2) AS z_score FROM data d JOIN s ON s.sensor = d.sensor WHERE ABS((d.value - s.m) / s.sd) > 3;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["reading_id", "sensor", "value", "z_score"],
          rows: expected,
          tolerance: 0.011,
        },
      ],
    },
  });
}

// 3. FILL_THE_HOLES: impute with the group median ---------------------------------------------
{
  const WARDS = [
    ["North", 122, 9],
    ["South", 134, 12],
    ["East", 118, 7],
  ];
  const rows = [];
  let id = 1;
  for (const [ward, mu, sd] of WARDS)
    for (let i = 0; i < 30; i += 1) {
      const bp = Math.round(mu + gauss() * sd);
      rows.push({ patient_id: 400 + id++, ward, bp: chance(0.22) ? "" : bp });
    }
  const med = new Map(
    WARDS.map(([w]) => [
      w,
      median(rows.filter((r) => r.ward === w && r.bp !== "").map((r) => r.bp)),
    ]),
  );
  const expected = rows.map((r) => [
    r.patient_id,
    r.ward,
    r.bp === "" ? med.get(r.ward) : r.bp,
  ]);
  const path = W.writeCsv(
    "blood-pressure.csv",
    ["patient_id", "ward", "bp"],
    shuffle(rows),
    "about a fifth of bp is missing",
  );
  W.writeCase("w9-03-fill-the-holes", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["imputation"],
    strings: {
      title: "FILL_THE_HOLES",
      subtitle: "Skill: filling missing values sensibly",
      briefing: `About one patient in five has no blood pressure reading (bp is empty). A model cannot use empty cells, and filling them with 0 would be a disaster. A safer, standard choice is the MEDIAN of the same ward: it is robust to outliers and respects that wards differ.\n\nFill every missing bp with the median bp of that patient's own ward, computed only from the readings that exist. Patients who already have a reading keep it. For an even number of readings, the median is the average of the two middle values.\n\nGive one row per patient with exactly these columns: patient_id, ward, bp_filled.\n\n${ANSWER_TAIL}`,
      task: "Replace each missing bp with the median bp of the patient's ward. Columns: patient_id, ward, bp_filled.",
    },
    starterCode: {
      python:
        "# df has 90 patients: patient_id, ward, bp (empty when missing).\n# Replace df with your answer table (columns: patient_id, ward, bp_filled).\ndf.head()",
      sql: sqlStarter(
        "-- data has 90 patients: patient_id, ward, bp (NULL when missing).",
        "patient_id, ward, bp_filled",
      ),
    },
    columnHints: hint({
      patient_id: [100, true],
      ward: [100, false],
      bp: [80, true],
      bp_filled: [110, true],
    }),
    hints: {
      python: [
        "groupby('ward')['bp'].transform('median') gives each row its ward's median, and it ignores the missing values on its own.",
        "fillna replaces the missing cells: df['bp'].fillna(that_median).",
        "df['bp_filled'] = df['bp'].fillna(df.groupby('ward')['bp'].transform('median')); df = df[['patient_id','ward','bp_filled']]",
      ],
      sql: [
        "SQL has MEDIAN(bp) as an aggregate; it skips NULLs. Compute one per ward in a CTE and join it back.",
        "COALESCE(bp, ward_median) keeps the real value when it exists and falls back to the median otherwise.",
        "CREATE TABLE result AS WITH m AS (SELECT ward, MEDIAN(bp) AS med FROM data GROUP BY ward) SELECT d.patient_id, d.ward, COALESCE(d.bp, m.med) AS bp_filled FROM data d JOIN m ON m.ward = d.ward;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["patient_id", "ward", "bp_filled"],
          rows: expected,
          tolerance: 0.01,
        },
      ],
    },
  });
}

// 4. BUCKETS: binning a continuous column -------------------------------------------------------
{
  const BANDS = ["Under 25", "25-34", "35-49", "50-64", "65+"];
  const bandOf = (age) => (age < 25 ? 0 : age < 35 ? 1 : age < 50 ? 2 : age < 65 ? 3 : 4);
  const rows = [];
  const fixed = [24, 25, 34, 35, 49, 50, 64, 65, 18, 90];
  for (let i = 0; i < 100; i += 1) {
    const age =
      i < fixed.length
        ? fixed[i]
        : Math.min(92, Math.max(18, Math.round(41 + gauss() * 16)));
    rows.push({ customer_id: 3000 + i, age, spend: (int(800, 39000) / 100).toFixed(2) });
  }
  const expected = BANDS.map((label, b) => {
    const g = rows.filter((r) => bandOf(r.age) === b);
    return [label, g.length, round(mean(g.map((r) => Number(r.spend))), 2)];
  });
  const path = W.writeCsv(
    "customers-by-age.csv",
    ["customer_id", "age", "spend"],
    shuffle(rows),
  );
  W.writeCase("w9-04-buckets", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["binning"],
    strings: {
      title: "BUCKETS",
      subtitle: "Skill: turning numbers into bands (binning)",
      briefing: `Analysts rarely work with every single age; they group people into bands. Put each customer into one of five age bands:\n\n- Under 25: ages below 25\n- 25-34: ages 25 up to and including 34\n- 35-49: ages 35 up to and including 49\n- 50-64: ages 50 up to and including 64\n- 65+: ages 65 and over\n\nTake care at the edges: a customer who is exactly 25 belongs in 25-34, not in Under 25.\n\nFor each band return how many customers it holds and their average spend, rounded to 2 decimals. Give exactly these columns: age_band, customers, avg_spend. Every band has at least one customer.\n\n${ANSWER_TAIL}`,
      task: "Bin age into the five bands above, then count customers and average spend (2 decimals) per band. Columns: age_band, customers, avg_spend.",
    },
    starterCode: {
      python:
        "# df has 100 customers: customer_id, age, spend.\n# Replace df with your answer table (columns: age_band, customers, avg_spend).\ndf.head()",
      sql: sqlStarter(
        "-- data has 100 customers: customer_id, age, spend.",
        "age_band, customers, avg_spend",
      ),
    },
    columnHints: hint({
      customer_id: [100, true],
      age: [70, true],
      spend: [90, true],
      age_band: [110, false],
      customers: [90, true],
      avg_spend: [100, true],
    }),
    hints: {
      python: [
        "pd.cut turns numbers into labelled bands. bins=[0, 25, 35, 50, 65, 200] defines the edges.",
        "By default each bin is open on the left and closed on the right. For 'age 25 starts a band' you need right=False.",
        "df['age_band'] = pd.cut(df['age'], bins=[0,25,35,50,65,200], right=False, labels=['Under 25','25-34','35-49','50-64','65+']); df = df.groupby('age_band', as_index=False, observed=True).agg(customers=('customer_id','count'), avg_spend=('spend','mean')).round(2)",
      ],
      sql: [
        "A CASE expression is SQL's way of binning: CASE WHEN age < 25 THEN 'Under 25' WHEN age < 35 THEN '25-34' ... END.",
        "CASE checks top to bottom and stops at the first match, so each later branch only needs its upper limit.",
        "CREATE TABLE result AS SELECT CASE WHEN age < 25 THEN 'Under 25' WHEN age < 35 THEN '25-34' WHEN age < 50 THEN '35-49' WHEN age < 65 THEN '50-64' ELSE '65+' END AS age_band, COUNT(*) AS customers, ROUND(AVG(spend), 2) AS avg_spend FROM data GROUP BY age_band;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["age_band", "customers", "avg_spend"],
          rows: expected,
          tolerance: 0.006,
        },
      ],
    },
  });
}

// 5. SPLIT_TEST: a two-proportion A/B test ------------------------------------------------------
{
  const rows = [];
  let id = 1;
  const stats = { control: { n: 0, x: 0 }, test: { n: 0, x: 0 } };
  for (const [variant, rate, n] of [
    ["control", 0.112, 940],
    ["test", 0.134, 910],
  ])
    for (let i = 0; i < n; i += 1) {
      const converted = chance(rate) ? 1 : 0;
      stats[variant].n += 1;
      stats[variant].x += converted;
      rows.push({ user_id: 20000 + id++, variant, converted });
    }
  const p1 = stats.control.x / stats.control.n;
  const p2 = stats.test.x / stats.test.n;
  const pooled = (stats.control.x + stats.test.x) / (stats.control.n + stats.test.n);
  const z =
    (p2 - p1) /
    Math.sqrt(pooled * (1 - pooled) * (1 / stats.control.n + 1 / stats.test.n));
  const expected = [
    [round(p1, 3), round(p2, 3), round(((p2 - p1) / p1) * 100, 3), round(z, 3)],
  ];
  const path = W.writeCsv(
    "experiment.csv",
    ["user_id", "variant", "converted"],
    shuffle(rows),
    "converted is 1 or 0",
  );
  W.writeCase("w9-05-split-test", {
    tier: "mid-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["ab_testing"],
    strings: {
      title: "SPLIT_TEST",
      subtitle: "Skill: judging an experiment (A/B test)",
      briefing: `The product team ran an experiment: half the visitors saw the old page (variant 'control'), the other half a new page (variant 'test'). converted is 1 if the visitor bought, 0 if not.\n\nDid the new page really win, or is it noise? Compute, from the unrounded numbers:\n\n- control_rate: conversions divided by visitors in control\n- test_rate: the same for test\n- lift_pct: (test_rate - control_rate) / control_rate * 100\n- z_score: the two-proportion z statistic with a pooled rate:\n  pooled = total conversions / total visitors (both variants together)\n  z = (test_rate - control_rate) / sqrt(pooled * (1 - pooled) * (1/n_control + 1/n_test))\n\nRound all four numbers to 3 decimals at the very end. (As a rule of thumb, |z| above about 1.96 is significant at the 5% level.)\n\nGive ONE row with exactly these columns: control_rate, test_rate, lift_pct, z_score.\n\n${ANSWER_TAIL}`,
      task: "One row: control_rate, test_rate, lift_pct and the pooled two-proportion z_score, all rounded to 3 decimals.",
    },
    starterCode: {
      python:
        "# df has one row per visitor: user_id, variant ('control' or 'test'), converted (1 or 0).\n# Replace df with a one-row answer table (columns: control_rate, test_rate, lift_pct, z_score).\ndf.head()",
      sql: sqlStarter(
        "-- data has one row per visitor: user_id, variant ('control' or 'test'), converted (1 or 0).",
        "control_rate, test_rate, lift_pct, z_score",
      ),
    },
    columnHints: hint({
      user_id: [100, true],
      variant: [100, false],
      converted: [90, true],
      control_rate: [120, true],
      test_rate: [110, true],
      lift_pct: [100, true],
      z_score: [100, true],
    }),
    hints: {
      python: [
        "First get n and the number of conversions per variant: df.groupby('variant')['converted'].agg(['count', 'sum']).",
        "Pull the four numbers out (n1, x1, n2, x2), then use math.sqrt for the z formula. Round only at the end.",
        "import math; g = df.groupby('variant')['converted'].agg(['count','sum']); n1,x1 = g.loc['control']; n2,x2 = g.loc['test']; p1,p2 = x1/n1,x2/n2; p=(x1+x2)/(n1+n2); z=(p2-p1)/math.sqrt(p*(1-p)*(1/n1+1/n2)); df = pd.DataFrame([[round(p1,3), round(p2,3), round((p2-p1)/p1*100,3), round(z,3)]], columns=['control_rate','test_rate','lift_pct','z_score'])",
      ],
      sql: [
        "Build a CTE with n and conversions for each variant, then bring control and test onto ONE row (conditional aggregation, or a join of the two rows).",
        "SQLite has SQRT. Multiply by 1.0 so the division is not an integer division.",
        "CREATE TABLE result AS WITH g AS (SELECT SUM(variant = 'control') AS n1, SUM(CASE WHEN variant = 'control' THEN converted END) AS x1, SUM(variant = 'test') AS n2, SUM(CASE WHEN variant = 'test' THEN converted END) AS x2 FROM data), r AS (SELECT n1, n2, x1 * 1.0 / n1 AS p1, x2 * 1.0 / n2 AS p2, (x1 + x2) * 1.0 / (n1 + n2) AS p FROM g) SELECT ROUND(p1, 3) AS control_rate, ROUND(p2, 3) AS test_rate, ROUND((p2 - p1) / p1 * 100, 3) AS lift_pct, ROUND((p2 - p1) / SQRT(p * (1 - p) * (1.0 / n1 + 1.0 / n2)), 3) AS z_score FROM r;",
      ],
    },
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["control_rate", "test_rate", "lift_pct", "z_score"],
          rows: expected,
          tolerance: 0.002,
        },
      ],
    },
  });
}

// 6. THE_LABORATORY: a regression line per compound ---------------------------------------------
{
  const COMPOUNDS = [
    ["Ambrite", 4, 2.1, 1.6, 28],
    ["Borane", 9, -0.8, 2.4, 26],
    ["Corvin", 2, 3.6, 1.1, 30],
    ["Dryad", 6, 0.4, 3.0, 24],
    ["Ether-9", 5, 1.5, 1.0, 7],
  ];
  const rows = [];
  let id = 1;
  for (const [compound, a, b, sd, n] of COMPOUNDS)
    for (let i = 0; i < n; i += 1) {
      const dose = round(1 + random() * 9, 1);
      const response = chance(0.1) ? "" : round(a + b * dose + gauss() * sd, 2);
      rows.push({
        run_id: id++,
        compound,
        dose: dose.toFixed(1),
        response: response === "" ? "" : response.toFixed(2),
      });
    }
  const expected = [];
  for (const [compound] of COMPOUNDS) {
    const ok = rows.filter((r) => r.compound === compound && r.response !== "");
    if (ok.length < 8) continue;
    const x = ok.map((r) => Number(r.dose));
    const y = ok.map((r) => Number(r.response));
    const mx = mean(x);
    const my = mean(y);
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < x.length; i += 1) {
      sxy += (x[i] - mx) * (y[i] - my);
      sxx += (x[i] - mx) ** 2;
      syy += (y[i] - my) ** 2;
    }
    const slope = sxy / sxx;
    expected.push([
      compound,
      ok.length,
      round(slope, 3),
      round(my - slope * mx, 3),
      round(sxy / Math.sqrt(sxx * syy), 3),
    ]);
  }
  const path = W.writeCsv(
    "dose-response.csv",
    ["run_id", "compound", "dose", "response"],
    shuffle(rows),
    "some responses are missing",
  );
  W.writeCase("w9-06-the-laboratory", {
    tier: "final-boss",
    datasetPath: path,
    reshapes: true,
    datasetLicense: license,
    skills: ["regression"],
    strings: {
      title: "THE_LABORATORY",
      subtitle: "Problem: not disclosed. Read the data.",
      briefing: `A lab tests five compounds. Each run applies a dose and records a response; some runs failed and have no response. The scientists want to know how strongly each compound's response follows its dose: the straight line of best fit (least squares) and the correlation.\n\nFor each compound, using only the runs that HAVE a response:\n- n: how many runs\n- slope: the change in response per unit of dose\n- intercept: the response at dose 0\n- r: the Pearson correlation between dose and response\n\nA line fitted on very few points means nothing: leave out any compound with fewer than 8 usable runs.\n\nRound slope, intercept and r to 3 decimals. Give one row per remaining compound with exactly these columns: compound, n, slope, intercept, r.\n\n${ANSWER_TAIL}`,
    },
    starterCode: {
      python:
        "# df has dose-response runs: run_id, compound, dose, response (missing for failed runs).\n# Replace df with your answer table (columns: compound, n, slope, intercept, r).\ndf.head()",
      sql: sqlStarter(
        "-- data has dose-response runs: run_id, compound, dose, response (NULL for failed runs).",
        "compound, n, slope, intercept, r",
      ),
    },
    columnHints: hint({
      run_id: [90, true],
      compound: [110, false],
      dose: [80, true],
      response: [100, true],
      n: [60, true],
      slope: [100, true],
      intercept: [100, true],
      r: [90, true],
    }),
    winCondition: {
      all: [
        {
          predicate: "result_matches",
          columns: ["compound", "n", "slope", "intercept", "r"],
          rows: expected,
          tolerance: 0.002,
        },
      ],
    },
  });
}

W.finish();
