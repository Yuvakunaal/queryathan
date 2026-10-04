/**
 * The everyday SQL functions SQLite does not ship, written to behave the way
 * they do in MySQL, PostgreSQL and Snowflake, so what a learner (or a job)
 * already knows works here. Pure functions on text, numbers and null; the SQLite
 * worker registers them. Dates are the ISO text SQLite itself uses
 * ("2026-03-09" or "2026-03-09 14:05:00"), and every function returns null for a
 * value it cannot read, like SQL does.
 */
export type Scalar = string | number | null;

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

interface Stamp {
  y: number;
  mo: number; // 1-12
  d: number;
  h: number;
  mi: number;
  s: number;
  /** True when the text had a time of day. */
  timed: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const UNITS = [
  "year",
  "quarter",
  "month",
  "week",
  "day",
  "hour",
  "minute",
  "second",
] as const;
type Unit = (typeof UNITS)[number];

const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

function isScalar(v: unknown): v is string | number {
  return typeof v === "string" || typeof v === "number";
}

/** Reads "YYYY-MM-DD" with an optional "HH:MM[:SS[.fff]]" (space or T between), validating the calendar. */
export function parseStamp(value: unknown): Stamp | null {
  if (typeof value !== "string") return null;
  const m =
    /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(?:Z)?\s*$/.exec(
      value,
    );
  if (!m) return null;
  const stamp: Stamp = {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4] ?? 0),
    mi: Number(m[5] ?? 0),
    s: Number(m[6] ?? 0),
    timed: m[4] !== undefined,
  };
  if (
    stamp.mo < 1 ||
    stamp.mo > 12 ||
    stamp.d < 1 ||
    stamp.h > 23 ||
    stamp.mi > 59 ||
    stamp.s > 59
  ) {
    return null;
  }
  return stamp.d > daysInMonth(stamp.y, stamp.mo) ? null : stamp;
}

function daysInMonth(y: number, mo: number): number {
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

const toMs = (t: Stamp): number => Date.UTC(t.y, t.mo - 1, t.d, t.h, t.mi, t.s);

function fromMs(ms: number, timed: boolean): string {
  const d = new Date(ms);
  const date = `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return timed
    ? `${date} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
    : date;
}

function fromStamp(t: Stamp): string {
  return fromMs(toMs(t), t.timed);
}

const dayOfWeekSun0 = (t: Stamp): number => new Date(toMs(t)).getUTCDay();
const dayOfYear = (t: Stamp): number =>
  Math.round((Date.UTC(t.y, t.mo - 1, t.d) - Date.UTC(t.y, 0, 1)) / 86_400_000) + 1;

/** ISO 8601 week number (weeks start on Monday; week 1 holds the year's first Thursday). */
function isoWeek(t: Stamp): number {
  const date = new Date(Date.UTC(t.y, t.mo - 1, t.d));
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day + 3); // the Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
}

export function normalizeUnit(raw: unknown): Unit | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase().replace(/s$/, "");
  const alias: Record<string, Unit> = {
    yy: "year",
    yyyy: "year",
    q: "quarter",
    mm: "month",
    mon: "month",
    wk: "week",
    ww: "week",
    dd: "day",
    d: "day",
    hh: "hour",
    mi: "minute",
    n: "minute",
    ss: "second",
    s: "second",
  };
  const found = alias[u] ?? u;
  return (UNITS as readonly string[]).includes(found) ? (found as Unit) : null;
}

export function datePart(unit: unknown, value: unknown): number | null {
  const t = parseStamp(value);
  const raw = typeof unit === "string" ? unit.trim().toLowerCase() : "";
  if (!t) return null;
  switch (raw) {
    case "dow":
    case "dayofweek":
      return dayOfWeekSun0(t);
    case "doy":
    case "dayofyear":
      return dayOfYear(t);
    case "epoch":
      return toMs(t) / 1000;
    case "isoweek":
      return isoWeek(t);
    default:
      break;
  }
  switch (normalizeUnit(unit)) {
    case "year":
      return t.y;
    case "quarter":
      return Math.ceil(t.mo / 3);
    case "month":
      return t.mo;
    case "week":
      return isoWeek(t);
    case "day":
      return t.d;
    case "hour":
      return t.h;
    case "minute":
      return t.mi;
    case "second":
      return t.s;
    default:
      return null;
  }
}

