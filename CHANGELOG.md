# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## 1.0.0 (2026-10-05)

- **A dock on phones.** Below 720px the Run bar stays pinned to the bottom of the screen, with **Edit** and **Result** beside a large **Run**. Wherever the page is scrolled, Run, "jump to the table" and "back to typing" are one tap away, so you never scroll to find the editor again; **Edit** goes straight back to typing (keyboard view), and **Done** leaves the editor where you were looking. Tablet and desktop are unchanged.

- **Typing on a phone, like a chat app.** Tapping into the editor (below 720px) lifts it above the keyboard: the page reduces to a one-line task (tap to read it), a **Done** button, the editor with its tools and column chips, and **Run**, sized to the part of the screen the keyboard leaves visible (it follows the keyboard as it opens, closes or changes height). Tool buttons and chips do not trigger it, so a tap on them is never lost to a layout jump. **Done** or **Run** puts the keyboard away and brings the full page back, with the result scrolled into view. Tablet and desktop are unchanged.

- **Phone editor, tidier.** Below 720px the editor's Help, Format, Reset and Clear buttons are small icon buttons (`?`, `{}`, undo, bin) that keep their names for screen readers. SQL and Python help open as a bottom sheet with a large search box; its topics show two to a line plus **More**, which opens a two-column topics modal. Tips uses the same topic chips. Desktop and tablet are unchanged (words on the buttons, help as a pop-over).

- **Made for phones.** Below 720px the row of small option buttons (text size, theme, CRT, sound, animation, Tips, contrast) is one menu button that opens a drawer sliding in from the right, with large touch rows, switches, a volume slider and the Tips link; it is on every screen, closes with Escape or a tap outside, keeps focus inside while open, and passes the accessibility scan in both themes. The old pop-up menus no longer run off the screen. On a touch screen the intro says "[ TAP ] touch anywhere to engage" and a tap anywhere starts the fight (there is no Enter key on a phone); desktop keeps "[ ENTER ]" (and a click works there too).

- **Rank panel fixed.** Geminora could show "7 / 6 techniques" with a progress bar running outside its box, and Minos Deep's top rank could never be reached. The rank tables now match what each world really teaches (Geminora 8, Minos Deep 5), the total can never be smaller than what is on record, the bar is clamped inside its box, and a test reads the real case files so the tables cannot drift again.

- **Cleaner victory panel.** The "Copy my solution" button is gone from the win summary in every world; it now offers just "Back to roster" and "Keep exploring".

- **A living welcome.** The green "What is this?" button under the title is replaced by a greeting that types itself in orange: "Welcome <Master>", then Savior, Slayer, Query Knight, NULL Hunter, Leviathan Slayer and about forty more, looping forever. It never stops (its position comes from the clock on every frame, so a busy moment cannot leave it stuck or behind), screen readers get one fixed sentence, and people who ask for reduced motion get a still greeting. "What is this?" remains in the top bar (with the "Start here" badge until it is first opened).

- **Ready to deploy.** Share links get an absolute address from `SITE_URL` or Vercel's production domain (canonical, `og:url`, `og:image`, Twitter card with image size and description), hashed assets are cached for a year and the service worker is never cached, there is a `robots.txt` and a no-JavaScript message, and [`docs/DEPLOYING.md`](./docs/DEPLOYING.md) has the steps and a pre-launch checklist.

- **A logo and a brand.** The mark is a porthole, a dorsal fin and the waterline: the leviathan under the surface, seen from a ship. It is in the home and world headers, the tab icon, the install icons (including a maskable one) and the share image. The home screen now has its own black-and-orange theme (dark and light, contrast-checked) so the whole brand agrees; the nine worlds keep their own colours.
- **CI fixed.** The home page's JavaScript had grown past the 400 KB Lighthouse budget when the rocket flight (and the animation library) joined it; the flight is now loaded only when it is about to play, and warmed up when you hover a world. Dependabot no longer proposes the zod 4 major upgrade (it breaks the save-file schema) and groups minor and patch updates; the dependency-review job no longer blocks merging while the repository's Dependency graph is off; end-to-end tests retry twice on CI.

- **Renamed to Queryathan** (query + leviathan). The project grew past data cleaning into analysis, time, statistics and recursion, so it has a name that covers all of it. The app, README, docs, share images and package metadata use the new name. World ids and saved progress (`dcq.*` in the browser) are unchanged, so nobody loses progress. The repository moves to `Yuvakunaal/queryathan`.

- **Launch polish.** The app can be installed (web app manifest and icons), has proper social-sharing tags, and the home page has a footer linking to the repository, and the contributing guide. New repo files: SUPPORT, CITATION, CODEOWNERS, release-note categories, label set, a feature-request form, CodeQL and dependency-review workflows, and a list of good first issues.

- **Final audit.** Every complete SQL hint is now run in the browser and must win its case (27 cases). The new world descriptions match their cases (no promise of year-over-year or normalising that was not there), "1 rows" now reads "1 row", the answer note says what the answer needs instead of "the chart has", the data-layout buttons meet the 24px target size, and the new rosters, the ANIM menu, the flight card and a Laboratory fight are scanned for accessibility in both themes.

- **Every world is now a place you travel to.** The nine worlds have their own names: **Ember Reach** (data cleaning), **Cryptara** (patterns and encodings), **Geminora** (joins), **Atlas Spire** (reshaping), **Cinderforge** (speed), **Lumenfield** (analysis), **Minos Deep** (CTEs and recursion), **Chronopolis** (dates and time) and **Helix-9** (statistics). Each has a planet drawn in its own colours, shown on its card and on its page. World ids, saved progress and links are unchanged.
- **Rocket flight, with a real landing.** Choosing a world launches a rocket: lift-off, a starfield that stretches into warp, the planet growing out of the dark, then a descent through a glowing atmosphere with a hot engine burn, landing legs, a touchdown settle and a roll of dust. It looks the same on the light theme (space stays dark) and leaves through the planet's own light so a white page never meets a dark one. Click, Enter, Space, Escape or the Skip button ends it (and fades its sound). The landing is scored like a film: legs knocking down, the engine winding to nothing, then a low open chord and a sub-bass swell on a dark reverb, with no bright notification tones. It follows the SFX switch and volume.
- **ANIM menu.** A new **ANIM** button in the top bar (next to SFX) opens a small menu with two switches: **Rocket flight** and **Killing animation**. Each is remembered. Turning the killing animation off goes straight from the winning run to the summary, with the win sound; the flight starts off for people whose system asks for reduced motion.

