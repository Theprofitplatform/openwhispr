const test = require("node:test");
const assert = require("node:assert/strict");

function createApiRecorder() {
  const calls = [];
  return {
    calls,
    api: {
      transcribeAudioFile: async (...args) => {
        calls.push(["local", ...args]);
        return { success: true, text: "local transcript" };
      },
      transcribeAudioFileCloud: async (...args) => {
        calls.push(["hosted", ...args]);
        return { success: true, text: "hosted transcript" };
      },
      transcribeAudioFileByok: async (...args) => {
        calls.push(["byok", ...args]);
        return { success: true, text: "byok transcript" };
      },
    },
  };
}

test("upload route calls local transcription IPC for local mode", async () => {
  const { transcribeUploadedAudioFile } = await import(
    "../../src/components/notes/uploadTranscriptionRouting.ts"
  );
  const { calls, api } = createApiRecorder();

  const result = await transcribeUploadedAudioFile(api, {
    filePath: "/tmp/audio.wav",
    useLocalWhisper: true,
    localTranscriptionProvider: "nvidia",
    parakeetModel: "parakeet-tdt-0.6b-v3",
    whisperModel: "base",
    cloudTranscriptionMode: "byok",
    cloudTranscriptionProvider: "openai",
    cloudTranscriptionBaseUrl: "",
    cloudTranscriptionModel: "whisper-1",
    apiKey: "",
    language: "en",
    environment: "",
    tenant: "",
    requestId: "req-local",
  });

  assert.equal(result.text, "local transcript");
  assert.deepEqual(calls, [
    [
      "local",
      "/tmp/audio.wav",
      { provider: "nvidia", model: "parakeet-tdt-0.6b-v3", requestId: "req-local" },
    ],
  ]);
});

test("upload route calls BYOK IPC for provider and self-hosted modes", async () => {
  const { transcribeUploadedAudioFile } = await import(
    "../../src/components/notes/uploadTranscriptionRouting.ts"
  );
  const { calls, api } = createApiRecorder();

  const result = await transcribeUploadedAudioFile(api, {
    filePath: "/tmp/audio.wav",
    useLocalWhisper: false,
    localTranscriptionProvider: "whisper",
    parakeetModel: "",
    whisperModel: "base",
    cloudTranscriptionMode: "byok",
    cloudTranscriptionProvider: "custom",
    cloudTranscriptionBaseUrl: "http://127.0.0.1:9000/v1",
    cloudTranscriptionModel: "whisper-large",
    apiKey: "local-key",
    language: "en",
    environment: "",
    tenant: "",
    requestId: "req-byok",
  });

  assert.equal(result.text, "byok transcript");
  assert.equal(calls[0][0], "byok");
  assert.deepEqual(calls[0][1], {
    filePath: "/tmp/audio.wav",
    apiKey: "local-key",
    baseUrl: "http://127.0.0.1:9000/v1",
    model: "whisper-large",
    provider: "custom",
    language: "en",
    environment: "",
    tenant: "",
    requestId: "req-byok",
  });
});

test("upload route calls hosted cloud IPC through the session wrapper", async () => {
  const { transcribeUploadedAudioFile } = await import(
    "../../src/components/notes/uploadTranscriptionRouting.ts"
  );
  const { calls, api } = createApiRecorder();
  let wrapped = false;

  const result = await transcribeUploadedAudioFile(
    api,
    {
      filePath: "/tmp/audio.wav",
      useLocalWhisper: false,
      localTranscriptionProvider: "whisper",
      parakeetModel: "",
      whisperModel: "base",
      cloudTranscriptionMode: "openwhispr",
      cloudTranscriptionProvider: "openwhispr",
      cloudTranscriptionBaseUrl: "",
      cloudTranscriptionModel: "cloud",
      apiKey: "",
      language: "en",
      environment: "",
      tenant: "",
      requestId: "req-cloud",
    },
    async (fn) => {
      wrapped = true;
      return fn();
    }
  );

  assert.equal(result.text, "hosted transcript");
  assert.equal(wrapped, true);
  assert.deepEqual(calls, [["hosted", "/tmp/audio.wav", { requestId: "req-cloud" }]]);
});
