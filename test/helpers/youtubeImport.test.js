const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  importYoutubeAudio,
  normalizeYoutubeUrl,
  parseYtowOutput,
} = require("../../src/helpers/youtubeImport.js");

function createSpawnStub({ stdout = "", stderr = "", code = 0, error = null } = {}) {
  const calls = [];
  const spawnImpl = (bin, args, options) => {
    calls.push({ bin, args, options });

    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};

    setImmediate(() => {
      if (error) {
        child.emit("error", error);
        return;
      }
      if (stdout) child.stdout.emit("data", Buffer.from(stdout));
      if (stderr) child.stderr.emit("data", Buffer.from(stderr));
      child.emit("close", code);
    });

    return child;
  };

  return { calls, spawnImpl };
}

test("normalizeYoutubeUrl accepts common YouTube links and adds https when missing", () => {
  assert.equal(normalizeYoutubeUrl("youtu.be/demo123"), "https://youtu.be/demo123");
  assert.equal(
    normalizeYoutubeUrl("https://www.youtube.com/watch?v=abc"),
    "https://www.youtube.com/watch?v=abc"
  );
  assert.equal(
    normalizeYoutubeUrl("https://music.youtube.com/watch?v=abc"),
    "https://music.youtube.com/watch?v=abc"
  );
});

test("normalizeYoutubeUrl rejects non-YouTube links", () => {
  assert.throws(() => normalizeYoutubeUrl("https://example.com/watch?v=abc"), /YouTube link/);
  assert.throws(() => normalizeYoutubeUrl(""), /Paste a YouTube link first/);
});

test("parseYtowOutput extracts local audio and prompt paths", () => {
  assert.deepEqual(
    parseYtowOutput(
      `Done\nLocal audio: /tmp/video audio.mp3\nOpenWhispr prompt: /tmp/prompt.txt\n`
    ),
    {
      audioPath: "/tmp/video audio.mp3",
      promptPath: "/tmp/prompt.txt",
    }
  );
});

test("importYoutubeAudio runs ytow without a shell and returns the generated audio path", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "openwhispr-youtube-"));
  const audioPath = path.join(dir, "video.mp3");
  fs.writeFileSync(audioPath, "audio");

  const { calls, spawnImpl } = createSpawnStub({
    stdout: `Local audio: ${audioPath}\nOpenWhispr prompt: ${path.join(dir, "prompt.txt")}\n`,
  });

  const result = await importYoutubeAudio("youtu.be/demo123", {
    spawnImpl,
    ytowBin: "/usr/local/bin/ytow",
  });

  assert.equal(result.success, true);
  assert.equal(result.audioPath, audioPath);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].bin, "/usr/local/bin/ytow");
  assert.deepEqual(calls[0].args, ["https://youtu.be/demo123"]);
  assert.equal(calls[0].options.shell, false);
});

test("importYoutubeAudio returns stderr details when ytow fails", async () => {
  const { spawnImpl } = createSpawnStub({
    stderr: "download failed",
    code: 1,
  });

  const result = await importYoutubeAudio("https://youtube.com/watch?v=bad", {
    spawnImpl,
    ytowBin: "ytow",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /download failed/);
});
