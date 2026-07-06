const test = require("node:test");
const assert = require("node:assert/strict");

const { createSeoYoutubeRadarScheduler } = require("../../src/helpers/seoYoutubeRadar/scheduler.js");

test("scheduler does not schedule when disabled", () => {
  let scheduled = false;
  const scheduler = createSeoYoutubeRadarScheduler({
    store: { getConfig: () => ({ enabled: false }) },
    runNow: async () => ({ processed: 0 }),
    setTimeoutImpl: () => {
      scheduled = true;
      return 1;
    },
    clearTimeoutImpl: () => {},
    now: () => new Date("2026-07-06T12:00:00Z"),
  });
  scheduler.start();
  assert.equal(scheduled, false);
});

test("scheduler schedules enabled daily run", () => {
  let delay = null;
  const scheduler = createSeoYoutubeRadarScheduler({
    store: { getConfig: () => ({ enabled: true, runHourLocal: 7 }) },
    runNow: async () => ({ processed: 0 }),
    setTimeoutImpl: (_fn, ms) => {
      delay = ms;
      return 1;
    },
    clearTimeoutImpl: () => {},
    now: () => new Date("2026-07-06T06:00:00"),
  });
  scheduler.start();
  assert.ok(delay > 0);
});

test("scheduler skips overlapping manual runs", async () => {
  let resolveRun;
  const activeRun = new Promise((resolve) => {
    resolveRun = resolve;
  });
  const scheduler = createSeoYoutubeRadarScheduler({
    store: { getConfig: () => ({ enabled: false }) },
    runNow: () => activeRun,
    setTimeoutImpl: () => 1,
    clearTimeoutImpl: () => {},
    now: () => new Date("2026-07-06T06:00:00"),
  });
  const first = scheduler.runNow();
  const second = await scheduler.runNow();
  assert.deepEqual(second, { processed: 0, rejected: 0, skipped: 0, candidates: 0, errors: [], skipReason: "already_running" });
  resolveRun({ processed: 1 });
  assert.equal((await first).processed, 1);
});
