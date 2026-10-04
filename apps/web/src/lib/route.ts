import { worldIdSchema } from "@dcq/content-schema";
import type { WorldId } from "@dcq/content-schema";

/**
 * Where the player is, written into the page address (the part after #), so the
 * browser's Back and Forward buttons move between screens instead of leaving the
 * site, and a screen can be reopened from a bookmark. Nothing else is stored in the
 * address: no names, no progress.
 */
export type Route =
  | { name: "hub" }
  | { name: "roster"; world: WorldId }
  | { name: "fight"; world: WorldId; caseId: string }
  | { name: "sandbox" };

const CASE_ID = /^[a-z0-9-]+$/;

export function formatRoute(route: Route): string {
  switch (route.name) {
    case "hub":
      return "#/";
    case "roster":
      return `#/world/${route.world}`;
    case "fight":
      return `#/fight/${route.world}/${route.caseId}`;
    case "sandbox":
      return "#/sandbox";
  }
}

/** Reads an address back into a route. Anything unrecognised is the home screen. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [kind, a, b] = parts;
  if (kind === "sandbox" && parts.length === 1) return { name: "sandbox" };
  const world = worldIdSchema.safeParse(a);
  if (kind === "world" && world.success && parts.length === 2) {
    return { name: "roster", world: world.data };
  }
  if (
    kind === "fight" &&
    world.success &&
    b !== undefined &&
    CASE_ID.test(b) &&
    parts.length === 3
  ) {
    return { name: "fight", world: world.data, caseId: b };
  }
  return { name: "hub" };
}
