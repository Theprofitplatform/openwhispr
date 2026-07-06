const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("SEO Radar renderer API methods are exposed and typed", () => {
  const preload = read("preload.js");
  const types = read("src/types/electron.ts");
  for (const method of [
    "seoRadarGetConfig",
    "seoRadarSetConfig",
    "seoRadarSaveYouTubeKey",
    "seoRadarHasYouTubeKey",
    "seoRadarRunNow",
  ]) {
    assert.match(preload, new RegExp(`${method}:`));
    assert.match(types, new RegExp(`${method}:`));
  }
});

test("SEO Radar IPC handlers and secure env key are registered", () => {
  const ipcHandlers = read("src/helpers/ipcHandlers.js");
  const environment = read("src/helpers/environment.js");
  for (const channel of [
    "seo-radar-get-config",
    "seo-radar-set-config",
    "seo-radar-save-youtube-key",
    "seo-radar-has-youtube-key",
    "seo-radar-run-now",
  ]) {
    assert.match(ipcHandlers, new RegExp(channel));
  }
  assert.match(environment, /YOUTUBE_DATA_API_KEY/);
  assert.match(environment, /saveYouTubeDataApiKey/);
  assert.match(environment, /getYouTubeDataApiKey/);
});
