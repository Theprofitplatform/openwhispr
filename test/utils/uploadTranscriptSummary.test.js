const test = require("node:test");
const assert = require("node:assert/strict");

test("buildUploadEnhancedContent keeps the summary and full transcript", async () => {
  const { buildUploadEnhancedContent } = await import("../../src/utils/uploadTranscriptSummary.ts");

  const result = buildUploadEnhancedContent({
    summary: "This video explains the import workflow.",
    transcript: "Speaker: Paste a link. Then import the audio.",
  });

  assert.equal(
    result,
    "## Summary\n\nThis video explains the import workflow.\n\n## Full Transcript\n\nSpeaker: Paste a link. Then import the audio."
  );
});

test("buildUploadEnhancedContent trims generated summary and transcript", async () => {
  const { buildUploadEnhancedContent } = await import("../../src/utils/uploadTranscriptSummary.ts");

  const result = buildUploadEnhancedContent({
    summary: "\n\n  Short summary.  ",
    transcript: "  Full transcript.  \n",
  });

  assert.equal(result, "## Summary\n\nShort summary.\n\n## Full Transcript\n\nFull transcript.");
});

test("makeUploadContentHash is stable for the same transcript", async () => {
  const { makeUploadContentHash } = await import("../../src/utils/uploadTranscriptSummary.ts");

  assert.equal(makeUploadContentHash("abcdef"), makeUploadContentHash("abcdef"));
  assert.notEqual(makeUploadContentHash("abcdef"), makeUploadContentHash("abcdeg"));
});

test("resolveUploadSummaryReasoning uses OpenWhispr cloud without a model id", async () => {
  const { resolveUploadSummaryReasoning } =
    await import("../../src/utils/uploadTranscriptSummary.ts");

  assert.deepEqual(
    resolveUploadSummaryReasoning({
      mode: "openwhispr",
      provider: "",
      model: "",
      disableThinking: true,
    }),
    {
      modelId: "",
      config: {
        provider: "openwhispr",
        disableThinking: true,
      },
    }
  );
});

test("resolveUploadSummaryReasoning uses LAN for self-hosted note formatting", async () => {
  const { resolveUploadSummaryReasoning } =
    await import("../../src/utils/uploadTranscriptSummary.ts");

  assert.deepEqual(
    resolveUploadSummaryReasoning({
      mode: "self-hosted",
      provider: "",
      model: "qwen",
      remoteUrl: " http://127.0.0.1:11434/v1 ",
      customApiKey: "local-key",
      disableThinking: false,
    }),
    {
      modelId: "qwen",
      config: {
        provider: "lan",
        lanUrl: "http://127.0.0.1:11434/v1",
        customApiKey: "local-key",
        disableThinking: false,
      },
    }
  );
});

test("resolveUploadSummaryReasoning maps local model families to the local provider", async () => {
  const { resolveUploadSummaryReasoning } =
    await import("../../src/utils/uploadTranscriptSummary.ts");

  assert.deepEqual(
    resolveUploadSummaryReasoning({
      mode: "local",
      provider: "qwen",
      model: "qwen3-4b",
      disableThinking: true,
    }),
    {
      modelId: "qwen3-4b",
      config: {
        provider: "local",
        disableThinking: true,
      },
    }
  );
});

test("resolveUploadSummaryReasoning prefers a configured local model over OpenWhispr cloud", async () => {
  const { resolveUploadSummaryReasoning } =
    await import("../../src/utils/uploadTranscriptSummary.ts");

  assert.deepEqual(
    resolveUploadSummaryReasoning({
      mode: "openwhispr",
      provider: "llama",
      model: "llama-3.2-3b",
      disableThinking: false,
    }),
    {
      modelId: "llama-3.2-3b",
      config: {
        provider: "local",
        disableThinking: false,
      },
    }
  );
});

test("resolveUploadSummaryReasoning skips provider mode when no model is configured", async () => {
  const { resolveUploadSummaryReasoning } =
    await import("../../src/utils/uploadTranscriptSummary.ts");

  assert.equal(
    resolveUploadSummaryReasoning({
      mode: "providers",
      provider: "",
      model: "",
      disableThinking: true,
    }),
    null
  );
});
