import type { SqlRefGroup } from "./sqlReference";

/**
 * The pandas toolbox: the everyday building blocks, grouped by what you are trying
 * to do, in the same shape as the SQL one (what is inserted, how it is written, what
 * it does, a tiny example). `df` is your table.
 */
export const PANDAS_REFERENCE: SqlRefGroup[] = [
  {
    id: "look",
    title: "Look at the data",
    items: [
      {
        name: "head",
        insert: "df.head(10)",
        syntax: "df.head(n)",
        detail: "The first n rows (tail(n) for the last).",
        example: "df.head(10)",
      },
      {
        name: "shape",
        insert: "df.shape",
        syntax: "df.shape",
        detail: "How big the table is: (rows, columns).",
        example: "df.shape -> (240, 6)",
      },
      {
        name: "dtypes",
        insert: "df.dtypes",
        syntax: "df.dtypes",
        detail:
          "The type pandas gave each column (int64, float64, object for text, datetime64...).",
        example: "df.dtypes",
      },
      {
        name: "describe",
        insert: "df.describe()",
        syntax: "df.describe()",
        detail: "Count, mean, spread and quartiles of the number columns.",
        example: "df['price'].describe()",
      },
      {
        name: "value_counts",
        insert: "df[''].value_counts()",
        syntax: "df['col'].value_counts()",
        detail: "How many times each value appears, most common first.",
        example: "df['status'].value_counts()",
      },
      {
        name: "nunique",
        insert: "df[''].nunique()",
        syntax: "df['col'].nunique()",
        detail: "How many different values a column has (unique() lists them).",
        example: "df['region'].nunique() -> 4",
      },
    ],
  },
  {
    id: "missing",
    title: "Missing values and repeats",
    items: [
      {
        name: "isna",
        insert: "df.isna().sum()",
        syntax: "df.isna().sum()",
        detail: "Count the missing values in every column.",
        example: "df['email'].isna().sum()",
      },
      {
        name: "fillna",
        insert: "df[''] = df[''].fillna(0)",
        syntax: "df['col'] = df['col'].fillna(value)",
        detail:
          "Fill gaps with a value, such as 0 or the column's mean (df['x'].mean()).",
        example: "df['t'] = df['t'].fillna(df['t'].mean())",
      },
      {
        name: "dropna",
        insert: "df = df.dropna(subset=[''])",
        syntax: "df = df.dropna(subset=['col'])",
        detail: "Drop the rows that are missing a value in those columns.",
        example: "df = df.dropna(subset=['email'])",
      },
      {
        name: "drop_duplicates",
        insert: "df = df.drop_duplicates()",
        syntax: "df = df.drop_duplicates(subset=['col'])",
        detail:
          "Keep the first of each repeated row (or each repeated key). Add .reset_index(drop=True) to renumber.",
        example: "df = df.drop_duplicates(subset=['id'])",
      },
      {
        name: "duplicated",
        insert: "df.duplicated().sum()",
        syntax: "df.duplicated(subset=['col'])",
        detail: "True for every row that repeats an earlier one.",
        example: "df[df.duplicated(subset=['id'])]",
      },
      {
        name: "where",
        insert: "df[''] = df[''].where(df[''] >= 0, 0)",
        syntax: "df['col'].where(test, other)",
        detail:
          "Keep values where the test is true, use the other value where it is false.",
        example: "df['qty'].where(df['qty'] >= 0, 0)",
      },
    ],
  },
  {
    id: "pick",
    title: "Pick and filter",
    items: [
      {
        name: "filter rows",
        insert: "df = df[df[''] == '']",
        syntax: "df = df[df['col'] == value]",
        detail:
          "Keep only the rows where a test is true. Combine tests with & and |, each in brackets.",
        example: "df[(df['qty'] > 2) & (df['status'] == 'paid')]",
      },
      {
        name: "isin",
        insert: "df[df[''].isin(['', ''])]",
        syntax: "df[df['col'].isin([a, b])]",
        detail: "Rows whose value is one of a list.",
        example: "df[df['region'].isin(['North', 'West'])]",
      },
      {
        name: "between",
        insert: "df[df[''].between(0, 100)]",
        syntax: "df['col'].between(low, high)",
        detail: "Values inside a range, ends included.",
        example: "df[df['age'].between(18, 65)]",
      },
      {
        name: "columns",
        insert: "df = df[['', '']]",
        syntax: "df = df[['a', 'b']]",
        detail: "Keep only some columns, in that order.",
        example: "df = df[['order_id', 'total']]",
      },
      {
        name: "sort_values",
        insert: "df = df.sort_values('', ascending=False)",
        syntax: "df.sort_values('col', ascending=False)",
        detail: "Sort the rows by a column (a list sorts by several).",
        example: "df.sort_values(['region', 'sales'], ascending=[True, False])",
      },
      {
        name: "query",
        insert: 'df = df.query("")',
        syntax: "df.query(\"qty > 2 and status == 'paid'\")",
        detail: "Filter with a text expression, like a short WHERE.",
        example: 'df.query("qty > 2")',
      },
    ],
  },
  {
    id: "text",
    title: "Text",
    items: [
      {
        name: "str.strip",
        insert: "df[''] = df[''].str.strip()",
        syntax: "df['col'].str.strip()",
        detail: "Remove spaces from both ends. Every text method lives under .str.",
        example: "df['name'].str.strip()",
      },
      {
        name: "str.lower",
        insert: "df[''] = df[''].str.lower()",
        syntax: "df['col'].str.lower()",
        detail:
          "All lower case. .str.upper() for capitals, .str.title() for Each Word Capitalised.",
        example: "df['city'].str.title()",
      },
      {
        name: "str.replace",
        insert: "df[''] = df[''].str.replace('', '', regex=False)",
        syntax: "df['col'].str.replace(old, new, regex=False)",
        detail: "Swap text. Use regex=True to match a pattern.",
        example: "df['phone'].str.replace(r'\\D', '', regex=True)",
      },
      {
        name: "str.extract",
        insert: "df[''] = df[''].str.extract(r'(\\d+)')[0]",
        syntax: "df['col'].str.extract(r'(pattern)')[0]",
        detail: "Pull out the part of the text that matches the (group) in a pattern.",
        example: "df['id'].str.extract(r'(\\d+)')[0]",
      },
      {
        name: "str.split",
        insert: "df[''] = df[''].str.split(',').str[0]",
        syntax: "df['col'].str.split(sep).str[n]",
        detail: "Cut text at a separator and take piece n (0 is the first).",
        example: "df['email'].str.split('@').str[1]",
      },
      {
        name: "str.contains",
        insert: "df[df[''].str.contains('', case=False, na=False)]",
        syntax: "df['col'].str.contains(text)",
        detail: "True where the text appears. na=False treats missing as no match.",
        example: "df[df['name'].str.contains('lee', case=False, na=False)]",
      },
      {
        name: "str.len",
        insert: "df[''].str.len()",
        syntax: "df['col'].str.len()",
        detail: "The length of each text. .str[:3] takes the first three characters.",
        example: "df['code'].str[:3]",
      },
    ],
  },
  {
    id: "numbers",
    title: "Numbers and types",
    items: [
      {
        name: "astype",
        insert: "df[''] = df[''].astype(int)",
        syntax: "df['col'].astype(int)",
        detail:
          "Change the type: int, float, str. Fails on text that is not a number, so clean it first.",
        example: "df['qty'].astype(int)",
      },
      {
        name: "pd.to_numeric",
        insert: "df[''] = pd.to_numeric(df[''], errors='coerce')",
        syntax: "pd.to_numeric(df['col'], errors='coerce')",
        detail:
          "Turn text into numbers, with anything unreadable becoming missing instead of an error.",
        example: "pd.to_numeric(df['price'], errors='coerce')",
      },
      {
        name: "round",
        insert: "df[''] = df[''].round(2)",
        syntax: "df['col'].round(places)",
        detail: "Round to some decimal places.",
        example: "df['total'].round(2)",
      },
      {
        name: "clip",
        insert: "df[''] = df[''].clip(lower=0, upper=100)",
        syntax: "df['col'].clip(lower, upper)",
        detail:
          "Squeeze values into a range: anything outside becomes the nearest limit.",
        example: "df['age'].clip(0, 120)",
      },
      {
        name: "replace",
        insert: "df[''] = df[''].replace({'': ''})",
        syntax: "df['col'].replace({old: new})",
        detail: "Swap values using a dictionary (replace many at once).",
        example: "df['gender'].replace({'M': 'male', 'F': 'female'})",
      },
      {
        name: "map",
        insert: "df[''] = df[''].map({'': ''})",
        syntax: "df['col'].map({old: new})",
        detail: "Look each value up in a dictionary; values not in it become missing.",
        example: "df['code'].map({1: 'low', 2: 'high'})",
      },
      {
        name: "assign",
        insert: "df = df.assign(total=df[''] * df[''])",
        syntax: "df = df.assign(new=expression)",
        detail: "Add a column calculated from others.",
        example: "df.assign(total=df['qty'] * df['price'])",
      },
    ],
  },
  {
    id: "dates",
    title: "Dates and time",
    items: [
      {
        name: "pd.to_datetime",
        insert: "df[''] = pd.to_datetime(df[''], errors='coerce')",
        syntax: "pd.to_datetime(df['col'], errors='coerce')",
        detail:
          "Read text as real dates; anything unreadable becomes NaT (missing). Add dayfirst=True or format='%d/%m/%Y' for other layouts.",
        example: "pd.to_datetime(df['day'], format='%d/%m/%Y')",
      },
      {
        name: "dt.year",
        insert: "df[''].dt.year",
        syntax: "df['col'].dt.year",
        detail:
          "Parts of a date: .dt.month, .dt.day, .dt.hour, .dt.dayofweek (Monday = 0), .dt.quarter.",
        example: "df['placed'].dt.month",
      },
      {
        name: "dt.strftime",
        insert: "df[''].dt.strftime('%Y-%m')",
        syntax: "df['col'].dt.strftime('%Y-%m')",
        detail:
          "Write dates as text in a layout (%Y year, %m month, %d day, %b short month, %H:%M time).",
        example: "df['placed'].dt.strftime('%b %Y')",
      },
      {
        name: "dt.to_period",
        insert: "df[''].dt.to_period('M')",
        syntax: "df['col'].dt.to_period('M')",
        detail:
          "The month (or 'D' day, 'Q' quarter, 'Y' year) a date falls in. Handy for grouping.",
        example: "df.groupby(df['placed'].dt.to_period('M'))['qty'].sum()",
      },
      {
        name: "date difference",
        insert: "(df[''] - df['']).dt.days",
        syntax: "(later - earlier).dt.days",
        detail: "Subtract two date columns, then read the gap in days.",
        example: "(df['shipped'] - df['placed']).dt.days",
      },
      {
        name: "pd.Timedelta",
        insert: "df[''] + pd.Timedelta(days=7)",
        syntax: "df['col'] + pd.Timedelta(days=7)",
        detail: "Move dates forward or back (days, hours, minutes...).",
        example: "df['placed'] + pd.Timedelta(days=30)",
      },
    ],
  },
  {
    id: "groups",
    title: "Groups and totals",
    items: [
      {
        name: "groupby",
        insert: "df.groupby('', as_index=False)[''].sum()",
        syntax: "df.groupby('col', as_index=False)['x'].sum()",
        detail:
          "One row per group, with a total of another column. as_index=False keeps the group as a normal column.",
        example: "df.groupby('region', as_index=False)['sales'].sum()",
      },
      {
        name: "agg",
        insert: "df.groupby('').agg(total=('', 'sum'), n=('', 'count')).reset_index()",
        syntax: "df.groupby('g').agg(name=('col', 'func')).reset_index()",
        detail: "Several named results at once: sum, mean, min, max, count, nunique.",
        example:
          "df.groupby('region').agg(total=('sales', 'sum'), n=('id', 'count')).reset_index()",
      },
      {
        name: "size",
        insert: "df.groupby('').size().reset_index(name='n')",
        syntax: "df.groupby('col').size()",
        detail: "How many rows each group has.",
        example: "df.groupby('status').size()",
      },
      {
        name: "rank",
        insert: "df[''] = df.groupby('')[''].rank(ascending=False, method='first')",
        syntax: "df.groupby('g')['x'].rank(ascending=False, method='first')",
        detail:
          "Number the rows inside each group (1 = biggest). method='first' breaks ties by order.",
        example: "df.groupby('category')['sales'].rank(ascending=False, method='first')",
      },
      {
        name: "transform",
        insert: "df[''] = df.groupby('')[''].transform('sum')",
        syntax: "df.groupby('g')['x'].transform('sum')",
        detail:
          "A group's total placed back on every row, so you can compare each row with its group.",
        example:
          "df['share'] = df['sales'] / df.groupby('region')['sales'].transform('sum')",
      },
      {
        name: "pivot_table",
        insert:
          "df.pivot_table(index='', columns='', values='', aggfunc='sum').reset_index()",
        syntax: "df.pivot_table(index, columns, values, aggfunc)",
        detail: "Long to wide: one row per index, one column per value of 'columns'.",
        example:
          "df.pivot_table(index='store', columns='month', values='revenue', aggfunc='sum')",
      },
    ],
  },
  {
    id: "windows",
    title: "Running totals and windows",
    items: [
      {
        name: "cumsum",
        insert: "df[''] = df.groupby('')[''].cumsum()",
        syntax: "df.groupby('g')['x'].cumsum()",
        detail: "A running total, restarting in each group.",
        example: "df.groupby('customer_id')['amount'].cumsum()",
      },
      {
        name: "rolling",
        insert: "df[''] = df[''].rolling(7, min_periods=1).mean()",
        syntax: "df['x'].rolling(window, min_periods=1).mean()",
        detail:
          "A moving average over the last n rows (sort by time first). min_periods=1 averages whatever exists at the start.",
        example: "df.sort_values('day')['sales'].rolling(7, min_periods=1).mean()",
      },
      {
        name: "shift",
        insert: "df[''] = df[''].shift(1)",
        syntax: "df['x'].shift(n)",
        detail:
          "The value from n rows earlier (negative for later). Use it to compare a row with its neighbour.",
        example: "df['sales'] - df['sales'].shift(1)",
      },
      {
        name: "diff",
        insert: "df[''] = df[''].diff()",
        syntax: "df['x'].diff()",
        detail: "The change from the previous row (works on dates too).",
        example: "df.groupby('user')['ts'].diff()",
      },
      {
        name: "pct_change",
        insert: "df[''] = df[''].pct_change()",
        syntax: "df['x'].pct_change()",
        detail: "The change from the previous row, as a fraction (0.1 is 10 percent).",
        example: "df['revenue'].pct_change()",
      },
    ],
  },
  {
    id: "join",
    title: "Join, stack and reshape",
    items: [
      {
        name: "merge",
        insert: "df = df.merge(, on='', how='left')",
        syntax: "df.merge(other, on='key', how='left')",
        detail:
          "Join two tables on a shared column. how='left' keeps every row of df; 'inner' keeps only matches.",
        example: "df.merge(customers, on='customer_id', how='left')",
      },
      {
        name: "merge (different names)",
        insert: "df = df.merge(, left_on='', right_on='', how='left')",
        syntax: "df.merge(other, left_on='a', right_on='b')",
        detail: "Join when the key has a different name in each table.",
        example: "df.merge(stores, left_on='store', right_on='store_id', how='left')",
      },
      {
        name: "concat",
        insert: "df = pd.concat([df, ], ignore_index=True)",
        syntax: "pd.concat([a, b], ignore_index=True)",
        detail: "Stack tables one under the other (axis=1 puts them side by side).",
        example: "pd.concat([df, more_rows], ignore_index=True)",
      },
      {
        name: "melt",
        insert: "df = df.melt(id_vars='', var_name='', value_name='')",
        syntax: "df.melt(id_vars, var_name, value_name)",
        detail: "Wide to long: columns become rows.",
        example: "df.melt(id_vars='product', var_name='month', value_name='sales')",
      },
      {
        name: "pivot",
        insert: "df = df.pivot(index='', columns='', values='').reset_index()",
        syntax: "df.pivot(index, columns, values)",
        detail:
          "Long to wide when each pair appears once (pivot_table also adds up repeats).",
        example:
          "df.pivot(index='store', columns='month', values='revenue').reset_index()",
      },
      {
        name: "rename",
        insert: "df = df.rename(columns={'': ''})",
        syntax: "df.rename(columns={old: new})",
        detail: "Give columns new names.",
        example: "df.rename(columns={'amt': 'amount'})",
      },
      {
        name: "drop",
        insert: "df = df.drop(columns=[''])",
        syntax: "df.drop(columns=['col'])",
        detail: "Remove columns you no longer need.",
        example: "df.drop(columns=['meta'])",
      },
      {
        name: "reset_index",
        insert: "df = df.reset_index(drop=True)",
        syntax: "df.reset_index(drop=True)",
        detail:
          "Renumber the rows 0, 1, 2... (needed after filtering or sorting if the numbers matter).",
        example: "df = df.sort_values('day').reset_index(drop=True)",
      },
      {
        name: "answer table",
        insert: "df = df[['', '']]",
        syntax: "df = <your answer table>",
        detail:
          "In Python the answer is df itself: finish with df holding exactly the table the question asks for, with the right column names.",
        example: "df = df.groupby('region', as_index=False)['revenue'].sum()",
      },
    ],
  },
  {
    id: "subsets",
    title: "Compare, rank and walk",
    items: [
      {
        name: "transform",
        insert: "df['avg'] = df.groupby('dept')['salary'].transform('mean')",
        syntax: "df.groupby(g)[c].transform('mean')",
        detail:
          "Puts a group's statistic on every row of that group (the pandas version of a window function or a CTE joined back).",
        example: "df[df['salary'] > df['avg']]",
      },
      {
        name: "isin / ~isin",
        insert: "df[~df['id'].isin(other['id'])]",
        syntax: "df[~df['id'].isin(values)]",
        detail:
          "Keeps rows whose value is (or, with ~, is not) in another column. This is the pandas anti-join.",
        example: "customers[~customers['id'].isin(orders['customer_id'])]",
      },
      {
        name: "set difference",
        insert: "a = set(df['email']); b = set(other['email']); only_a = a - b",
        syntax: "a - b, a & b, a | b",
        detail:
          "Python sets compare lists fast: - only in the first, & in both, | in either.",
        example: "sorted(a - b)",
      },
      {
        name: "merge indicator",
        insert: "df.merge(other, on='id', how='left', indicator=True)",
        syntax: "df.merge(..., how='left', indicator=True)",
        detail:
          "Adds a _merge column saying whether each row matched, so rows with no match are easy to find.",
        example: "m[m['_merge'] == 'left_only']",
      },
      {
        name: "walk a hierarchy",
        insert:
          "while len(cur):\n    cur = cur.merge(df, left_on='child', right_on='parent')",
        syntax: "loop of merges",
        detail:
          "pandas has no recursion: repeat a merge level by level until nothing new comes back, collecting each level.",
        example: "cur = df[df['parent'] == 'root']",
      },
      {
        name: "consecutive runs",
        insert:
          "grp = d['d'] - pd.to_timedelta(d.groupby('user_id').cumcount(), unit='D')",
        syntax: "date - running count = run id",
        detail:
          "Days in an unbroken streak share the same value once you subtract their position. Group by it to get streaks.",
        example: "d.groupby(['user_id', grp]).size()",
      },
      {
        name: "cummax",
        insert:
          "df['prev_end'] = df.groupby('room')['end'].transform(lambda x: x.cummax().shift())",
        syntax: "x.cummax().shift()",
        detail:
          "The largest value seen so far before each row. Used to merge overlapping time blocks.",
        example: "df['start'] > df['prev_end']",
      },
      {
        name: "cumcount",
        insert: "df.groupby('g').cumcount()",
        syntax: "df.groupby(g).cumcount()",
        detail: "Numbers the rows inside each group 0, 1, 2... (the pandas ROW_NUMBER).",
        example: "df['n'] = df.groupby('user_id').cumcount()",
      },
    ],
  },
  {
    id: "time2",
    title: "Time zones, calendars and timelines",
    items: [
      {
        name: "to_datetime (mixed)",
        insert: "pd.to_datetime(df['raw'], format='mixed')",
        syntax: "pd.to_datetime(col, format='mixed')",
        detail:
          "Reads dates written in several different ways. Add .dt.strftime('%Y-%m-%d') for clean text.",
        example: "pd.to_datetime(s, format='mixed').dt.strftime('%Y-%m-%d')",
      },
      {
        name: "to_timedelta",
        insert: "pd.to_datetime(df['ts']) + pd.to_timedelta(df['minutes'], unit='m')",
        syntax: "ts + pd.to_timedelta(n, unit='m')",
        detail:
          "Adds a length of time to dates: shifts UTC to local time, or builds deadlines.",
        example: "pd.to_timedelta(540, unit='m')",
      },
      {
        name: "date_range",
        insert: "pd.date_range(start, end)",
        syntax: "pd.date_range(first, last, freq='D')",
        detail: "A complete list of dates: the pandas date spine.",
        example: "s.reindex(pd.date_range(s.index.min(), s.index.max()), fill_value=0)",
      },
      {
        name: "reindex",
        insert: "s.reindex(new_index, fill_value=0)",
        syntax: "s.reindex(index, fill_value=0)",
        detail:
          "Forces a series onto a full index. New rows are filled with the value you give.",
        example: "s.reindex(pd.date_range(a, b), fill_value=0)",
      },
      {
        name: "resample",
        insert: "df.set_index('ts').resample('D')['x'].sum()",
        syntax: "df.set_index(date).resample('D')[c].sum()",
        detail:
          "Groups a time series into days ('D'), weeks ('W') or months ('MS'), including empty periods.",
        example: "df.set_index('ts').resample('W')['sales'].sum()",
      },
      {
        name: "merge_asof",
        insert:
          "pd.merge_asof(left.sort_values('ordered'), right.sort_values('effective'), left_on='ordered', right_on='effective', by='product')",
        syntax: "pd.merge_asof(left, right, left_on, right_on, by)",
        detail:
          "Matches each row to the latest earlier row of another table: the price that was in force on the day. Both tables must be sorted by their date.",
        example:
          "pd.merge_asof(o, p, left_on='ordered', right_on='effective_date', by='product')",
      },
      {
        name: "busday_count",
        insert: "import numpy as np\nnp.busday_count(start, end)",
        syntax: "np.busday_count(begin, end)",
        detail:
          "Counts weekdays from begin up to but not including end. Dates must be datetime64[D].",
        example: "np.busday_count('2026-03-02', '2026-03-09') -> 5",
      },
      {
        name: "dt.dayofweek",
        insert: "df['ts'].dt.dayofweek",
        syntax: "df['ts'].dt.dayofweek",
        detail: "Day of the week: Monday is 0 and Sunday is 6. >= 5 means weekend.",
        example: "df[df['ts'].dt.dayofweek < 5]",
      },
      {
        name: "tz_convert",
        insert: "pd.to_datetime(df['ts'], utc=True).dt.tz_convert('Asia/Tokyo')",
        syntax: "s.dt.tz_convert('Zone/Name')",
        detail:
          "Converts timestamps from UTC to a real time zone, handling daylight saving for you.",
        example: "pd.to_datetime(s, utc=True).dt.tz_convert('America/New_York')",
      },
    ],
  },
  {
    id: "stats",
    title: "Statistics, bands and filling",
    items: [
      {
        name: "std / var",
        insert: "df.groupby('g')['x'].agg(['mean', 'std'])",
        syntax: "col.std(), col.var()",
        detail:
          "Spread of a column. pandas divides by n - 1 (sample), the same as SQL STDDEV.",
        example: "df.groupby('lab')['value'].std()",
      },
      {
        name: "median",
        insert: "df['x'].median()",
        syntax: "col.median()",
        detail: "The middle value, ignoring missing. Robust to outliers.",
        example: "df.groupby('ward')['bp'].transform('median')",
      },
      {
        name: "quantile",
        insert: "df['x'].quantile([0.25, 0.5, 0.75])",
        syntax: "col.quantile(q)",
        detail:
          "The value below which a share q of rows fall. quantile(0.75) - quantile(0.25) is the IQR.",
        example: "df['x'].quantile(0.9)",
      },
      {
        name: "z-score",
        insert: "(df['x'] - df['x'].mean()) / df['x'].std()",
        syntax: "(x - mean) / std",
        detail:
          "How many standard deviations a value is from average. Beyond +/-3 is the classic outlier rule. Use groupby().transform for per-group values.",
        example:
          "g = df.groupby('s')['v']; (df['v'] - g.transform('mean')) / g.transform('std')",
      },
      {
        name: "corr / cov",
        insert: "df['x'].corr(df['y'])",
        syntax: "a.corr(b), a.cov(b)",
        detail:
          "Pearson correlation and covariance of two columns. Pairs with missing values are skipped.",
        example: "slope = x.cov(y) / x.var()",
      },
      {
        name: "fillna",
        insert: "df['x'] = df['x'].fillna(df['x'].median())",
        syntax: "col.fillna(value_or_series)",
        detail:
          "Fills missing cells with a number, or with a per-row Series such as a group median.",
        example: "df['bp'].fillna(df.groupby('ward')['bp'].transform('median'))",
      },
      {
        name: "pd.cut",
        insert:
          "pd.cut(df['age'], bins=[0, 25, 35, 65, 200], right=False, labels=['a','b','c','d'])",
        syntax: "pd.cut(col, bins, right=False, labels=[...])",
        detail:
          "Turns numbers into labelled bands. right=False makes each band start at its lower edge.",
        example: "pd.cut(df['age'], [0, 25, 35, 200], right=False)",
      },
      {
        name: "pd.qcut",
        insert: "pd.qcut(df['x'].rank(method='first'), 4, labels=False) + 1",
        syntax: "pd.qcut(col, q)",
        detail:
          "Splits into bands with equal numbers of rows (quartiles for 4). Ranking first avoids errors from ties.",
        example: "pd.qcut(df['spend'].rank(method='first'), 4, labels=False) + 1",
      },
      {
        name: "math.sqrt",
        insert: "import math\nmath.sqrt()",
        syntax: "math.sqrt(x)",
        detail:
          "Square root of a single number, for formulas like the A/B test z statistic.",
        example: "z = (p2 - p1) / math.sqrt(p * (1 - p) * (1/n1 + 1/n2))",
      },
      {
        name: "polyfit",
        insert: "import numpy as np\nnp.polyfit(x, y, 1)",
        syntax: "np.polyfit(x, y, 1) -> [slope, intercept]",
        detail: "The least-squares straight line through the points.",
        example: "slope, intercept = np.polyfit(df['dose'], df['response'], 1)",
      },
    ],
  },
];
