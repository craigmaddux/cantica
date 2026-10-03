import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyTrack, placeNotice, clearMinors, slotsFor, isFilled } from "../module/notices.mjs";

const minor = (track, name = "Bruised Ribs", tier = "major") => placeNotice(track, tier, "minor", { name, type: "B" });
const major = (track, name = "Cracked Wrist", tier = "major") => placeNotice(track, tier, "major", { name, type: "B" });

test("Minor Notices fill the two Minor boxes in order", () => {
  const a = minor(emptyTrack(), "Flustered");
  assert.equal(a.slot, "minor1");
  const b = minor(a.track, "Smitten");
  assert.equal(b.slot, "minor2");
  assert.equal(b.overflowed, false);
});

test("overflow: a third Minor becomes a Major; the next hit is Final", () => {
  let t = minor(emptyTrack()).track;
  t = minor(t).track;
  const third = minor(t, "Doubt");
  assert.equal(third.slot, "major");
  assert.equal(third.overflowed, true);
  const fourth = minor(third.track, "Shaken");
  assert.equal(fourth.slot, "final");
  assert.equal(fourth.out, true);
});

test("a Major goes to the Major box, then Final", () => {
  const a = major(emptyTrack());
  assert.equal(a.slot, "major");
  const b = major(a.track, "Broken Arm");
  assert.equal(b.slot, "final");
  assert.equal(b.out, true);
});

test("Notices carry a type, defaulting to Body", () => {
  const r = placeNotice(emptyTrack(), "major", "minor", { name: "Smitten", type: "S" });
  assert.equal(r.track.minor1.type, "S");
  assert.equal(placeNotice(emptyTrack(), "major", "minor", { name: "x", type: "?" }).track.minor1.type, "B");
});

test("Background NPCs: any Notice takes them out", () => {
  assert.equal(minor(emptyTrack(), "Scuffed", "background").slot, "final");
  assert.equal(major(emptyTrack(), "Scuffed", "background").slot, "final");
});

test("Minor NPCs: one Minor box; the next Notice, or any Major, takes them out", () => {
  const first = minor(emptyTrack(), "Rattled", "minor");
  assert.equal(first.slot, "minor1");
  assert.equal(minor(first.track, "Again", "minor").slot, "final");
  assert.equal(major(emptyTrack(), "Hurt", "minor").slot, "final");
});

test("visible boxes per tier", () => {
  assert.deepEqual(slotsFor("background"), ["final"]);
  assert.deepEqual(slotsFor("minor"), ["minor1", "final"]);
  assert.deepEqual(slotsFor("major"), ["minor1", "minor2", "major", "final"]);
});

test("end of session clears Minors only", () => {
  let t = minor(emptyTrack()).track;
  t = minor(t).track;
  t = minor(t, "Doubt").track; // lands in Major
  const cleared = clearMinors(t);
  assert.equal(isFilled(cleared.minor1), false);
  assert.equal(isFilled(cleared.minor2), false);
  assert.equal(isFilled(cleared.major), true);
});

test("placing never mutates the original track", () => {
  const original = emptyTrack();
  minor(original);
  assert.equal(isFilled(original.minor1), false);
});
