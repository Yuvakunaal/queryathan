/**
 * Minimal RFC4180-ish CSV parser + pandas-like per-column type inference,
 * shared groundwork for the SQL engine's CSV-to-table loader. The Pyodide
 * engine never needs this — pandas' own `read_csv` does the parsing there
 * — but sql.js has no CSV importer, and for the two engines to present the
 * same starting affliction set, the SQL side's inference needs to mirror
 * pandas' actual behavior (unquoted, all-numeric-looking values become a
 * genuine number; anything else stays text), not just literally import
 * every cell as text.
 */

export function parseCsv(
  text: string,
  delimiter = ",",
): { columns: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  function endField(): void {
    row.push(field);
    field = "";
  }
  function endRow(): void {
    endField();
    rows.push(row);
    row = [];
  }

  while (i < n) {
    const char = text[i];
    if (char === undefined) break;
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) endRow();

  const [header, ...body] = rows;
  return { columns: header ?? [], rows: body.filter((r) => r.length > 1 || r[0] !== "") };
}

export type CsvValue = string | number | null;

const INT_PATTERN = /^-?\d+$/;
const FLOAT_PATTERN = /^-?\d*\.\d+$|^-?\d+\.\d*$|^-?\d+e[+-]?\d+$/i;

/** pandas' read_csv treats an empty field as a null, and a column is only numeric if EVERY non-null value in it parses as a number — one non-numeric value (a typo, a "N/A", a unit suffix) is enough to keep the whole column as text (pandas dtype "object"), exactly the messiness this game teaches players to find. */
export function inferColumnTypes(
  columns: string[],
  rows: string[][],
): Record<string, "int" | "float" | "string"> {
  const types: Record<string, "int" | "float" | "string"> = {};
  columns.forEach((column, columnIndex) => {
    let sawFloat = false;
    let sawAny = false;
    let allNumeric = true;
    for (const row of rows) {
      const raw = row[columnIndex];
      if (raw === undefined || raw === "") continue;
      sawAny = true;
      if (INT_PATTERN.test(raw)) continue;
      if (FLOAT_PATTERN.test(raw)) {
        sawFloat = true;
        continue;
      }
      allNumeric = false;
      break;
    }
    types[column] = !sawAny || !allNumeric ? "string" : sawFloat ? "float" : "int";
  });
  return types;
}

export function coerceCsvValue(
  raw: string | undefined,
  type: "int" | "float" | "string",
): CsvValue {
  if (raw === undefined || raw === "") return null;
  if (type === "string") return raw;
  const num = Number(raw);
  return Number.isNaN(num) ? raw : num;
}
