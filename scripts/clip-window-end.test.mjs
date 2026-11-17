import test from "node:test";
import assert from "node:assert/strict";
import { clipWindow } from "../lib/ai-reel-export.mjs";
test("clip window keeps only the chosen part of a long video", () => {
  assert.deepEqual(clipWindow(77, 40, 52), { start: 40, duration: 12 });
  assert.deepEqual(clipWindow(15, 0.6), { start: 0.6, duration: 14.4 });
  assert.deepEqual(clipWindow(15, 0.6, 0), { start: 0.6, duration: 14.4 });
  assert.deepEqual(clipWindow(15, 2, 40), { start: 2, duration: 13 });
  assert.equal(clipWindow(15, 5, 3).duration, 0.25);
});
