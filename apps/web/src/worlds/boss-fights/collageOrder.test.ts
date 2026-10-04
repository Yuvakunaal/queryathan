import { describe, expect, it } from "vitest";
import { orderPanes, swapOrder } from "./collageOrder";

const panes = [{ id: "main" }, { id: "customers" }, { id: "products" }];

describe("collage order", () => {
  it("follows the saved order and puts new tables last", () => {
    expect(orderPanes(panes, ["products", "main"]).map((p) => p.id)).toEqual([
      "products",
      "main",
      "customers",
    ]);
  });

  it("ignores saved ids that no longer exist", () => {
    expect(orderPanes(panes, ["gone", "customers"]).map((p) => p.id)).toEqual([
      "customers",
      "main",
      "products",
    ]);
  });

  it("swaps two tables and leaves an unknown id alone", () => {
    expect(swapOrder(["a", "b", "c"], "a", "c")).toEqual(["c", "b", "a"]);
    expect(swapOrder(["a", "b"], "a", "zzz")).toEqual(["a", "b"]);
  });
});
