import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENARIO } from "../module/scenarios/hurting-on-deck-22.mjs";
import { NPC_TIERS } from "../module/config.mjs";

test("Hurting on Deck 22 has the GM Primer's nine people and seven places", () => {
  assert.equal(SCENARIO.npcs.length, 9);
  assert.equal(SCENARIO.places.length, 7);
  assert.equal(new Set([...SCENARIO.npcs, ...SCENARIO.places].map(x => x.key)).size, 16);
});

test("every person has a Rating 1-3 and a Tier, and the Tags the Primer's tiers allow", () => {
  for (const npc of SCENARIO.npcs) {
    assert.ok(npc.rating >= 1 && npc.rating <= 3, `${npc.key} rating`);
    assert.ok(NPC_TIERS.includes(npc.tier), `${npc.key} tier`);
    // Background and Minor have two Tags; a Major has three (Wen is never rolled against and has none).
    const max = npc.tier === "major" ? 3 : 2;
    assert.ok(npc.tags.length <= max, `${npc.key} has at most ${max} Tags`);
    if (npc.key !== "wen") assert.equal(npc.tags.length, max, `${npc.key} has exactly ${max} Tags`);
    assert.ok(npc.notes.length > 10, `${npc.key} notes`);
    if (npc.action) assert.ok(npc.action >= 1 && npc.action <= npc.tags.length, `${npc.key} action Tag`);
  }
});

test("the people the Primer names have the stat blocks it gives", () => {
  const by = Object.fromEntries(SCENARIO.npcs.map(n => [n.key, n]));
  assert.deepEqual([by["odette-brannagh"].rating, by["odette-brannagh"].tier], [2, "major"]);
  assert.deepEqual([by["tamsin-voy"].rating, by["tamsin-voy"].tier], [2, "minor"]);
  assert.deepEqual([by["residents-22c"].rating, by["residents-22c"].tier], [1, "background"]);
  assert.deepEqual(by["proctor-halvard"].tags, ["Knows Every Regulation", "Tired of Your Nonsense"]);
});

test("each place has two or three scene Traits", () => {
  for (const place of SCENARIO.places) {
    assert.ok(place.traits.length >= 2 && place.traits.length <= 3, place.key);
    assert.ok(place.description.length > 20, `${place.key} description`);
  }
});

test("the GM's journal covers the setup, the opening, the beats, the Clause and the notes", () => {
  const names = SCENARIO.journal.map(p => p.name);
  for (const wanted of ["The setup", "Opening the session", "Four beats", "The Clause, and how it ends", "Playtest notes"]) assert.ok(names.includes(wanted), wanted);
  for (const page of SCENARIO.journal) assert.ok(page.html.length > 100, page.name);
});
