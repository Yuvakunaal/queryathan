export function formatCellValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "NaN";
  return String(value);
}
