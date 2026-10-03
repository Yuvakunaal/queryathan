export function formatCellValue(
  value: string | number | boolean | null | undefined,
  nullLabel = "NaN",
): string {
  if (value === null || value === undefined) return nullLabel;
  return String(value);
}
