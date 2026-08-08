import { caseSchema, worldRosterSchema } from "@dcq/content-schema";
import type { Case, WorldId, WorldRoster } from "@dcq/content-schema";

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

export function casePath(world: WorldId, caseId: string): string {
  return `/content/cases/${world}/${caseId}.json`;
}

export async function loadRoster(world: WorldId): Promise<WorldRoster> {
  const response = await fetch(`/content/rosters/${world}.json`);
  if (!response.ok) {
    throw new Error(
      `Failed to load roster: ${String(response.status)} ${response.statusText}`,
    );
  }
  const json: unknown = await response.json();
  return worldRosterSchema.parse(json);
}
