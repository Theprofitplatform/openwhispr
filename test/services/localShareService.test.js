const test = require("node:test");
const assert = require("node:assert/strict");

test("buildLocalNoteSharePackage includes note title content and transcript", async () => {
  global.window = {
    electronAPI: {
      getNote: async () => ({
        id: 42,
        title: "Quarterly Plan",
        content: "Main note body.",
        enhanced_content: "Enhanced summary.",
        transcript: "Speaker transcript.",
        note_type: "meeting",
        source_file: "meeting.wav",
        created_at: "2026-07-07T00:00:00.000Z",
        updated_at: "2026-07-07T00:10:00.000Z",
        cloud_id: null,
      }),
    },
  };
  const { buildLocalNoteSharePackage } = await import("../../src/services/LocalShareService.ts");

  const pkg = await buildLocalNoteSharePackage(42);

  assert.equal(pkg.filename, "quarterly-plan.md");
  assert.equal(pkg.metadata.noteId, 42);
  assert.match(pkg.markdown, /^# Quarterly Plan/);
  assert.match(pkg.markdown, /Enhanced summary\./);
  assert.match(pkg.markdown, /## Transcript/);
  assert.match(pkg.markdown, /Speaker transcript\./);
});

test("buildLocalNoteSharePackage sanitizes filenames and does not require cloud_id", async () => {
  global.window = {
    electronAPI: {
      getNote: async () => ({
        id: 7,
        title: "A/B: Launch? <Plan>",
        content: "Local only.",
        enhanced_content: null,
        transcript: null,
        note_type: "personal",
        source_file: null,
        created_at: "2026-07-07T00:00:00.000Z",
        updated_at: "2026-07-07T00:10:00.000Z",
        cloud_id: null,
      }),
    },
  };
  const { buildLocalNoteSharePackage } = await import("../../src/services/LocalShareService.ts");

  const pkg = await buildLocalNoteSharePackage(7);

  assert.equal(pkg.filename, "a-b-launch-plan.md");
  assert.equal(pkg.metadata.cloudId, null);
  assert.match(pkg.markdown, /Local only\./);
});
