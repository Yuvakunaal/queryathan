/**
 * Splitting SQL text into its statements, aware of quotes and comments (so a ";" inside
 * a string or a comment does not end a statement), and the one transformation the app
 * offers on top: turning the last query into the answer table.
 */
export interface Statement {
  /** The statement's text without its closing ";". */
  text: string;
  /** Index of the statement's first character in the source. */
  start: number;
  /** Index just after its last character (before the ";"). */
  end: number;
}

export function splitStatements(code: string): Statement[] {
  const out: Statement[] = [];
  let start = 0;
  let i = 0;
  const flush = (end: number): void => {
    const text = code.slice(start, end);
    if (text.trim() !== "") out.push({ text, start, end });
  };
  while (i < code.length) {
    const ch = code[i] ?? "";
    const next = code[i + 1] ?? "";
    if (ch === "'" || ch === '"' || ch === "`") {
      // A quoted string or identifier; a doubled quote inside is an escaped quote.
      i += 1;
      while (i < code.length) {
        if (code[i] === ch) {
          if (code[i + 1] === ch) {
            i += 2;
            continue;
          }
          break;
        }
        i += 1;
      }
      i += 1;
    } else if (ch === "-" && next === "-") {
      while (i < code.length && code[i] !== "\n") i += 1;
    } else if (ch === "/" && next === "*") {
      const close = code.indexOf("*/", i + 2);
      i = close === -1 ? code.length : close + 2;
    } else if (ch === ";") {
      flush(i);
      i += 1;
      start = i;
    } else {
      i += 1;
    }
  }
  flush(code.length);
  return out;
}

/** The statement with its leading comments and spaces removed, to see what kind it is. */
function body(text: string): string {
  let s = text;
  for (;;) {
    const trimmed = s.replace(/^\s+/, "");
    if (trimmed.startsWith("--")) {
      const nl = trimmed.indexOf("\n");
      s = nl === -1 ? "" : trimmed.slice(nl + 1);
    } else if (trimmed.startsWith("/*")) {
      const close = trimmed.indexOf("*/");
      s = close === -1 ? "" : trimmed.slice(close + 2);
    } else {
      return trimmed;
    }
  }
}

/** True for a statement that only reads and shows rows: SELECT, WITH ... SELECT, VALUES. */
export function isQuery(statement: string): boolean {
  return /^(select|with|values)\b/i.test(body(statement));
}

/** True when a query already builds the answer table. */
export function buildsResult(code: string): boolean {
  return /\bcreate\s+(?:or\s+replace\s+)?(?:temp(?:orary)?\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?["`[]?result\b/i.test(
    code,
  );
}

/**
 * Wraps the last statement in `CREATE TABLE result AS ...` when it is a query (a plain
 * SELECT or one that starts with WITH), so a query that only shows rows can be handed
 * in as the answer. Returns null when there is nothing to wrap (the last statement
 * is not a query, or the code already builds result).
 */
export function wrapLastQueryAsResult(code: string): string | null {
  if (buildsResult(code)) return null;
  const statements = splitStatements(code);
  const last = statements[statements.length - 1];
  if (!last || !isQuery(last.text)) return null;
  const at = last.start + (last.text.length - body(last.text).length);
  const prefix = "CREATE TABLE result AS\n";
  const wrapped = code.slice(0, at) + prefix + code.slice(at, last.end).trimEnd();
  const rest = code.slice(last.end);
  return wrapped + (rest.includes(";") ? rest : ";" + rest);
}
