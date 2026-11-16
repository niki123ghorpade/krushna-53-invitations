import test from "node:test";
import assert from "node:assert/strict";
import { parseSongTime, formatSongTime } from "../lib/song-time.mjs";
test("song end accepts minutes:seconds, minutes.seconds and plain seconds", () => {
  assert.equal(parseSongTime("1:07"), 67);
  assert.equal(parseSongTime("1.07"), 67);
  assert.equal(parseSongTime("1.06"), 66);
  assert.equal(parseSongTime("67"), 67);
  assert.equal(parseSongTime("12.5"), 12.5);
  assert.equal(parseSongTime(""), 0);
  assert.equal(parseSongTime("abc"), 0);
  assert.equal(formatSongTime(66), "1:06");
});
