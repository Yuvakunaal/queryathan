import { caseSchema } from "@dcq/content-schema";
import type { Case } from "@dcq/content-schema";

export async function loadCase(path: string): Promise<Case> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(
      `Failed to load case: ${String(response.status)} ${response.statusText}`,
    );
  }
  const json: unknown = await response.json();
  return caseSchema.parse(json);
}
