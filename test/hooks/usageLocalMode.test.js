const test = require("node:test");
const assert = require("node:assert/strict");

test("local active route ignores hosted over-limit state", async () => {
  const { summariseUsageDisplayMode } = await import("../../src/hooks/useUsageDisplayMode.ts");

  assert.equal(
    summariseUsageDisplayMode({
      activeRoute: "local",
      isOverLimit: true,
    }),
    "local"
  );
});

test("byok and self-hosted active routes do not show hosted upgrade state", async () => {
  const { summariseUsageDisplayMode } = await import("../../src/hooks/useUsageDisplayMode.ts");

  assert.equal(
    summariseUsageDisplayMode({
      activeRoute: "byok",
      isOverLimit: true,
    }),
    "byok"
  );
  assert.equal(
    summariseUsageDisplayMode({
      activeRoute: "self-hosted",
      isOverLimit: true,
    }),
    "self-hosted"
  );
});

test("hosted free route shows upgrade only when over the hosted limit", async () => {
  const { summariseUsageDisplayMode } = await import("../../src/hooks/useUsageDisplayMode.ts");

  assert.equal(
    summariseUsageDisplayMode({
      activeRoute: "hosted-free-limited",
      isOverLimit: false,
    }),
    "hosted-ok"
  );
  assert.equal(
    summariseUsageDisplayMode({
      activeRoute: "hosted-free-limited",
      isOverLimit: true,
    }),
    "hosted-upgrade"
  );
});

test("hosted paid route remains ok even when stale free usage says over limit", async () => {
  const { summariseUsageDisplayMode } = await import("../../src/hooks/useUsageDisplayMode.ts");

  assert.equal(
    summariseUsageDisplayMode({
      activeRoute: "hosted-paid",
      isOverLimit: true,
    }),
    "hosted-ok"
  );
});

test("hosted upgrade prompts only show for hosted display modes", async () => {
  const { shouldShowHostedUpgradePrompt } = await import(
    "../../src/hooks/useUsageDisplayMode.ts"
  );

  assert.equal(shouldShowHostedUpgradePrompt("local"), false);
  assert.equal(shouldShowHostedUpgradePrompt("byok"), false);
  assert.equal(shouldShowHostedUpgradePrompt("self-hosted"), false);
  assert.equal(shouldShowHostedUpgradePrompt("hosted-ok"), true);
  assert.equal(shouldShowHostedUpgradePrompt("hosted-upgrade"), true);
});