- **Three new worlds, 18 new cases (45 in all).** Every case is winnable in both SQL and Python and judged by the exact answer table.
  - **The Labyrinth** (CTEs and recursion): a first CTE, anti-joins with the `NOT IN` NULL trap, a recursive org chart, set operations on messy emails, gaps-and-islands streaks and a recursive bill of materials.
  - **The Timekeeper** (dates and time): three date spellings in one column, business days, UTC to local time, a date spine for missing days, an as-of join for the price in force, and merging overlapping bookings.
  - **The Laboratory** (statistics): standard deviation per group, z-score outliers, median imputation, age bands, an A/B test z statistic, and a regression line per compound.
- **SQL statistics functions.** `STDDEV`, `STDDEV_SAMP`, `STDDEV_POP`, `VARIANCE`, `VAR_SAMP`, `VAR_POP`, `CORR`, `COVAR_POP` and `COVAR_SAMP` now work in the SQL engine (`MEDIAN` and `PERCENTILE` already did).
- **Tips book.** New SQL groups (CTEs, subqueries and sets; Statistics, bands and lookups) and new pandas groups (Compare, rank and walk; Time zones, calendars and timelines; Statistics, bands and filling).

- **Big titles no longer touch.** On the home page, the world pages and the sandbox page the title's two
  lines were set so tight that the tail of the y in "your" ran into the l in "clean". The line spacing is
  now roomier, and a test fails if a big title is set tighter than that.

- **"Data (original)".** The first tab is now called **Data (original)** in every world, with
  matching wording on the buttons and notes. In Python answer cases it shows the table you started
  with, untouched, and **Your answer (df)** shows what df holds after your code runs, the same as
  SQL's **Your answer (result)**; the separate "df (original)" tab is gone.
- **Every table resizable on its own, both ways.** With four tables the room can be divided only one
  way at a time (four rectangles filling a rectangle always share one line in one direction), so the
  bar above the tables now has **Resize by row** (each row has its own vertical line) and **Resize by
  column** (each column has its own horizontal line, with one vertical line between the columns).
  The choice is remembered, and each line is saved separately per case.

- **Python help.** The editor toolbar has a **Python help** panel for pandas (look at the data,
  missing values, pick and filter, text, numbers and types, dates, groups, running totals and
  windows, join and reshape), the same click-to-insert panel as SQL help, with search.
- **Type on hover.** Hover a column name in any table (or focus a column chip above the editor)
  and a small tooltip shows just that column's type, kept short: whole numbers as TINYINT, SMALLINT,
  MEDIUMINT, INT or BIGINT, decimals as NUMBER(digits, decimals) with exactly the precision the values
  need (DOUBLE beyond 6 decimals), DATE, TIME or DATETIME, BOOLEAN, and plain VARCHAR with no length
  (TEXT when very long). The rules are in `src/lib/mysqlType.ts` and covered by tests.
- **A clear note about the answer.** Cases whose SQL answer is a table now show a highlighted note under
  the task: _create a table named result_, with the `CREATE TABLE result AS SELECT ...` shape to copy,
  and that the table named result is what gets judged. In Python the note says the answer goes in `df`.
  Cleaning cases, where you simply edit the table, have no note.
- **Tips (the book button).** The button in every top bar is now a book. It opens **Tips**: the SQL
  and Python references together, with search and topics. Inside a fight, clicking an entry for the
  language you are writing puts it in the editor; elsewhere it is a reading list. (An earlier
  keyboard shortcuts sheet was removed in favour of this.)
- **Polish found by an audit.** The dialogs and the tooltip had been drawn without the app's fonts and
  colours because a design token was never defined (a new test now fails if any style uses an
  undefined token); the help panels are drawn above everything so no neighbouring panel clips them,
  open towards the side with room, and stay inside the window; the editor toolbar wraps instead of
  squeezing its buttons; and the largest text size is checked at every window width.

- **Resizable tables in the collage.** The lines between tables are now drag handles, like the
  one between the left and right panels: drag to give a table more room and its neighbour less,
  with the arrow keys for small steps, Home/End for the limits and double-click or Enter to centre.
  Two tables share one horizontal line, three have a vertical line above and a horizontal one, four
  have a vertical line in each row, so the two rows are sized independently. Sizes are remembered per case; no table
  can be pushed out of sight.
- **A calmer join checklist.** The checks above the tables show a tick (or an open circle) and the
  rule; the extra "yes" after every met check is gone, and a rule that is not met shows what is wrong
  in brackets.

- **Wide tables end cleanly.** When a table is wider than its panel and you scroll sideways, the header
  and the row stripes now run to the last column instead of stopping at the panel's edge and leaving a
  bare strip (a test scrolls a wide table to the end and checks the header and rows reach it).

- **Your data stays your data.** In SQL, building a table named `result` no longer replaces what
  "Your data" shows. The answer gets its own tab, **Your answer (result)**, and "Your data" keeps
  your `data` table exactly as your code left it, with a note saying where the answer is. The tab
  that shows what your code returned is now called **Output**. In Python, where `df` becomes the
  answer, a **df (original)** tab keeps the table you started with in view.
- Every case that needs `CREATE TABLE` now says so, with the table name: _create a NEW table named
  result_, in the briefing and in the starter code. If you build a table under another name, the
  Output tab tells you that the judged table is named `result` and how to write it.
- **Back and Forward work.** Each screen has its own address (`#/world/the-vault`,
  `#/fight/...`), so the browser's buttons move between screens, a screen can be bookmarked, and the
  tab title says where you are.
- **Your code is kept.** What you type for a case is saved on the device (per case and engine), so a
  reload, Back, or a slip never loses work. Reset puts the starting code back.
- A plain "Something went wrong" page with a Reload button replaces a blank screen if anything ever
  crashes while drawing; storage that is blocked or full no longer crashes the app.

- **Fixed: the SFX menu (and any menu dropping out of the top bar) opened behind the fight.** The
  top bar now sits above the stage, and a test opens the menu in every world and checks nothing is
  drawn over it. SQL help is checked the same way.
- **A fuller finishing cut.** The knife recording now sits under a rising air swish, a bright crack,
  a juicy burst, a low thud and two small drops, in the spirit of a fruit-slicing game. The win
  sound is a smooth, settled ending (a warm D major pad, soft felt-piano notes climbing to a ringing
  top note, a gentle low note and a long quiet room) instead of beeps. A limiter on
  the output keeps the layers from ever clipping.
- **Layout fixes found by a width check** (desktop, laptop, tablet, phone): the home top bar and the
  editor toolbar no longer run off the edge on a phone. A new test fails if any screen scrolls
  sideways or pushes a control out of view at those widths.

- **Collage view for joins.** A case with several tables shows them together under "Your
  data": two stack one above the other, three put two on top and one below, four make a 2 by 2. Drag a table's grip onto another to swap places (or use the arrow keys); "One at a time"
  brings back tabs. The choice and the order are remembered per device.
