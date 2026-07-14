const test = require("node:test");
const assert = require("node:assert/strict");

test("search notes defaults to local semantic then local keyword", async () => {
  const { getSearchStrategyOrder } = await import("../../src/services/tools/searchNotesTool.ts");

  assert.deepEqual(getSearchStrategyOrder(false), ["local-semantic", "local-keyword"]);
});

test("cloud note search is explicit and runs after local strategies", async () => {
  const { getSearchStrategyOrder } = await import("../../src/services/tools/searchNotesTool.ts");

  assert.deepEqual(getSearchStrategyOrder(true), [
    "local-semantic",
    "local-keyword",
    "cloud",
  ]);
});
