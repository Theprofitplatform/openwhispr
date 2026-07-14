const test = require("node:test");
const assert = require("node:assert/strict");

test("fresh transcription contexts default to local mode", async () => {
  const {
    getDefaultTranscriptionMode,
    getDefaultReasoningMode,
    normalizeInferenceMode,
  } = await import("../../src/config/defaultModes.ts");

  assert.equal(getDefaultTranscriptionMode(), "local");
  assert.equal(getDefaultReasoningMode(), "local");
  assert.equal(normalizeInferenceMode(null, getDefaultTranscriptionMode()), "local");
});

test("stored inference modes are preserved", async () => {
  const { getDefaultTranscriptionMode, normalizeInferenceMode } = await import(
    "../../src/config/defaultModes.ts"
  );

  assert.equal(normalizeInferenceMode("openwhispr", getDefaultTranscriptionMode()), "openwhispr");
  assert.equal(normalizeInferenceMode("providers", getDefaultTranscriptionMode()), "providers");
  assert.equal(normalizeInferenceMode("self-hosted", getDefaultTranscriptionMode()), "self-hosted");
  assert.equal(normalizeInferenceMode("enterprise", getDefaultTranscriptionMode()), "enterprise");
});

test("invalid stored inference modes fall back to the supplied default", async () => {
  const { getDefaultTranscriptionMode, normalizeInferenceMode } = await import(
    "../../src/config/defaultModes.ts"
  );

  assert.equal(normalizeInferenceMode("legacy-cloud", getDefaultTranscriptionMode()), "local");
  assert.equal(normalizeInferenceMode("", "providers"), "providers");
});