- **Two new joins in The Twins:** THREE_WAY (three tables) and FOUR_CORNERS (four tables,
  with a discount to apply), both judged by exact values.
- **The sandbox takes up to four tables** (your own files), each
  with a name you choose, shown in the same collage.
- **SQL toolbox.** Dozens of everyday MySQL/PostgreSQL/Snowflake functions now work in the SQL
  engine (YEAR, MONTH, DATE_TRUNC, DATE_ADD, DATEDIFF, TIMESTAMPDIFF, EXTRACT, DATE_FORMAT,
  TO_CHAR, TO_DATE, LEFT, RIGHT, LPAD, SPLIT_PART, INITCAP, NVL, GREATEST, MOD and more), with
  the usual spellings (`EXTRACT(month FROM d)`, `DATEDIFF(day, a, b)`, `DATE_ADD(d, INTERVAL 7
DAY)`, `ILIKE`). A "SQL help" panel groups them by task, and function names autocomplete.
- **Sound menu:** effects, typing and volume are separate controls. The finishing cut has a real
  knife sound, and its scene is now the opposite of the theme (light on dark, dark on light).
- **One opening for both engines:** the intro starts as soon as an engine is chosen and waits on
  its "mounting engine" line, instead of a separate loading screen for Python.

- Running the whole editor now always starts from the original table, so running the
  same code twice gives the same answer in every world (no "column already exists", no
  melting or joining an already reshaped table). Running a selection still works on the
  table as it is now. The run bar says which of the two will happen.
- `CREATE TABLE result` can be run again and again, and `CREATE OR REPLACE TABLE result`
  works.
- Typing in the SQL and Python editors plays the same real keyboard recordings (space and enter deeper, shortcuts and arrows silent).
- Boot sequence typing now plays real keyboard recordings (a CC0 pack recorded on a
  Cherry keyboard; credits in `apps/web/public/sounds/LICENSES.md`), a different one each
  time at a typing pace, instead of synthesized beeps; the boot readout counts checks, not cells, for joins,
  reshapes, speed jobs and answers.

- **World 6, The Observatory**: six analysis questions (grouping and summing, ranking
  inside groups, 7-day moving average, cohort retention, sessionizing a click log,
  an ordered purchase funnel), each solvable in pandas and SQL.
- New `result_matches` predicate: judges an answer table by column name, with exact
  row matching, numeric tolerance and optional order. Its checks report what is wrong
  (missing column, row count, rows right) without revealing the answer, and the HUD
  shows a count of correct rows.
- Cases can list `skills`, which rank uses instead of predicate kinds.
- Expected answers are computed by `scripts/generate-observatory.mjs` from the
  briefing's definitions and verified by real SQL and real pandas in the E2E suite.

- The SQL formatter loads on first use; the fight-screen chunk shrank from 954 kB to 661 kB.
- Sound cues (run, cleared, error, win), synthesized in the browser and off until switched on with SFX.
- "Copy my solution" on the victory panel.
- About dialog and card dialog no longer expose a second banner landmark.

## [Unreleased]

### Added (Phase 7: engineering hardening)

- End-to-end suite (`pnpm e2e`, Playwright, `apps/web/e2e/`) that runs against the production build served with the exact headers from `vercel.json` (`scripts/serve-dist.mjs`), using the real engines. Every test fails on an uncaught error or a CSP violation. It plays all 19 cases in both languages from one table of known-good answers, checks that unchanged and near-miss answers never win, and covers the editor (selection run, format, completion, errors, results), tab and panel behaviour, the 20-second recovery, the sandbox (intake, cleaning, download), themes, and the About dialog.
- Accessibility checks: axe-core scans of every kind of screen in both themes and high contrast, plus a token-level audit (`contrast.e2e.ts`) that checks every text, accent and status color against its surfaces for every world and theme (dark, light, both high-contrast modes) against WCAG AA.
- CI: a separate end-to-end job (with report upload on failure) and a Lighthouse job enforcing budgets from `lighthouserc.json` (performance, accessibility, best practices, blocking time, layout shift, script size).
- Offline support: a service worker (production only) caches the app's hashed assets, the Python runtime and pandas wheels, and seed datasets, so the app keeps working offline after a first visit; pages and case files are network-first so deploys take effect at once.

### Fixed (found by the new accessibility checks)

- Light theme: about 40 colors (dim text, accents, status colors, the green and amber used as text and button fills) were 3.5 to 4.4 to 1 against a 4.5 requirement; dark theme: the dim grey text token was 3.4 to 4.2 to 1 in every world. All now pass.
- Locked world and boss cards faded their text with `opacity`, which made it unreadable; they now use a dashed border and a readable dimmer text color.
- The About dialog's scrolling body could not be reached from the keyboard; it is now focusable.
- The code editor had no accessible name; it is now "SQL editor" / "Python editor".
- Code comments on the highlighted line in the light theme were below contrast.

### Documentation

- `SECURITY.md` described a sandbox-mode iframe that was never built; it now describes what is true (the worker boundary, files used only as data, the 20-second recovery, the offline cache, and how the CSP is tested).

### Changed (engine start-up)

- Python no longer shows a bare, off-centre text screen for a couple of seconds after you pick it. A centred loading card explains the wait (Python and pandas load in your browser) with a moving bar.
- The wait itself is shorter: pointing at or focusing an engine on the choice screen starts it straight away, and the last engine you used starts as soon as the screen opens. Importing pandas (over a second) now happens during start-up instead of when the table loads. Measured in dev: a returning player waits about 0.3 s instead of about 3.9 s; a first-time player who hovers for 1.5 s waits about 2.3 s. SQL is unchanged (about 50 ms).
- Engine workers are kept in a small pool and shut down when the screen closes, so a warmed-up engine survives React re-running effects.

### Added (Phase 6: World 5, The Foundry)

- Two timed jobs, solved in Python and SQL on the real engines: SLOW_LANE (replace a row-by-row `apply` / per-row lookup with whole-column arithmetic) and RUNNING_LAPS (replace a loop / quadratic subquery with a grouped cumulative sum / window function).
- Run timing: both engines report how long the player's code took, measured around the code only. New `runtime_under` rule judges the last run against a per-engine budget.
- The Forge HUD: a log-scale gauge with the pass mark, silver and gold cut-offs, the reference solution and the last run's needle; bronze / silver / gold quality stamps shown on the victory panel, kept per case (best wins) in the save file, and badged on the roster.
- Generated datasets: stress-test tables are built in the browser from closed-form column recipes (identical in numpy and JavaScript), so no large files are shipped.
- Runaway code recovery: a run past 20 seconds now restarts the engine on the original table and explains what happened, instead of leaving every later run to time out.
- Victory panel says "Checks passed" instead of "Cells cleaned" for cases with no cell-level rules.

### Added (victory moment and first-visit explainer)

