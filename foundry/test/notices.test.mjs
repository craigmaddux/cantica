import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyTrack, placeNotice, clearMinors, slotsFor, isFilled, minorsFull, defaultClearsBy, migrateTrack, slotKind
} from "../module/notices.mjs";

const minor = (track, name = "Bruised Ribs", tier = "major", type = "B") => placeNotice(track, tier, "minor", { name, type });
const major = (track, name = "Cracked Wrist", tier = "major", type = "B") => placeNotice(track, tier, "major", { name, type });

/** Fill the three Minor boxes. */
const withMinors = () => {
  let t = emptyTrack();
  for (const n of ["One", "Two", "Three"]) t = minor(t, n).track;
  return t;
};

test("Minor Notices fill the three Minor boxes in order", () => {
  const a = minor(emptyTrack(), "Flustered");
  assert.equal(a.slot, "minor1");
  const b = minor(a.track, "Smitten");
  assert.equal(b.slot, "minor2");
  const c = minor(b.track, "Winded");
  assert.equal(c.slot, "minor3");
  assert.equal(c.overflowed, false);
});

test("overflow: with all three Minors full, a Minor becomes a Major", () => {
  const t = withMinors();
  assert.equal(minorsFull(t, "major"), true);
  const fourth = minor(t, "Doubt");
  assert.equal(fourth.slot, "major1");
  assert.equal(fourth.overflowed, true);
});

test("overflow: with both Major boxes full, the next hit is Final", () => {
  let t = major(emptyTrack(), "Cracked Wrist").track;
  assert.equal(major(t, "Broken Arm").slot, "major2");
  t = major(t, "Broken Arm").track;
  const next = major(t, "Concussion");
  assert.equal(next.slot, "final");
  assert.equal(next.out, true);
  // a Minor with everything full also ends in Final
  let full = withMinors();
  full = minor(full, "x").track;
  full = minor(full, "y").track;
  assert.equal(minor(full, "z").slot, "final");
});

test("Notices carry a type, defaulting to Body", () => {
  const r = placeNotice(emptyTrack(), "major", "minor", { name: "Smitten", type: "S" });
  assert.equal(r.track.minor1.type, "S");
  assert.equal(placeNotice(emptyTrack(), "major", "minor", { name: "x", type: "?" }).track.minor1.type, "B");
});

test("clears-by defaults by severity and type, and can be written over", () => {
  assert.equal(defaultClearsBy("minor", "B"), "end of session");
  assert.equal(defaultClearsBy("minor", "S"), "end of session");
  assert.equal(defaultClearsBy("major", "B"), "treatment");
  assert.equal(defaultClearsBy("major", "S"), "a scene with another person");

  assert.equal(minor(emptyTrack(), "Flustered").track.minor1.clearsBy, "end of session");
  assert.equal(major(emptyTrack(), "Cracked Wrist").track.major1.clearsBy, "treatment");
  assert.equal(major(emptyTrack(), "Doubt", "major", "S").track.major1.clearsBy, "a scene with another person");

  const custom = placeNotice(emptyTrack(), "major", "major", { name: "Doubt", type: "S", clearsBy: "talk it through with Marguerite" });
  assert.equal(custom.track.major1.clearsBy, "talk it through with Marguerite");
});

test("an escalated Minor takes the clears-by of a Major", () => {
  const escalated = minor(withMinors(), "Doubt", "major", "S");
  assert.equal(escalated.track.major1.clearsBy, "a scene with another person");
});

test("Background NPCs: any Notice takes them out", () => {
  assert.equal(minor(emptyTrack(), "Scuffed", "background").slot, "final");
  assert.equal(major(emptyTrack(), "Scuffed", "background").slot, "final");
});

test("Minor NPCs are unchanged: one Minor box; the next Notice, or any Major, takes them out", () => {
  const first = minor(emptyTrack(), "Rattled", "minor");
  assert.equal(first.slot, "minor1");
  assert.equal(minor(first.track, "Again", "minor").slot, "final");
  assert.equal(major(emptyTrack(), "Hurt", "minor").slot, "final");
  assert.equal(minorsFull(first.track, "minor"), true);
});

test("visible boxes per tier", () => {
  assert.deepEqual(slotsFor("background"), ["final"]);
  assert.deepEqual(slotsFor("minor"), ["minor1", "final"]);
  assert.deepEqual(slotsFor("major"), ["minor1", "minor2", "minor3", "major1", "major2", "final"]);
});

test("slot kinds", () => {
  assert.deepEqual(["minor2", "major2", "final"].map(slotKind), ["minor", "major", "final"]);
});

test("end of session clears Minors only", () => {
  let t = withMinors();
  t = minor(t, "Doubt").track; // lands in Major
  const cleared = clearMinors(t);
  for (const slot of ["minor1", "minor2", "minor3"]) assert.equal(isFilled(cleared[slot]), false);
  assert.equal(isFilled(cleared.major1), true);
});

test("placing never mutates the original track", () => {
  const original = emptyTrack();
  minor(original);
  assert.equal(isFilled(original.minor1), false);
});

test("v0.2 tracks migrate: major becomes major1", () => {
  const migrated = migrateTrack({ minor1: { name: "a", type: "B" }, minor2: { name: "", type: "B" }, major: { name: "Cracked Wrist", type: "B" }, final: { name: "", type: "B" } });
  assert.equal(migrated.major1.name, "Cracked Wrist");
  assert.equal("major" in migrated, false);
  assert.equal(migrateTrack({ major1: { name: "x" }, major: { name: "y" } }).major1.name, "x");
});
