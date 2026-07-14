const test = require("node:test");
const assert = require("node:assert/strict");

const mb = (value) => value * 1024 * 1024;

test("local upload has no app-level Pro size gate", async () => {
  const { getUploadAvailability } = await import(
    "../../src/components/notes/uploadAvailability.ts"
  );

  assert.deepEqual(
    getUploadAvailability({
      fileSizeBytes: mb(500),
      mode: "local",
      provider: "whisper",
      isSignedIn: false,
      isProUser: false,
    }),
    { canTranscribe: true, reason: "ok" }
  );
});

test("hosted free upload above 25 MB requires hosted Pro", async () => {
  const { getUploadAvailability } = await import(
    "../../src/components/notes/uploadAvailability.ts"
  );

  assert.deepEqual(
    getUploadAvailability({
      fileSizeBytes: mb(100),
      mode: "openwhispr",
      provider: "openwhispr",
      isSignedIn: true,
      isProUser: false,
    }),
    { canTranscribe: false, reason: "hosted_large_file_requires_pro" }
  );
});

test("hosted Pro upload above 25 MB is allowed within hosted max", async () => {
  const { getUploadAvailability } = await import(
    "../../src/components/notes/uploadAvailability.ts"
  );

  assert.deepEqual(
    getUploadAvailability({
      fileSizeBytes: mb(100),
      mode: "openwhispr",
      provider: "openwhispr",
      isSignedIn: true,
      isProUser: true,
    }),
    { canTranscribe: true, reason: "ok" }
  );
});

test("BYOK provider upload keeps provider-specific size limits", async () => {
  const { getUploadAvailability } = await import(
    "../../src/components/notes/uploadAvailability.ts"
  );

  assert.deepEqual(
    getUploadAvailability({
      fileSizeBytes: mb(30),
      mode: "providers",
      provider: "openai",
      isSignedIn: false,
      isProUser: false,
    }),
    { canTranscribe: false, reason: "byok_provider_file_too_large" }
  );
});

test("custom self-hosted upload has no app-level Pro size gate", async () => {
  const { getUploadAvailability } = await import(
    "../../src/components/notes/uploadAvailability.ts"
  );

  assert.deepEqual(
    getUploadAvailability({
      fileSizeBytes: mb(500),
      mode: "self-hosted",
      provider: "custom",
      isSignedIn: false,
      isProUser: false,
    }),
    { canTranscribe: true, reason: "ok" }
  );
});