- Kill sequence before the "Boss cleared" panel: the boss's sigil appears with a health bar, a blade strikes along a diagonal, the sigil splits along the cut and bursts into data fragments, the bar empties, the name is struck through and the outcome is stamped. About 2.8 seconds, built from SVG and GSAP in the world's own colors. Click, Enter, Space, Escape or the Skip button jumps to the summary; with reduced motion on, it is a short fade of the same message. Not shown in the sandbox (nothing to win).
- "What is this?" on the home page (a button under the intro, a link in the top bar, and a "Start here" badge until it is first opened): a plain-language dialog covering what the site is, why data gets cleaned, how a round works, what happens on a win, what the monster theme means, the worlds, and good-to-know items. Focus is trapped while open and returns to the button on close.
- Plain-language subtitles for all 21 cases (`Problem: ...` / `Skill: ...`) replace the codenames.

### Added (Phase 6: Sandbox)

- Sandbox mode, from a card on the world select screen: load your own CSV (file picker, drag and drop, pasted text, or a built-in sample) and explore or clean it with pandas or SQL in the same editor. Ungraded; the file is never uploaded (the CSV text goes straight to the in-browser engine).
- CSV intake: semicolon- and tab-separated files are converted, blank and duplicate column names are renamed, ragged rows are padded or trimmed, a byte-order mark is stripped; limits of 5 MB, 50,000 rows and 200 columns, each with a plain-language message. Every change is listed to the player.
- A live profile band (rows, columns, each column's type and number of empty cells), clickable "good first questions" for the chosen language, and a Download CSV button for the cleaned table.

### Fixed (engine)

- Python no longer carries a hidden row-id column inside `df`. That column made every row unique, so a plain `df.drop_duplicates()` removed nothing, and it leaked into `df.columns`, `df.shape`, `df.to_csv()` and `df.isna().sum()`. Row identity for the diff view is now tracked outside the DataFrame (same labels, then label match, then content match). See docs/adr/0006-row-identity-diffing.md.

### Fixed

- Returning to "Your data" after viewing Result or Changes no longer skips the first rows. Inactive tabs were hidden with display:none, which reset the table's scroll position while its virtual row list kept the old offset. They are now hidden with visibility, so each tab keeps its scroll position and rows.

### Fixed (panel widths and large text)

- The "023 cells / 240 rows" readout no longer gets pushed off the edge at middle panel widths: the progress strip now shrinks instead of forcing a minimum width, and the HUD stacks below 860px of panel width. Swept 4 worlds x 2 text sizes x 4 divider positions with no overflow.
- At the largest text size the boss diagram scales with the text, so the title no longer overlaps it.
- The back button is now a bordered "< Roster" button followed by a divider line, clearly separate from the world and boss name; the top bar grows with the text size instead of clipping.

### Fixed / Added (narrow data panel, light high contrast)

- Dragging the divider right no longer pushes the table past the screen edge. The data panel is now a bounded box: the table scrolls sideways inside it at any width, tabs scroll instead of wrapping, and the panel's header (progress strip, checklists, blueprint chips) re-flows according to the panel's own width (CSS container query) rather than the window's.
- High contrast now works on the light theme: pure white surfaces, black text and black rules with dark saturated accents, instead of switching to the dark palette.

### Added (worksheet-style editor, light theme, resizable panels)

- Run behaves like a SQL worksheet (MySQL Workbench, Snowflake): if text is highlighted, only that runs ("Run selection"); with nothing highlighted, everything in the editor runs. Applies to Python too (a selected indented block is dedented first). The last statement's result is shown.
- SQL Format button and Shift+Alt+F (sql-formatter, SQLite dialect, upper-case keywords). SQL results show NULL for empty values.
- Light theme for the whole site: every world has its own light palette; toggle in the top bar (follows the system setting until chosen, then remembered). High contrast always uses the dark high-contrast set. The CodeMirror editor, GSAP flashes and HP-strip animation read the active theme instead of fixed dark colors.
- Draggable dividers: between the left panel and the data, and between the task and the editor. Pointer and keyboard (arrows, Shift for bigger steps, Home/End, Enter to reset), double-click to reset, sizes remembered.

### Changed (fight screen overhaul)

- The data table now scrolls inside its panel (its scroll container had no bounded height, so rows past the screen were unreachable). Column headers no longer overlap.
- The right-hand panel has tabs: Your data (live table with highlights), Result (what the last run returned), Changes (cell-by-cell log). A SELECT, DataFrame or Series is shown as a real table; text output as text; an error replaces the table with a large plain error view that leads with a plain-English reading of the problem and keeps the engine's own message below it.
- The left side now holds the task, the live "You win when" checklist, hints, the editor and the Run button. The old output console is gone from there.
- New editor panel: schema-aware autocomplete (SQL tables and columns; pandas methods and column names in Python), clickable table and column chips that insert names, line wrapping, Tab indent, Reset and Clear.
- Cases carry a plain `strings.task` (one or two sentences) shown first; the story is tucked under "The story behind it".
- The CRT scanline effect now starts off.
- Run button reads "Run" with a plain shortcut hint.
- Narrow screens: HUD bands and the editor no longer overflow.

### Added (Phase 5: World 4, The Architect)

- Four cases: MELT_FORM, PIVOT_PLAN, JSON_VAULT and the final THE_ARCHITECT, all solved in Python and SQL on the real engines.
- New whole-table predicates `lacks_columns`, `column_sum` and `distinct_count`.
- `reshapes` case flag: disables the Python row-identity column (which melt/pivot would otherwise reshape into the data) and shows a shape summary instead of a cell diff.
- Blueprint theme and HUD: the target shape drawn as chips (columns to add, columns to remove) plus the remaining rules.
- Each world's boss title now follows the world's accent color.

### Added (Phase 5: World 3, The Twins)

- Multi-table engine support: a case can declare `extraTables`; both workers load them beside the main dataset. In SQL, a table or view named `result` is judged in preference to `data`.
- New whole-table predicates `row_count` and `has_columns`, and a shared "debt" count (`totalDebt`) so the HUD and victory screen work when a rule has no cell to highlight.
- The Twins: KEY_MIRROR, GHOST_TWIN, DOUBLE_VISION and the final THE_TWINS, all solved in Python and SQL on the real engines. Graphite theme with a cyan and a rose accent; a checklist HUD showing what the join still needs; tabs to view the original second table.

### Added (Phase 4: World 2, The Vault)

- Five cases: PIN_TUMBLER (phone formats), HOST_LOCK (URLs to hostnames), SERIAL_LOCK (ids buried in text), LATIN_LOCK (mojibake), THE_WARDEN (final boss). Each was solved end to end in both Python and SQL against the real engines.
- Tumbler display: The Vault replaces the HP strip with one lock tumbler per win-condition rule; pins slide onto the shear line as cells clear.
- New predicates `matches_pattern` and `no_mojibake`, new affliction kinds `pattern` and `encoding`.
- SQL engine gains `REGEXP`, `REGEXP_EXTRACT` and `REGEXP_REPLACE`.
- World select hub as the landing screen; per-world themes (navy and brass for The Vault); `BossFightScreen` and `WorldMapScreen` now take a world.
- First-time tutorial overlay.

### Added

- Victory panel on boss clear (runs, cells cleaned, hints used, techniques) with "Back to bosses" and "Keep exploring".
- Progressive per-engine hints (`hints` in case JSON, hidden for final bosses); authored for the first three bosses.
- Redesigned boss roster screen with rank progress bar and boss cards.

### Fixed

- Mobile fight screen text overflow, cramped top bar, and clipped boot sequence.
- Briefing pane clipped the objective line on desktop; engine-select screen is now centred.

## Phase 3 — Dual-engine World 1 (SQL) — 2026-08-09

Every World 1 boss is now playable in SQL (SQLite via sql.js) as well as
Python (pandas via Pyodide) — the same case content, the same win
conditions, a real second in-browser engine rather than a simulated one.

### Added

- **sql.js/SQLite engine**: `apps/web/src/engines/sqlite.worker.ts`
  implements the same worker protocol as the Pyodide worker (`init-case`,
  `run-code`, `cancel`) against a real in-memory SQLite database. The seed
  CSV is loaded into a table literally named `data`; row identity for
  diffing uses SQLite's own `rowid` (stable across `UPDATE`/`DELETE`, with
  no idiomatic-SQL equivalent of `.reset_index()` that could defeat it,
  unlike pandas). sql.js's WASM binary is self-hosted automatically via
  Vite's `?url` asset resolution — no manual fetch/checksum script needed,
  unlike Pyodide's `scripts/fetch-pyodide.mjs` (it ships as one importable
  npm package, not a multi-hundred-MB distribution).