export function dateTrunc(unit: unknown, value: unknown): string | null {
  const t = parseStamp(value);
  const u = normalizeUnit(unit);
  if (!t || !u) return null;
  const out: Stamp = { ...t };
  switch (u) {
    case "year":
      Object.assign(out, { mo: 1, d: 1, h: 0, mi: 0, s: 0 });
      break;
    case "quarter":
      Object.assign(out, {
        mo: Math.floor((t.mo - 1) / 3) * 3 + 1,
        d: 1,
        h: 0,
        mi: 0,
        s: 0,
      });
      break;
    case "month":
      Object.assign(out, { d: 1, h: 0, mi: 0, s: 0 });
      break;
    case "week": {
      const back = (dayOfWeekSun0(t) + 6) % 7; // back to Monday
      return fromMs(Date.UTC(t.y, t.mo - 1, t.d - back), false);
    }
    case "day":
      Object.assign(out, { h: 0, mi: 0, s: 0 });
      break;
    case "hour":
      Object.assign(out, { mi: 0, s: 0 });
      break;
    case "minute":
      out.s = 0;
      break;
    case "second":
      break;
  }
  out.timed = t.timed && (u === "hour" || u === "minute" || u === "second");
  return fromStamp(out);
}

/** Adds whole units, clamping the day to the month's end (Jan 31 + 1 month = Feb 28/29), like MySQL and Snowflake. */
export function dateAdd(value: unknown, amount: unknown, unit: unknown): string | null {
  const t = parseStamp(value);
  const u = normalizeUnit(unit ?? "day");
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!t || !u || !Number.isFinite(n)) return null;
  const whole = Math.trunc(n);
  if (u === "year" || u === "quarter" || u === "month") {
    const months = u === "year" ? whole * 12 : u === "quarter" ? whole * 3 : whole;
    const index = t.y * 12 + (t.mo - 1) + months;
    const y = Math.floor(index / 12);
    const mo = (index % 12) + 1;
    const d = Math.min(t.d, daysInMonth(y, mo));
    return fromStamp({ ...t, y, mo, d });
  }
  const step: Record<"week" | "day" | "hour" | "minute" | "second", number> = {
    week: 7 * 86_400_000,
    day: 86_400_000,
    hour: 3_600_000,
    minute: 60_000,
    second: 1000,
  };
  const timed = t.timed || u === "hour" || u === "minute" || u === "second";
  return fromMs(toMs(t) + whole * step[u], timed);
}

