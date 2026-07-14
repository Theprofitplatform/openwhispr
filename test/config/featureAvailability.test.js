const test = require("node:test");
const assert = require("node:assert/strict");

test("local transcription is usable without account or subscription", async () => {
  const { resolveFeatureAvailability } = await import("../../src/config/featureAvailability.ts");
  const state = resolveFeatureAvailability({
    isSignedIn: false,
    isSubscribed: false,
    isTrial: false,
    modes: { transcription: "local" },
  });

  assert.equal(state.transcription.usable, true);
  assert.equal(state.transcription.route, "local");
  assert.equal(state.transcription.requiresHostedSubscription, false);
  assert.equal(state.transcription.reason, "local_available");
});

test("provider and self-hosted modes are usable without an OpenWhispr subscription", async () => {
  const { resolveFeatureAvailability } = await import("../../src/config/featureAvailability.ts");
  const state = resolveFeatureAvailability({
    isSignedIn: false,
    isSubscribed: false,
    isTrial: false,
    modes: {
      cleanup: "providers",
      chatAgent: "self-hosted",
    },
  });

  assert.equal(state.cleanup.usable, true);
  assert.equal(state.cleanup.route, "byok");
  assert.equal(state.cleanup.reason, "byok_available");
  assert.equal(state.chatAgent.usable, true);
  assert.equal(state.chatAgent.route, "self-hosted");
  assert.equal(state.chatAgent.reason, "self_hosted_available");
});

test("openwhispr cloud transcription remains hosted gated", async () => {
  const { resolveFeatureAvailability } = await import("../../src/config/featureAvailability.ts");
  const state = resolveFeatureAvailability({
    isSignedIn: true,
    isSubscribed: false,
    isTrial: false,
    modes: { transcription: "openwhispr" },
  });

  assert.equal(state.transcription.usable, true);
  assert.equal(state.transcription.route, "hosted-free-limited");
  assert.equal(state.transcription.requiresHostedSubscription, false);
  assert.equal(state.transcription.reason, "hosted_free_available");
});

test("openwhispr cloud requires account when signed out", async () => {
  const { resolveFeatureAvailability } = await import("../../src/config/featureAvailability.ts");
  const state = resolveFeatureAvailability({
    isSignedIn: false,
    isSubscribed: false,
    isTrial: false,
    modes: { transcription: "openwhispr" },
  });

  assert.equal(state.transcription.usable, false);
  assert.equal(state.transcription.route, "hosted-account-required");
  assert.equal(state.transcription.reason, "account_required");
});

test("large hosted upload requires subscription but local upload does not", async () => {
  const { resolveFeatureAvailability } = await import("../../src/config/featureAvailability.ts");
  const hosted = resolveFeatureAvailability({
    isSignedIn: true,
    isSubscribed: false,
    isTrial: false,
    uploadSizeBytes: 100 * 1024 * 1024,
    modes: { uploadTranscription: "openwhispr" },
  });
  const local = resolveFeatureAvailability({
    isSignedIn: false,
    isSubscribed: false,
    isTrial: false,
    uploadSizeBytes: 100 * 1024 * 1024,
    modes: { uploadTranscription: "local" },
  });

  assert.equal(hosted.uploadTranscription.usable, false);
  assert.equal(hosted.uploadTranscription.reason, "hosted_large_file_requires_pro");
  assert.equal(hosted.uploadTranscription.requiresHostedSubscription, true);
  assert.equal(local.uploadTranscription.usable, true);
  assert.equal(local.uploadTranscription.reason, "local_available");
});

test("hosted-only features remain explicit instead of pretending to be local", async () => {
  const { HOSTED_ONLY_FEATURES, isLocalCapableFeature, resolveFeatureAvailability } =
    await import("../../src/config/featureAvailability.ts");

  assert.deepEqual(HOSTED_ONLY_FEATURES, [
    "cloudBackup",
    "hostedNoteShare",
    "workspaces",
    "workspaceApiKeys",
    "hostedMcp",
  ]);
  assert.equal(isLocalCapableFeature("semanticSearch"), true);
  assert.equal(isLocalCapableFeature("cloudBackup"), false);

  const state = resolveFeatureAvailability({
    isSignedIn: true,
    isSubscribed: false,
    isTrial: false,
    modes: {},
  });

  assert.equal(state.cloudBackup.usable, false);
  assert.equal(state.cloudBackup.reason, "hosted_only");
  assert.equal(state.hostedMcp.requiresHostedSubscription, true);
});