- **CSV-to-table loading + dtype inference for SQL**
  (`apps/web/src/engines/csv.ts`, `sql-dtypes.ts`): a hand-rolled
  RFC4180-ish CSV parser plus pandas-like per-column type inference (a
  column is only numeric if _every_ non-empty value in it parses as one —
  matching `pandas.read_csv`'s actual behavior), and dtype inference from
  SQLite's manifest-typed return values, producing the exact same dtype
  vocabulary (`int64`/`float64`/`object`/`datetime64[ns]`) the Pyodide
  worker reports, so `valid_dtype` and every downstream rendering path stay
  engine-agnostic.
- **`WorkerEngineClient` base class** (`packages/engine-adapters/src/client.ts`):
  extracted from the original single-engine `PyodideClient` once a second,
  near-identical `SqliteClient` would otherwise have duplicated its
  spawn/ready/run/cancel/terminate logic — the two now differ only in
  which worker file `createWorker()` spawns.
- **Engine-select screen** (`EngineSelect.tsx`): a new gate before boot —
  neither `PyodideClient` nor `SqliteClient` spawns (and for Pyodide, its
  multi-megabyte WASM payload isn't fetched) until the player actually
  picks an engine. `BossFightScreen`'s phase flow grew a
  `loading -> engine-select -> spawning -> boot -> fight` sequence (was
  `loading -> boot -> fight`); the fight-reveal slide-down (added this
  phase — see Fixed) still plays on entering `fight`, unaffected by which
  engine the run underneath it is.
- **Dual-language starter code**: `caseSchema.starterCode` is now
  `{ python, sql }` (was a single string) — a case's Python and SQL seed
  buffers are authored separately since they aren't translations of each
  other. All four World 1 cases got real, runnable SQL starter code
  (inspection queries mirroring their Python counterparts, e.g.
  `SELECT COUNT(*) FROM data WHERE temp_c IS NULL` alongside
  `df.isna().sum()`).
- **SQL syntax highlighting**: `CodeEditor` takes a `language: "python" |
"sql"` prop, using `@codemirror/lang-sql`'s `sql()` extension when a
  player is in SQL mode.

### Fixed / cross-engine parity

- **`valid_dtype: "datetime"` was trivially satisfied on load in SQL,
  never in Python** — the seed CSV's `opened_at` column (`THE_RECKONING`)
  is written via `Date.toISOString()` (e.g.
  `"2026-01-15T09:20:00.000Z"`), and the SQL dtype inferencer's original
  ISO-date regex matched that shape immediately, so the predicate started
  satisfied with zero player action — unlike Pyodide, where the identical
  column starts as pandas' `object` dtype until `pd.to_datetime()` is
  called. Fixed by tightening `ISO_DATE_PATTERN` in `sql-dtypes.ts` to
  reject fractional seconds and zone suffixes, matching instead exactly
  what SQLite's own `datetime()` function returns — so
  `UPDATE data SET opened_at = datetime(opened_at);` is now the required
  fix, the structural SQL twin of `pd.to_datetime(...)`. Caught during
  this phase's manual real-browser verification of `THE_RECKONING` in SQL
  mode, not by the type system or existing tests — regression tests added.
- Documented (not a code fix, a genuine engine difference authors must
  design around): SQLite's `CAST(x AS REAL)` silently returns `0` for
  non-numeric text, unlike pandas' `pd.to_numeric(..., errors="coerce")`,
  which returns `NaN`. `THE_RECKONING`'s `first_response_hours` column
  (garbage tokens like `"N/A"`/`"TBD"` mixed with real numbers) needs an
  explicit `CASE`-based coercion in SQL to get the same result — see the
  new "Writing content that's fair on both engines" section in
  `docs/content-authoring-guide.md`.

### Verified

- All four World 1 cases solved end-to-end in a real headless browser in
  **both** engines (not just typechecked/unit-tested), including
  `THE_RECKONING`'s six-predicate final-boss win condition in SQL — zero
  console errors in either engine. Re-verified against a production build
  served with the real `vercel.json` CSP headers (sql.js's self-hosted
  WASM asset loads and initializes cleanly under
  `script-src 'self' 'wasm-unsafe-eval'`; no CSP/`vercel.json` changes were
  needed since no new external origin was introduced).

## Phase 2 — Full World 1 — 2026-08-08

World 1 is now four bosses deep instead of one, with a real front door,
real progression, and real save data — no more hardcoded single fight.

### Added

- **Three new bosses**: `DOUBLE_TAKE` (mid-boss — nulls + duplicates
  stacked), `CASE_SHIFT` (mid-boss — whitespace + casing + wrong dtype,
  three afflictions on one table), `THE_RECKONING` (final boss — all six
  World 1 techniques stacked on one 500-row support-ticket dataset,
  including a deliberate sequencing trap: one column needs a dtype fix
  before its nulls and outliers can be addressed). Each ships with a
  synthetic, CC0, seeded-PRNG dataset and generator script, same pattern
  as Phase 1's `NUL_SENTINEL`. Datasets are styled after realistic messy
  data rather than literally sourced from Kaggle — a deliberate scoping
  decision documented in `apps/web/public/datasets/world-1/LICENSES.md`
  for the same licensing/offline-availability reasons as
  [ADR 0004](./docs/adr/0004-pyodide-package-delivery.md).
- **Four new win-condition predicates** (`no_whitespace`,
  `consistent_casing`, `valid_dtype`, `no_outliers`) covering all six of
  World 1's content areas from the master plan — Phase 1 only implemented
  `no_nulls`/`no_duplicates`. `valid_dtype` targeting `datetime` covers
  "bad dates" rather than a bespoke predicate.
- **Multi-affliction rendering**: every cell's affliction kind (null,
  duplicate, whitespace/casing, wrong dtype, outlier, bad date) now comes
  from a real per-cell map (`apps/web/src/lib/affliction-cells.ts`),
  each with its own colorblind-safe badge glyph, fill pattern, and
  `aria-label`, extending Phase 1's single-hue-plus-pattern system rather
  than replacing it. The HP heatmap aggregates severity across kinds with
  a dominant-color-per-bin rule (never blends hues — that would break the
  CVD-safety the ramp exists for) plus a glyph-count breakdown row for
  stacked cases.
- **World map** (`WorldMapScreen.tsx`) — the "front door" Phase 1 never
  needed (it had exactly one hardcoded fight): a boss roster with
  locked/unlocked/cleared state (straight linear gate on roster order),
  a rank/XP readout, and save export/import.
- **localStorage save system** (`apps/web/src/lib/save.ts`) — per-world
  cleared-case tracking, mastered-technique tracking, and XP, exported/
  imported as portable JSON (no login, per plan §6). XP is awarded once
  per technique on a case's first clear only, so re-running a solved case
  can't be grinded. Ranks are tied to distinct techniques mastered, not
  cases cleared, also per plan §6.
- **Case tiers** (`tutorial`/`mid-boss`/`final-boss`) drive both the
  roster display and the final boss's "no hints, one shot" framing — an
  honest tone/framing choice (withheld objective line, no starter-code
  scaffold), not a fake anti-cheat mechanism; nothing stops a determined
  player from inspecting `df` themselves, nor should it.
- **World rosters** (`content/rosters/<world>.json`) declare a world's
  boss sequence explicitly as reviewable content, not an inferred
  directory listing; `validate-content.mjs` now cross-checks every
  roster's case IDs actually resolve to a case file.
- `docs/design/world-1-phase-2-visual-spec.md` — the Phase 2 visual/motion
  spec. **Authored by Sonnet, not Opus** — a documented, user-approved
  one-time deviation from this project's normal process, forced by an
  Opus session-quota block mid-phase. Extends rather than replaces Phase 1's
  spec: the six-status affliction palette (colors/glyphs/patterns) was
  already fully designed by Opus in Phase 1 specifically so Phase 2
  wouldn't need to reopen it.

### Fixed

- **`lib/diff.ts` was positional-only** — a documented Phase 1 scoping
  assumption explicitly flagged as needing revisiting "once
  drop_duplicates()/dropna() cases (Phase 2) can change row count." That's
  exactly what `DOUBLE_TAKE` and `THE_RECKONING` require. `ResultGrid` now
  carries each row's real pandas index value; `diffGrids` and the new
  `clearedCells` helper match rows by that identity instead of array
  position, so a run that drops rows no longer produces a wall of spurious
  diffs on every row after the drop. Caught via real-browser testing, not
  code review.
- **Content-directory naming mismatch**: case JSON lived under
  `content/cases/world-1/` (a Phase 1 naming artifact) while every other
  Phase 2 concept keys off the `WorldId` value `"boss-fights"` — silently
  broke roster loading (`fetch` 404 → SPA fallback → JSON parse error).
  Renamed the directory to match `WorldId` exactly, and documented the
  convention in `docs/ARCHITECTURE.md` so it can't drift again.
- **Boot sequence hardcoded "NUL" as the scan label** regardless of a
  case's actual affliction mix — a stacked case like `THE_RECKONING` now
  reads `scanning for affliction .. NUL+WS+DUP+TYPE+OOR`, not a
  misleading `NUL`.
- **Console output had no dedicated, labeled panel** — an unlabeled blank
  scroll region below the run button read as dead space, especially
  before any code had run. `DiffConsole` now has an `OUTPUT` header with
  an entry count and an explicit empty state
  (`// run code to see diff output here`), flagged during a mid-session
  UI pass as genuinely incomplete rather than polish-optional.
- **The fight screen had no entrance** — `setPhase("fight")` was a hard
  React state swap with zero transition. Added a GSAP entrance
  (`anim/world1/fightReveal.ts`): the status rail and command rail fade
  in plainly, but the battlefield (HP band + dataframe grid) gets its own
  distinct slide-down — "the dataframe IS the battlefield" earns the more
  deliberate reveal.
- **`DOUBLE_TAKE`'s generator could silently undercount its own stated
  duplicate count** — nulling an email on one half of a duplicate pair
  (composite key `[email, item_sku, submitted_at]`) breaks the match,
  since the two rows no longer share a key. Fixed by excluding
  duplicate-involved rows from the null-email sampling pool, so the
  generated dataset always has exactly the documented counts.

Verified end-to-end in a real browser (headless Chrome, zero console
errors): world map → tutorial fight → win → rank/XP update → roster
reflects cleared/unlocked state → 2-stack mid-boss → 3-stack mid-boss →
5-distinct-kind final boss → save export/import.

### Fixed (Phase 2 completeness review)

A structured self-critique against the master plan and every non-negotiable
found real defects before Phase 2 was called done — all fixed and
re-verified, including against the real production build under the actual
CSP headers (not just `vite dev`):

- **P0 — the HP heatmap's severity math was wrong, and the final boss's top
  severity tier could never render.** The ratio powering each segment's
  level was normalized against predicate _count_, not the number of
  distinct columns a win condition could actually flag — on THE_RECKONING
  (7 predicates, 4 affictable columns at the time) the max achievable ratio
  was 4/7 ≈ 0.57, capping every segment below the top tier regardless of
  how afflicted a row really was. Fixed with a proper
  `afflictableColumns()` capacity calculation, plus a second bug in the
  same function: level boundaries used the decimal literals `0.33`/`0.66`
  instead of exact `1/3`/`2/3`, so an exact-thirds ratio (CASE_SHIFT's own
  baseline) rounded into the wrong band. Both traced back to an error in
  the (Sonnet-authored, Opus-unreviewed) design spec's own formula, not
  just the implementation — the spec was corrected too.
- **Bad-dates content was entirely missing** despite three places (this
  changelog, `LICENSES.md`, a code comment) claiming World 1's full six
  content areas were covered. Added `valid_dtype(opened_at, "datetime")`
  to `THE_RECKONING` — its `opened_at` column was already realistic "bad
  dates" content (plain CSV text, not yet parsed), it just had no predicate
  checking it.
- **Datetime columns would have rendered as raw epoch-millisecond
  integers** once a player fixed the above — `to_json()`'s default
  `date_format="epoch"` in the worker's serializer. Fixed with
  `date_format="iso"`; verified a `pd.to_datetime()` fix now shows real
  ISO datetime strings in both the grid and the console output.
- **`.reset_index(drop=True)` — the single most idiomatic way to finish a
  `drop_duplicates()` fix — could re-corrupt the row-identity diffing
  fixed earlier this phase.** Pandas' default index survives
  `drop_duplicates()` but not an explicit reset, which re-labels rows back
  to a fresh range that can collide with old identities. Replaced
  index-based tracking with a hidden, hand-maintained data column
  (`__dcq_row_id__`, stripped from the grid before it's ever sent to the
  UI) that survives every row-preserving operation, `.reset_index()`
  included. See the updated [ADR 0006](./docs/adr/0006-row-identity-diffing.md).
- **A11y preferences (text scale, CRT intensity, high contrast) were
  silently ignored on the world map** — the app's actual landing screen
  since this phase, but the only code applying them still lived inside
  `BossFightScreen`. Lifted to `App.tsx` (`lib/a11y.ts`) and rendered via a
  new shared `A11yControls` component on both screens.
- **Save import/export status was invisible to screen readers** — the
  `aria-live` region only existed once there was something to announce,
  which most screen readers don't reliably pick up. Made it always-mounted
  (empty when idle), matching the pattern `BossFightScreen` already used
  for its own live regions; added an announcement for export too (there
  was none).
- **The world map's initial bundle pulled in CodeMirror and GSAP before a
  player had picked a fight** — an unsplit route boundary introduced by
  this phase's own new navigation. Route-split via `React.lazy`; the
  landing screen's JS dropped from ~279 KB gzip to ~79 KB gzip.
- Smaller fixes: the roster's "/ 6 techniques" denominator was hardcoded
  instead of derived from the world's actual rank tiers; the roster's
  affliction-kind glyph preview had no accessible-name equivalent for
  screen reader users (folded into each case button's `aria-label`); the
  save-export download anchor wasn't appended to the document before
  `.click()` (fragile outside Chromium) and revoked its object URL
  synchronously instead of after the click had a chance to start;
  `hpSegments.test.ts` had a test that positively certified the P0 bug as
  correct behavior — replaced with regression tests for the fixed formula;
  added a `clearedCells` test exercising the after-position remap branch
  the review flagged as uncovered.

Re-verified end-to-end after all of the above, including a full pass
against the production build served with the real `vercel.json` CSP
headers (not `vite dev`) — same lesson Phase 1's own review learned: dev
mode doesn't catch CSP-only or MIME-type-only failures.

## Phase 1 — Prove the core loop — 2026-08-08

The nulls-only tutorial boss, `NUL_SENTINEL`, is real and playable
end-to-end: real Pyodide/pandas execution in a dedicated Web Worker, real
diff feedback, real win detection. Verified in a real browser (headless
Chrome), not just unit tests — including a genuine unmodified Python
traceback surfacing on a bad run.

### Added

- **World 1 visual/motion design spec**
  (`docs/design/world-1-visual-spec.md`) — Opus-authored, covering palette,
  typography, layout, the CRT treatment, affliction rendering, the HP
  heatmap, diff-flash choreography, GSAP timelines, and the ASCII sigil.
  Sonnet implemented directly against this spec.
- **Pyodide worker** (`apps/web/src/engines/pyodide.worker.ts`) — self-hosted,
  checksum-verified interpreter core; pandas/numpy/etc. wheels loaded by
  direct pinned-version URL from jsdelivr (documented in
  [ADR 0004](./docs/adr/0004-pyodide-package-delivery.md), with the matching
  `connect-src` exception in `vercel.json`). Runs in a dedicated Web Worker,
  never the main thread. A persistent Python namespace holds `df` across
  runs within a boss fight, so cumulative edits behave like a real notebook.
- **Worker RPC** (`packages/engine-adapters/src/rpc.ts`) — correlates
  `init-case`/`run-code`/`cancel` requests with responses, with timeout
  handling and 8 unit tests. `cancel()` is documented as best-effort only
  (no true mid-execution interrupt without SharedArrayBuffer + cross-origin
  isolation, which would conflict with ADR 0002's simpler CSP posture).
- **Pure game-logic libraries** (`apps/web/src/lib/`): `diff.ts` (positional
  cell diffing — a documented Phase 1 scoping assumption, valid while row
  count/order stay stable), `afflictions.ts` (null/duplicate counting),
  `evaluate-win-condition.ts` (declarative predicate evaluation against a
  live result grid). 16 unit tests between them.
- **World 1 UI** (`apps/web/src/worlds/boss-fights/`) — `BootSequence`
  (character-typed boot log), `BriefingPanel` (with the decaying ASCII
  sigil), `HpHeatmap` (per-row auto-binned affliction heatmap, not an
  aggregate bar), `DataframeGrid` (TanStack Virtual, the dataframe _is_ the
  boss), `CodeEditor` (CodeMirror 6, custom theme, `Mod-Enter` to run),
  `RunBar`, `DiffConsole`. Colorblind-safe affliction/diff palettes (hue +
  glyph + pattern, never color alone), reduced-motion variants throughout,
  keyboard nav, font-scale/CRT-intensity/high-contrast controls persisted
  separately from save data.
- **GSAP choreography** (`apps/web/src/anim/world1/`) — boss-hit recoil,
  HP-segment shatter, diff-flash (reading-order wave vs. the shatter's
  randomized stagger), CRT idle flicker (via `repeatRefresh` so it never
  visibly loops), boot-sequence typing. All animation state lives outside
  React (ADR 0001) — driven via refs and CSS custom properties.
- **Tutorial case content**: `content/cases/world-1/w1-01-nul-sentinel.json`
  - a deterministic synthetic-data generator
    (`scripts/generate-nul-sentinel.mjs`, CC0, seeded PRNG) producing the
    240-row/23-null dataset with the clustered null distribution the HP
    heatmap needs to be informative.
- One additive, optional schema field (`caseStringsSchema.subtitle`) needed
  by the design spec's boss subtitle line.
- A custom Vite plugin (`apps/web/vite.config.ts`) serving/copying
  `content/cases/` in dev and at build time — replaced an initial attempt
  with `vite-plugin-static-copy`, which didn't serve files in dev mode.
- `pnpm install` now runs `postinstall` → `fetch-pyodide.mjs` automatically,
  since the worker genuinely depends on those assets being present.
- Case JSON gained three fields, applied to the shipped case: `datasetLicense`
  (required — plan §8's per-dataset license documented in metadata, not only
  `LICENSES.md`), `starterCode` (required — the code buffer the editor
  seeds, previously hardcoded in the component), `columnHints` (optional —
  per-column width/numeric display hints, previously hardcoded).
- Worker output capture: `run-result` now includes captured `print()` output
  plus the last expression's repr, exactly like a real notebook cell — the
  shipped starter code (`df.isna().sum()`) previously produced no visible
  output at all.

### Fixed

A Phase 1 completeness review (Opus self-critique against the plan, the
design spec, and every non-negotiable) found real defects before the phase
was tagged done — all fixed and re-verified in a real browser under the
actual production CSP headers, not just `vite dev`:

- **CSP would have blanked the app in production.** `script-src 'self'`
  blocks `WebAssembly.instantiate` (Pyodide can't start) and `style-src
'self'` blocks CodeMirror's runtime-injected stylesheet — neither was ever
  exercised by earlier verification, which only ran against the dev server.
  Fixed with `'wasm-unsafe-eval'` and `'unsafe-inline'` respectively; see
  [ADR 0005](./docs/adr/0005-csp-wasm-and-inline-styles.md).
- **Diff-flash was semantically broken**: `.diffOld` tweened `opacity: 0 →
0` (a no-op — the CSS default and the tween's start value were both zero),
  had no `text-decoration-line` for its strikethrough, and wasn't cleared
  after settling — an invisible stale value sat in the DOM and shifted cell
  layout for the rest of the session. Fixed: explicit `fromTo` from a real
  visible state, absolute-stacked spans so old/new overlap instead of
  pushing layout, and the old value's text is cleared on settle.
- `EngineRpcClient.ready()` had no timeout and the worker never posted a
  failure — a broken engine hung on a blank screen forever. Added an
  `engine-error` protocol message and a 45s `ready()` timeout with a real
  visible loading/failure UI (previously an empty div).
- Grid had no keyboard navigation despite `role="grid"` (plan §11's "full
  keyboard nav" requirement) — added roving `tabindex` + arrow keys, plus
  `:focus-visible` rings that were missing on the briefing/console panels.
- Font-scale controls silently broke the grid: row height was hardcoded at
  28px while the CSS line-height scaled with `--dcq-text-scale`, clipping
  text at larger sizes. Row height now derives from the same scale and
  triggers `virtualizer.measure()`.
- HP heatmap segment colors were set via inline style, so
  `[data-dcq-contrast="high"]` couldn't reach them; moved to CSS
  `[data-level]` rules. Added a `forced-colors: active` fallback (Windows
  High Contrast) for afflicted cells.
- Dead code removed: `afflictionDom.ts`'s `applyAffliction`/
  `setCellAriaLabel` were never called (affliction rendering already goes
  through React props, which ADR 0001 is amended to clarify is fine for
  once-per-turn state); `resetDiffFlash` was exported but never called
  (its cleanup is now automatic inside `playDiffFlashBatch`).
- `BootSequence` used a raw `useEffect` whose cleanup didn't kill the GSAP
  master timeline, so StrictMode's double-invoke could run two typing
  timelines concurrently. Switched to `useGSAP`.
- Chromatic aberration (`--w1-chromatic`) was tweened by
  `battlefieldRecoil.ts` but no CSS rule consumed it — the recoil had no
  screen mis-convergence artifact. Wired to `text-shadow` on `.battlefield`.
- Narrow-viewport DOM order didn't match the spec's reading order (briefing
  → HP → grid → editor → run bar → console) and the narrow-display notice
  wasn't dismissible. Fixed with `order` + a dismiss button.
- Run errors announced via the polite live region instead of assertive, and
  the polite region wasn't debounced. Split into two regions; the polite one
  now debounces 400ms.
- A schema-valid `no_duplicates`-only case would have rendered a blank
  screen (World 1 only renders the nulls affliction) — now shows an honest
  "not supported yet" message instead.
- Test gaps: `caseFormat.ts` and `bootType.ts`'s `revealLine` (segment
  boundary math) had zero coverage; `sigil.test.ts` had a vacuous assertion
  that passed only because it coincidentally matched the frame's border
  characters, not the fill logic under test; no component-level test
  existed despite jsdom being configured. Added tests for all of these
  (61 tests passing workspace-wide, up from 36).

### Not yet built (see `README.md#status` and the roadmap in the master plan)

- Save system, XP/rank tracking, stacked afflictions, mid/final bosses —
  Phase 2.
- SQL engine (sql.js), dual-engine cases — Phase 3.
- Worlds 2–5, sandbox mode — Phases 4–6.
- Playwright e2e, Lighthouse CI, Service Worker/offline caching, full
  security review — Phase 7.
- Open-source launch materials, sound design, shareable rank cards — Phases
  8–9.

## Phase 0 — Repo scaffold — 2026-08-08

### Added

- Initial repo scaffold: pnpm workspaces monorepo (`apps/web`,
  `packages/content-schema`, `packages/engine-adapters`, `packages/ui-kit`,
  `content/`), strict shared `tsconfig.base.json` chain, flat ESLint config,
  Prettier, Husky pre-commit + lint-staged.
- `apps/web`: Vite + React 19 + TypeScript placeholder shell.
- `packages/content-schema`: Zod schema for case JSON, declarative
  win-condition predicates (`no_nulls`, `no_duplicates`).
- `packages/engine-adapters`: typed main-thread/worker message protocol
  (`protocol.ts`) — RPC implementation and the actual Pyodide worker land in
  Phase 1 implementation, not this scaffold.
- `scripts/fetch-pyodide.mjs` — pinned + checksum-verified Pyodide-core
  fetch, gitignored output.
- `scripts/validate-content.mjs` — validates `content/cases/**/*.json`
  against the content schema; wired into CI.
- GitHub Actions CI: typecheck → lint → format check → unit tests → content
  validation → build.
- `vercel.json` with strict CSP (`script-src 'self'`, `connect-src 'self'`,
  no inline scripts).
- Governance docs: `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, PR template, bug/new-case issue templates, Dependabot.
- `docs/ARCHITECTURE.md`, `docs/content-authoring-guide.md`, and ADRs for
  the three open decisions resolved before scaffolding: React over Svelte
  (0001), Vercel over GitHub Pages for CSP-capable hosting (0002), and
  declarative-only win-condition predicates (0003).