/** Calendar boundaries crossed between two moments, Snowflake style: DATEDIFF(month, '2026-01-31', '2026-02-01') = 1. */
export function dateDiffUnits(unit: unknown, from: unknown, to: unknown): number | null {
  const a = parseStamp(from);
  const b = parseStamp(to);
  const u = normalizeUnit(unit);
  if (!a || !b || !u) return null;
  switch (u) {
    case "year":
      return b.y - a.y;
    case "quarter":
      return (b.y - a.y) * 4 + (Math.ceil(b.mo / 3) - Math.ceil(a.mo / 3));
    case "month":
      return (b.y - a.y) * 12 + (b.mo - a.mo);
    case "week": {
      const wa = Date.parse(`${dateTrunc("week", fromStamp(a)) ?? ""}T00:00:00Z`);
      const wb = Date.parse(`${dateTrunc("week", fromStamp(b)) ?? ""}T00:00:00Z`);
      return Math.round((wb - wa) / (7 * 86_400_000));
    }
    case "day":
      return Math.round(
        (Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / 86_400_000,
      );
    case "hour":
      return Math.round(
        (Date.UTC(b.y, b.mo - 1, b.d, b.h) - Date.UTC(a.y, a.mo - 1, a.d, a.h)) /
          3_600_000,
      );
    case "minute":
      return Math.round(
        (Date.UTC(b.y, b.mo - 1, b.d, b.h, b.mi) -
          Date.UTC(a.y, a.mo - 1, a.d, a.h, a.mi)) /
          60_000,
      );
    case "second":
      return Math.round((toMs(b) - toMs(a)) / 1000);
  }
}

/** Whole units that have fully elapsed between two moments, MySQL style (TIMESTAMPDIFF). */
export function timestampDiff(unit: unknown, from: unknown, to: unknown): number | null {
  const a = parseStamp(from);
  const b = parseStamp(to);
  const u = normalizeUnit(unit);
  if (!a || !b || !u) return null;
  if (u === "year" || u === "quarter" || u === "month") {
    const per = u === "year" ? 12 : u === "quarter" ? 3 : 1;
    let months = (b.y - a.y) * 12 + (b.mo - a.mo);
    const rest = (t: Stamp): number => ((t.d * 24 + t.h) * 60 + t.mi) * 60 + t.s;
    if (months > 0 && rest(b) < rest(a)) months -= 1;
    if (months < 0 && rest(b) > rest(a)) months += 1;
    return Math.trunc(months / per);
  }
  const ms = toMs(b) - toMs(a);
  const size: Record<"week" | "day" | "hour" | "minute" | "second", number> = {
    week: 7 * 86_400_000,
    day: 86_400_000,
    hour: 3_600_000,
    minute: 60_000,
    second: 1000,
  };
  return Math.trunc(ms / size[u]);
}

export function lastDay(value: unknown): string | null {
  const t = parseStamp(value);
  return t ? fromMs(Date.UTC(t.y, t.mo - 1, daysInMonth(t.y, t.mo)), false) : null;
}

export function now(): string {
  return fromMs(Date.now(), true);
}

// --- formatting and parsing with a pattern ---------------------------------

/** Tokens for TO_CHAR / TO_DATE (PostgreSQL, Snowflake, Oracle style), longest first. */
const SQL_TOKENS = [
  "YYYY",
  "HH24",
  "HH12",
  "MONTH",
  "Month",
  "month",
  "DAY",
  "Day",
  "day",
  "YY",
  "MM",
  "DD",
  "DDD",
  "HH",
  "MI",
  "SS",
  "MON",
  "Mon",
  "mon",
  "DY",
  "Dy",
  "dy",
  "AM",
  "PM",
  "am",
  "pm",
] as const;

function formatWithTokens(t: Stamp, format: string, mysql: boolean): string {
  const dow = dayOfWeekSun0(t);
  const hour12 = t.h % 12 === 0 ? 12 : t.h % 12;
  if (mysql) {
    return format.replace(/%([a-zA-Z%])/g, (_, code: string) => {
      switch (code) {
        case "Y":
          return pad(t.y, 4);
        case "y":
          return pad(t.y % 100);
        case "m":
          return pad(t.mo);
        case "c":
          return String(t.mo);
        case "d":
          return pad(t.d);
        case "e":
          return String(t.d);
        case "H":
          return pad(t.h);
        case "h":
        case "I":
          return pad(hour12);
        case "i":
          return pad(t.mi);
        case "s":
        case "S":
          return pad(t.s);
        case "p":
          return t.h < 12 ? "AM" : "PM";
        case "M":
          return MONTHS[t.mo - 1] ?? "";
        case "b":
          return (MONTHS[t.mo - 1] ?? "").slice(0, 3);
        case "W":
          return DAYS[dow] ?? "";
        case "a":
          return (DAYS[dow] ?? "").slice(0, 3);
        case "j":
          return pad(dayOfYear(t), 3);
        case "u":
          return pad(isoWeek(t));
        case "%":
          return "%";
        default:
          return `%${code}`;
      }
    });
  }
  const pattern = new RegExp(SQL_TOKENS.join("|"), "g");
  return format.replace(pattern, (token) => {
    switch (token) {
      case "YYYY":
        return pad(t.y, 4);
      case "YY":
        return pad(t.y % 100);
      case "MM":
        return pad(t.mo);
      case "DD":
        return pad(t.d);
      case "DDD":
        return pad(dayOfYear(t), 3);
      case "HH24":
        return pad(t.h);
      case "HH12":
      case "HH":
        return pad(hour12);
      case "MI":
        return pad(t.mi);
      case "SS":
        return pad(t.s);
      case "MONTH":
        return (MONTHS[t.mo - 1] ?? "").toUpperCase();
      case "Month":
        return MONTHS[t.mo - 1] ?? "";
      case "month":
        return (MONTHS[t.mo - 1] ?? "").toLowerCase();
      case "MON":
        return (MONTHS[t.mo - 1] ?? "").slice(0, 3).toUpperCase();
      case "Mon":
        return (MONTHS[t.mo - 1] ?? "").slice(0, 3);
      case "mon":
        return (MONTHS[t.mo - 1] ?? "").slice(0, 3).toLowerCase();
      case "DAY":
        return (DAYS[dow] ?? "").toUpperCase();
      case "Day":
        return DAYS[dow] ?? "";
      case "day":
        return (DAYS[dow] ?? "").toLowerCase();
      case "DY":
        return (DAYS[dow] ?? "").slice(0, 3).toUpperCase();
      case "Dy":
        return (DAYS[dow] ?? "").slice(0, 3);
      case "dy":
        return (DAYS[dow] ?? "").slice(0, 3).toLowerCase();
      case "AM":
      case "PM":
        return t.h < 12 ? "AM" : "PM";
      case "am":
      case "pm":
        return t.h < 12 ? "am" : "pm";
      default:
        return token;
    }
  });
}

export function dateFormat(
  value: unknown,
  format: unknown,
  mysql: boolean,
): string | null {
  const t = parseStamp(value);
  if (!t || typeof format !== "string") return null;
  return formatWithTokens(t, format, mysql);
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Reads text written in any layout back into an ISO date, given the layout ("DD/MM/YYYY" or "%d/%m/%Y"). */
export function parseWithFormat(text: unknown, format: unknown): string | null {
  if (typeof text !== "string" || typeof format !== "string") return null;
  const mysql = format.includes("%");
  const fields: string[] = [];
  let source = "";
  if (mysql) {
    let last = 0;
    for (const m of format.matchAll(/%([a-zA-Z%])/g)) {
      source += escapeRegex(format.slice(last, m.index));
      last = m.index + m[0].length;
      const code = m[1] ?? "";
      const digits: Record<string, [string, string]> = {
        Y: ["y", "(\\d{4})"],
        y: ["yy", "(\\d{2})"],
        m: ["mo", "(\\d{1,2})"],
        c: ["mo", "(\\d{1,2})"],
        d: ["d", "(\\d{1,2})"],
        e: ["d", "(\\d{1,2})"],
        H: ["h", "(\\d{1,2})"],
        h: ["h12", "(\\d{1,2})"],
        I: ["h12", "(\\d{1,2})"],
        i: ["mi", "(\\d{2})"],
        s: ["s", "(\\d{2})"],
        S: ["s", "(\\d{2})"],
        p: ["ampm", "(AM|PM|am|pm)"],
        M: ["monthname", "([A-Za-z]+)"],
        b: ["monthname", "([A-Za-z]{3})"],
      };
      const spec = digits[code];
      if (spec) {
        fields.push(spec[0]);
        source += spec[1];
      } else {
        source += escapeRegex(`%${code}`);
      }
    }
    source += escapeRegex(format.slice(last));
  } else {
    const tokens = new RegExp(SQL_TOKENS.join("|"), "g");
    let last = 0;
    for (const m of format.matchAll(tokens)) {
      source += escapeRegex(format.slice(last, m.index));
      last = m.index + m[0].length;
      const token = m[0];
      const spec: Record<string, [string, string]> = {
        YYYY: ["y", "(\\d{4})"],
        YY: ["yy", "(\\d{2})"],
        MM: ["mo", "(\\d{1,2})"],
        DD: ["d", "(\\d{1,2})"],
        HH24: ["h", "(\\d{1,2})"],
        HH12: ["h12", "(\\d{1,2})"],
        HH: ["h12", "(\\d{1,2})"],
        MI: ["mi", "(\\d{2})"],
        SS: ["s", "(\\d{2})"],
        MONTH: ["monthname", "([A-Za-z]+)"],
        Month: ["monthname", "([A-Za-z]+)"],
        month: ["monthname", "([A-Za-z]+)"],
        MON: ["monthname", "([A-Za-z]{3})"],
        Mon: ["monthname", "([A-Za-z]{3})"],
        mon: ["monthname", "([A-Za-z]{3})"],
        AM: ["ampm", "(AM|PM|am|pm)"],
        PM: ["ampm", "(AM|PM|am|pm)"],
        am: ["ampm", "(AM|PM|am|pm)"],
        pm: ["ampm", "(AM|PM|am|pm)"],
      };
      const entry = spec[token];
      if (entry) {
        fields.push(entry[0]);
        source += entry[1];
      } else {
        source += `(?:${escapeRegex(token)}|[A-Za-z]+)`;
      }
    }
    source += escapeRegex(format.slice(last));
  }
  const m = new RegExp(`^\\s*${source}\\s*$`).exec(text);
  if (!m) return null;
  const got: Record<string, string> = {};
  fields.forEach((name, i) => {
    got[name] = m[i + 1] ?? "";
  });
  let y = got.y !== undefined ? Number(got.y) : NaN;
  if (Number.isNaN(y) && got.yy !== undefined) {
    const yy = Number(got.yy);
    y = yy >= 70 ? 1900 + yy : 2000 + yy;
  }
  let mo = got.mo !== undefined ? Number(got.mo) : NaN;
  if (got.monthname !== undefined) {
    const index = MONTHS.findIndex((name) =>
      name.toLowerCase().startsWith((got.monthname ?? "").toLowerCase().slice(0, 3)),
    );
    mo = index === -1 ? NaN : index + 1;
  }
  const d = got.d !== undefined ? Number(got.d) : 1;
  let h = got.h !== undefined ? Number(got.h) : 0;
  if (got.h12 !== undefined) {
    h = Number(got.h12) % 12;
    if ((got.ampm ?? "").toUpperCase() === "PM") h += 12;
  }
  const mi = got.mi !== undefined ? Number(got.mi) : 0;
  const s = got.s !== undefined ? Number(got.s) : 0;
  if (Number.isNaN(y) || Number.isNaN(mo)) return null;
  const timed = got.h !== undefined || got.h12 !== undefined || got.mi !== undefined;
  const stamp: Stamp = { y, mo, d, h, mi, s, timed };
  const inRange =
    mo >= 1 &&
    mo <= 12 &&
    d >= 1 &&
    d <= daysInMonth(y, mo) &&
    h <= 23 &&
    mi <= 59 &&
    s <= 59;
  return inRange ? fromStamp(stamp) : null;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

const text = (v: unknown): string | null => (isScalar(v) ? String(v) : null);

export function splitPart(
  value: unknown,
  delimiter: unknown,
  index: unknown,
): string | null {
  const s = text(value);
  const d = text(delimiter);
  const n = typeof index === "number" ? Math.trunc(index) : Number(index);
  if (s === null || d === null || !Number.isFinite(n) || n === 0) return null;
  const parts = d === "" ? [s] : s.split(d);
  const picked = n > 0 ? parts[n - 1] : parts[parts.length + n];
  return picked ?? "";
}

export function substringIndex(
  value: unknown,
  delimiter: unknown,
  count: unknown,
): string | null {
  const s = text(value);
  const d = text(delimiter);
  const n = typeof count === "number" ? Math.trunc(count) : Number(count);
  if (s === null || d === null || d === "" || !Number.isFinite(n)) return null;
  const parts = s.split(d);
  if (n === 0) return "";
  return n > 0 ? parts.slice(0, n).join(d) : parts.slice(n).join(d);
}

export function pad_(
  value: unknown,
  length: unknown,
  fill: unknown,
  left: boolean,
): string | null {
  const s = text(value);
  const n = typeof length === "number" ? Math.trunc(length) : Number(length);
  const f = fill === undefined ? " " : text(fill);
  if (s === null || f === null || !Number.isFinite(n) || n < 0) return null;
  if (s.length >= n) return s.slice(0, n);
  if (f === "") return s;
  const filler = f.repeat(Math.ceil((n - s.length) / f.length)).slice(0, n - s.length);
  return left ? filler + s : s + filler;
}

export function initcap(value: unknown): string | null {
  const s = text(value);
  return s === null
    ? null
    : s
        .toLowerCase()
        .replace(
          /(^|[^A-Za-z0-9'])([a-z])/g,
          (_, a: string, b: string) => a + b.toUpperCase(),
        );
}

export function translate(value: unknown, from: unknown, to: unknown): string | null {
  const s = text(value);
  const f = text(from);
  const t = text(to);
  if (s === null || f === null || t === null) return null;
  return Array.from(s)
    .map((ch) => {
      const i = f.indexOf(ch);
      return i === -1 ? ch : (t[i] ?? "");
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Numbers and nulls
// ---------------------------------------------------------------------------

const num = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
    return Number(v);
  return null;
};

export function truncate(value: unknown, places: unknown): number | null {
  const x = num(value);
  const p = places === undefined ? 0 : num(places);
  if (x === null || p === null) return null;
  const f = 10 ** Math.trunc(p);
  return Math.trunc(x * f) / f;
}

/** MySQL/Snowflake: GREATEST and LEAST are NULL if any argument is NULL. */
export function greatestLeast(values: Scalar[], greatest: boolean): Scalar {
  if (values.length === 0 || values.some((v) => v === null)) return null;
  const numbers = values.filter((v): v is number => typeof v === "number");
  if (numbers.length === values.length) {
    return greatest ? Math.max(...numbers) : Math.min(...numbers);
  }
  return values
    .map(String)
    .reduce((best, v) => ((greatest ? v > best : v < best) ? v : best));
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

type Fn = (...args: Scalar[]) => Scalar;

function make(): Record<string, Fn> {
  const dp =
    (unit: string): Fn =>
    (v) =>
      datePart(unit, v);
  return {
    // dates: parts
    year: dp("year"),
    month: dp("month"),
    day: dp("day"),
    dayofmonth: dp("day"),
    hour: dp("hour"),
    minute: dp("minute"),
    second: dp("second"),
    quarter: dp("quarter"),
    week: dp("week"),
    weekofyear: dp("week"),
    dayofyear: dp("doy"),
    // MySQL numbering: 1 = Sunday ... 7 = Saturday
    dayofweek: (v) => {
      const d = datePart("dow", v);
      return d === null ? null : d + 1;
    },
    // MySQL numbering: 0 = Monday ... 6 = Sunday
    weekday: (v) => {
      const d = datePart("dow", v);
      return d === null ? null : (d + 6) % 7;
    },
    dayname: (v) => {
      const d = datePart("dow", v);
      return d === null ? null : (DAYS[d] ?? null);
    },
    monthname: (v) => {
      const m = datePart("month", v);
      return m === null ? null : (MONTHS[m - 1] ?? null);
    },
    date_part: (unit, v) => datePart(unit, v),
    last_day: (v) => lastDay(v),
    // dates: moving and measuring
    date_trunc: (unit, v) => dateTrunc(unit, v),
    dateadd: (unit, n, v) => dateAdd(v, n, unit),
    timestampadd: (unit, n, v) => dateAdd(v, n, unit),
    date_add: (v, n, unit) => dateAdd(v, n, unit ?? "day"),
    adddate: (v, n, unit) => dateAdd(v, n, unit ?? "day"),
    date_sub: (v, n, unit) =>
      dateAdd(v, typeof n === "number" ? -n : null, unit ?? "day"),
    subdate: (v, n, unit) => dateAdd(v, typeof n === "number" ? -n : null, unit ?? "day"),
    timestampdiff: (unit, a, b) => timestampDiff(unit, a, b),
    // DATEDIFF(a, b) is days a - b (MySQL); DATEDIFF(unit, a, b) is boundaries from a to b (Snowflake).
    datediff: (...args) =>
      args.length === 2
        ? dateDiffUnits("day", args[1], args[0])
        : dateDiffUnits(args[0], args[1], args[2]),
    // dates: layouts
    date_format: (v, f) => dateFormat(v, f, true),
    to_char: (v, f) => dateFormat(v, f, false),
    str_to_date: (s, f) => parseWithFormat(s, f),
    to_date: (...args) => {
      if (args.length < 2) {
        const t = parseStamp(args[0]);
        return t ? fromMs(Date.UTC(t.y, t.mo - 1, t.d), false) : null;
      }
      return parseWithFormat(args[0], args[1]);
    },
    to_timestamp: (...args) =>
      args.length < 2
        ? ((t) => (t ? fromStamp({ ...t, timed: true }) : null))(parseStamp(args[0]))
        : parseWithFormat(args[0], args[1]),
    now: () => now(),
    getdate: () => now(),
    sysdate: () => now(),
    curdate: () => now().slice(0, 10),
    unix_timestamp: (v) => {
      const t = parseStamp(v);
      return t ? toMs(t) / 1000 : null;
    },
    from_unixtime: (v) => {
      const n = num(v);
      return n === null ? null : fromMs(n * 1000, true);
    },
    // text
    left: (v, n) => {
      const s = text(v);
      const k = num(n);
      return s === null || k === null ? null : s.slice(0, Math.max(0, k));
    },
    right: (v, n) => {
      const s = text(v);
      const k = num(n);
      return s === null || k === null ? null : k <= 0 ? "" : s.slice(-k);
    },
    lpad: (v, n, f) => pad_(v, n, f, true),
    rpad: (v, n, f) => pad_(v, n, f, false),
    repeat: (v, n) => {
      const s = text(v);
      const k = num(n);
      return s === null || k === null ? null : s.repeat(Math.max(0, Math.trunc(k)));
    },
    space: (n) => {
      const k = num(n);
      return k === null ? null : " ".repeat(Math.max(0, Math.trunc(k)));
    },
    initcap: (v) => initcap(v),
    char_length: (v) => {
      const s = text(v);
      return s === null ? null : Array.from(s).length;
    },
    character_length: (v) => {
      const s = text(v);
      return s === null ? null : Array.from(s).length;
    },
    ascii: (v) => {
      const s = text(v);
      return s === null || s === "" ? null : (s.codePointAt(0) ?? null);
    },
    lcase: (v) => text(v)?.toLowerCase() ?? null,
    ucase: (v) => text(v)?.toUpperCase() ?? null,
    split_part: (v, d, i) => splitPart(v, d, i),
    substring_index: (v, d, c) => substringIndex(v, d, c),
    startswith: (v, p) => {
      const s = text(v);
      const q = text(p);
      return s === null || q === null ? null : s.startsWith(q) ? 1 : 0;
    },
    endswith: (v, p) => {
      const s = text(v);
      const q = text(p);
      return s === null || q === null ? null : s.endsWith(q) ? 1 : 0;
    },
    contains: (v, p) => {
      const s = text(v);
      const q = text(p);
      return s === null || q === null ? null : s.includes(q) ? 1 : 0;
    },
    strpos: (v, p) => {
      const s = text(v);
      const q = text(p);
      return s === null || q === null ? null : s.indexOf(q) + 1;
    },
    translate: (v, f, t) => translate(v, f, t),
    regexp_substr: (v, p) => {
      const s = text(v);
      const q = text(p);
      if (s === null || q === null) return null;
      return new RegExp(q).exec(s)?.[0] ?? null;
    },
    regexp_like: (v, p) => {
      const s = text(v);
      const q = text(p);
      return s === null || q === null ? null : new RegExp(q).test(s) ? 1 : 0;
    },
    regexp_count: (v, p) => {
      const s = text(v);
      const q = text(p);
      return s === null || q === null ? null : [...s.matchAll(new RegExp(q, "g"))].length;
    },
    // numbers
    ceiling: (v) => {
      const x = num(v);
      return x === null ? null : Math.ceil(x);
    },
    pow: (a, b) => {
      const x = num(a);
      const y = num(b);
      return x === null || y === null ? null : x ** y;
    },
    ln: (v) => {
      const x = num(v);
      return x === null || x <= 0 ? null : Math.log(x);
    },
    log2: (v) => {
      const x = num(v);
      return x === null || x <= 0 ? null : Math.log2(x);
    },
    mod: (a, b) => {
      const x = num(a);
      const y = num(b);
      return x === null || y === null || y === 0 ? null : x % y;
    },
    trunc: (v, p) => truncate(v, p),
    truncate: (v, p) => truncate(v, p),
    greatest: (...a) => greatestLeast(a, true),
    least: (...a) => greatestLeast(a, false),
    // nulls
    nvl: (a, b) => a ?? b ?? null,
    nvl2: (a, b, c) => (a === null ? (c ?? null) : (b ?? null)),
    zeroifnull: (a) => a ?? 0,
    nullifzero: (a) => (a === 0 ? null : a),
  };
}

export const FRIENDLY_FUNCTIONS: Readonly<Record<string, Fn>> = make();

/** The part of sql.js's Database this needs, so it can be tested without the real engine. */
export interface FunctionHost {
  create_function(name: string, fn: (...args: never[]) => unknown): unknown;
}

/**
 * Registers every function. SQLite takes a function's argument count from its
 * `length`; setting it to -1 accepts any number of arguments, so optional
 * arguments (DATE_ADD with or without a unit) work.
 */
export function registerFriendlyFunctions(host: FunctionHost): void {
  for (const [name, fn] of Object.entries(FRIENDLY_FUNCTIONS)) {
    const variadic = (...args: Scalar[]): Scalar => {
      try {
        return fn(...args);
      } catch {
        return null; // an unreadable value gives NULL, as in SQL
      }
    };
    Object.defineProperty(variadic, "length", { value: -1 });
    host.create_function(name, variadic);
  }
}
