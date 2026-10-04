import { describe, expect, it } from "vitest";
import { formatRoute, parseRoute } from "./route";
import type { Route } from "./route";

describe("routes", () => {
  const routes: Route[] = [
    { name: "hub" },
    { name: "roster", world: "the-vault" },
    { name: "fight", world: "the-observatory", caseId: "w6-01-first-light" },
    { name: "sandbox" },
  ];

  it("round-trips through the address", () => {
    for (const route of routes) expect(parseRoute(formatRoute(route))).toEqual(route);
  });

  it("falls back to the home screen for anything it does not recognise", () => {
    for (const hash of [
      "",
      "#",
      "#/",
      "#/nonsense",
      "#/world/not-a-world",
      "#/fight/the-vault",
      "#/fight/the-vault/BAD ID",
      "#/world/the-vault/extra",
      "#/sandbox/x",
    ]) {
      expect(parseRoute(hash)).toEqual({ name: "hub" });
    }
  });
});
