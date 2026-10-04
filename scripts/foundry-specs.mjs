#!/usr/bin/env node
// Defines the generated tables for World 5 and prints the checksums used by each
// case's column_sum rule. Run with: npx tsx scripts/foundry-specs.mjs
import { generatedValue } from "../packages/engine-adapters/src/generate.ts";

export const SLOW_LANE = {
  rows: 12000,
  columns: [
    { name: "order_id", recipe: "int_mod", mul: 1, add: 1, mod: 1000000000 },
    { name: "qty", recipe: "int_mod", mul: 31, add: 7, mod: 20 },
    { name: "unit_price", recipe: "float_mod", mul: 977, add: 5, mod: 9973, div: 100 },
    { name: "discount", recipe: "float_mod", mul: 13, add: 3, mod: 31, div: 100 },
  ],
};

export const RUNNING_LAPS = {
  rows: 8000,
  columns: [
    { name: "order_id", recipe: "int_mod", mul: 1, add: 1, mod: 1000000000 },
    { name: "customer_id", recipe: "int_mod", mul: 7919, add: 13, mod: 500 },
    { name: "amount", recipe: "float_mod", mul: 331, add: 17, mod: 9001, div: 100 },
  ],
};

function column(spec, name, i) {
  return generatedValue(
    spec.columns.find((c) => c.name === name),
    i,
  );
}

let totalSum = 0;
for (let i = 0; i < SLOW_LANE.rows; i++) {
  totalSum +=
    column(SLOW_LANE, "qty", i) *
    column(SLOW_LANE, "unit_price", i) *
    (1 - column(SLOW_LANE, "discount", i));
}
const running = new Map();
let runningSum = 0;
for (let i = 0; i < RUNNING_LAPS.rows; i++) {
  const c = column(RUNNING_LAPS, "customer_id", i);
  const next = (running.get(c) ?? 0) + column(RUNNING_LAPS, "amount", i);
  running.set(c, next);
  runningSum += next;
}
console.log(
  JSON.stringify({
    slowLaneTotal: Math.round(totalSum * 100) / 100,
    runningLapsSum: Math.round(runningSum * 100) / 100,
  }),
);
console.log(JSON.stringify(SLOW_LANE), JSON.stringify(RUNNING_LAPS));
