const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

function isYoutubeHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com")
  );
}

function normalizeYoutubeUrl(rawUrl) {
  const input = String(rawUrl || "").trim();
  if (!input) {
    throw new Error("Paste a YouTube link first.");
  }

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(input) ? input : `https://${input}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Paste a valid YouTube link.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Paste a valid YouTube link.");
  }

  if (!isYoutubeHost(parsed.hostname)) {
    throw new Error("Paste a YouTube link.");
  }

  return parsed.toString();
}

function parseYtowOutput(stdout) {
  const text = String(stdout || "");
  const audioMatch = text.match(/(?:^|\r?\n)Local audio:\s*(.+?)(?:\r?\n|$)/);
  const promptMatch = text.match(/(?:^|\r?\n)OpenWhispr prompt:\s*(.+?)(?:\r?\n|$)/);

  return {
    audioPath: audioMatch?.[1]?.trim() || null,
    promptPath: promptMatch?.[1]?.trim() || null,
  };
}

function resolveYtowBinary() {
  const localBin = path.join(os.homedir(), ".local", "bin", "ytow");
  if (fs.existsSync(localBin)) return localBin;
  return "ytow";
}

function buildFailureMessage(stdout, stderr, fallback) {
  const output = `${stderr || ""}\n${stdout || ""}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-6)
    .join("\n");

  return output || fallback;
}

async function importYoutubeAudio(rawUrl, options = {}) {
  let url;
  try {
    url = normalizeYoutubeUrl(rawUrl);
  } catch (error) {
    return { success: false, error: error.message };
  }

  const spawnImpl = options.spawnImpl || spawn;
  const ytowBin = options.ytowBin || resolveYtowBinary();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const verifyExists = options.verifyExists !== false;
  const env = {
    ...process.env,
    PATH: [path.join(os.homedir(), ".local", "bin"), process.env.PATH]
      .filter(Boolean)
      .join(path.delimiter),
  };

  return await new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const child = spawnImpl(ytowBin, [url], {
      env,
      shell: false,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      if (typeof child.kill === "function") child.kill("SIGTERM");
      finish({
        success: false,
        error: "YouTube import timed out. Try a shorter video or run the import again.",
      });
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      const message =
        error.code === "ENOENT"
          ? "YouTube import is not installed. Run the setup once, then restart OpenWhispr."
          : error.message || "YouTube import failed.";
      finish({ success: false, error: message });
    });

    child.on("close", (code) => {
      if (code !== 0) {
        finish({
          success: false,
          error: buildFailureMessage(stdout, stderr, "YouTube import failed."),
        });
        return;
      }

      const { audioPath, promptPath } = parseYtowOutput(stdout);
      if (!audioPath) {
        finish({
          success: false,
          error: buildFailureMessage(
            stdout,
            stderr,
            "YouTube import finished but did not return an audio file."
          ),
        });
        return;
      }

      if (verifyExists && !fs.existsSync(audioPath)) {
        finish({
          success: false,
          error: "YouTube import finished but the audio file was not found.",
        });
        return;
      }

      finish({ success: true, audioPath, promptPath: promptPath || undefined });
    });
  });
}

module.exports = {
  importYoutubeAudio,
  normalizeYoutubeUrl,
  parseYtowOutput,
};
