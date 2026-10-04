import { useEffect, useState } from "react";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { ColumnHints } from "@dcq/content-schema";
import { parseCsv } from "../../engines/csv";
import DataframeGrid from "./DataframeGrid";

const NO_AFFLICTIONS = new Map<string, never>();

function csvToGrid(text: string): ResultGrid {
  const { columns, rows } = parseCsv(text);
  const asNumber = (value: string): number | null => {
    const trimmed = value.trim();
    return trimmed !== "" && Number.isFinite(Number(trimmed)) ? Number(trimmed) : null;
  };
  const numericColumns = new Set(
    columns.filter((_, c) =>
      rows.every((row) => (row[c] ?? "") === "" || asNumber(row[c] ?? "") !== null),
    ),
  );
  return {
    columns,
    rows: rows.map((row) => {
      const out: Record<string, string | number | null> = {};
      columns.forEach((column, c) => {
        const value = row[c] ?? "";
        out[column] =
          value === "" ? null : numericColumns.has(column) ? Number(value) : value;
      });
      return out;
    }),
    dtypes: Object.fromEntries(
      columns.map((c) => [c, numericColumns.has(c) ? "int64" : "object"]),
    ),
    index: rows.map((_, i) => i),
  };
}

export interface ReferenceTableProps {
  url: string;
  /** The CSV itself, for a table the player brought (nothing to fetch). */
  text?: string | undefined;
  columnHints?: ColumnHints | undefined;
  textScale: number;
}

/** A read-only view of a case's extra table as originally loaded. Changes the player makes to it in code are not reflected. */
export default function ReferenceTable({
  url,
  text,
  textScale,
  columnHints,
}: ReferenceTableProps) {
  const [grid, setGrid] = useState<ResultGrid | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (text !== undefined) {
      setGrid(csvToGrid(text));
      return;
    }
    fetch(url)
      .then((response) => {
        if (!response.ok)
          throw new Error(`${String(response.status)} ${response.statusText}`);
        return response.text();
      })
      .then((body) => {
        if (!cancelled) setGrid(csvToGrid(body));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [url, text]);

  if (error) return <div role="alert">Could not load the reference table: {error}</div>;
  if (!grid) return <div role="status">Loading...</div>;
  return (
    <DataframeGrid
      grid={grid}
      afflictionCellMap={NO_AFFLICTIONS}
      textScale={textScale}
      columnHints={columnHints}
    />
  );
}
