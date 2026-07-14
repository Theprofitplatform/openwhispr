const test = require("node:test");
const assert = require("node:assert/strict");

test("local cleanup model makes notes onboarding usable without Pro", async () => {
  const { resolveNotesOnboardingAvailability } = await import(
    "../../src/hooks/notesOnboardingAvailability.ts"
  );

  assert.deepEqual(
    resolveNotesOnboardingAvailability({
      useCleanupModel: true,
      isSignedIn: false,
      config: {
        mode: "local",
        model: "qwen3-4b",
        provider: "qwen",
      },
    }),
    { isLLMConfigured: true, requiresHostedAvailability: false }
  );
});

test("BYOK model makes notes onboarding usable without Pro", async () => {
  const { resolveNotesOnboardingAvailability } = await import(
    "../../src/hooks/notesOnboardingAvailability.ts"
  );

  assert.deepEqual(
    resolveNotesOnboardingAvailability({
      useCleanupModel: true,
      isSignedIn: false,
      config: {
        mode: "providers",
        model: "gpt-5-mini",
        provider: "openai",
      },
    }),
    { isLLMConfigured: true, requiresHostedAvailability: false }
  );
});

test("OpenWhispr note formatting requires hosted availability", async () => {
  const { resolveNotesOnboardingAvailability } = await import(
    "../../src/hooks/notesOnboardingAvailability.ts"
  );

  assert.deepEqual(
    resolveNotesOnboardingAvailability({
      useCleanupModel: true,
      isSignedIn: false,
      config: {
        mode: "openwhispr",
        model: "",
        provider: "",
        cloudMode: "openwhispr",
      },
    }),
    { isLLMConfigured: false, requiresHostedAvailability: true }
  );
});
