import { test } from "node:test";
import assert from "node:assert/strict";
import { bandFor, widensDissonance, humFromRoll, changeHum, HUM_MAX } from "../module/hum.mjs";

test("the Hum's bands, edge by edge (spec v0.8)", () => {
  const table = { 0: "still", 4: "still", 5: "murmur", 9: "murmur", 10: "refrain", 14: "refrain", 15: "swell", 19: "swell", 20: "gives" };
  for (const [hum, band] of Object.entries(table)) assert.equal(bandFor(Number(hum)).key, band, `Hum ${hum}`);
});

test("from the Refrain, every violet die causes Dissonance on 1-2", () => {
  assert.equal(widensDissonance(9), false);
  assert.equal(widensDissonance(10), true);
  assert.equal(widensDissonance(19), true);
});

test("each Dissonance adds 1 to the Hum, always", () => {
  assert.equal(humFromRoll(0), 0);
  assert.equal(humFromRoll(3), 3);
  assert.equal(humFromRoll(2), 2);
  assert.equal(humFromRoll(-1), 0);
});

test("changing the Hum reports the band crossed, and stays between 0 and 20", () => {
  const into = changeHum(4, 1);
  assert.deepEqual([into.value, into.band, into.crossed, into.gives], [5, "murmur", "murmur", false]);
  const inside = changeHum(5, 2);
  assert.equal(inside.crossed, null);
  // skipping a band reports the one it landed in
  assert.equal(changeHum(8, 4).crossed, "refrain");
  assert.equal(changeHum(0, -3).value, 0);
});

test("reaching 20 means something gives, once", () => {
  const gives = changeHum(19, 1);
  assert.deepEqual([gives.value, gives.band, gives.gives], [HUM_MAX, "gives", true]);
  assert.equal(changeHum(18, 9).value, HUM_MAX);
  assert.equal(changeHum(20, 1).gives, false);
  // lowering is allowed (the GM's call), and crossing downward is not reported as a new band
  const down = changeHum(12, -4);
  assert.deepEqual([down.value, down.crossed], [8, null]);
});
