import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { SKILLS } from "../module/config.mjs";
import { skillsCost, CREATION_BUDGET } from "../module/progression.mjs";
import { RULE_BREAKS } from "../module/rules.mjs";
import { findBrief, briefSkills, suggestionsFor, giftFor, commendationSuggestion } from "../module/briefs.mjs";

// Load the real data, exactly as the website and the system do.
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../../station-briefs-data.js", import.meta.url), "utf8"), ctx);
const BRIEFS = Array.from(ctx.window.STATION_BRIEFS);

test("there are ten Briefs with unique ids and all their parts", () => {
  assert.equal(BRIEFS.length, 10);
  assert.equal(new Set(BRIEFS.map(b => b.id)).size, BRIEFS.length);
  for (const b of BRIEFS) {
    for (const field of ["id", "name", "greeting", "tagline", "blurb", "gift", "drawback", "shine"]) assert.ok(b[field], `${b.id} has ${field}`);
    assert.equal(b.traits.length, 3, `${b.id} has three Traits`);
    assert.equal(b.hindrances.length, 2, `${b.id} has two Hindrances`);
  }
});

test("every Brief's skills are the standard spread, costing exactly the 15 creation Tenure", () => {
  for (const b of BRIEFS) {
    const skills = briefSkills(b);
    assert.deepEqual(Object.keys(skills).sort(), [...SKILLS].sort(), `${b.id} covers every skill`);
    const ratings = Object.values(skills).filter(r => r > 0).sort();
    assert.deepEqual(ratings, [1, 1, 1, 2, 2, 2], `${b.id} is three at 2 and three at 1`);
    assert.equal(skillsCost(skills), CREATION_BUDGET, `${b.id} costs the whole budget`);
  }
});

test("a Brief names no skill that doesn't exist", () => {
  for (const b of BRIEFS) for (const key of Object.keys(b.skills)) assert.ok(SKILLS.includes(key), `${b.id}: ${key}`);
});

test("each suggested Commendation is complete and uses a real rule-break", () => {
  for (const b of BRIEFS) {
    const c = b.commendation;
    assert.ok(c.name && c.situation.startsWith("when ") && c.effect, b.id);
    assert.ok(RULE_BREAKS.includes(c.ruleBreak), `${b.id}: ${c.ruleBreak}`);
  }
});

test("the Commendation's wording matches its rule-break", () => {
  const words = {
    conditions: /with conditions becomes approved/i, difficulty: /difficulty is one lower/i, obstacle: /ignore one obstacle/i,
    trait2: /second trait also applies/i, dissonance: /violet 1 doesn't cause dissonance/i, impossible: /normally impossible/i
  };
  for (const b of BRIEFS) assert.match(b.commendation.effect, words[b.commendation.ruleBreak], b.id);
});

test("a Brief offers no phrase twice", () => {
  for (const b of BRIEFS) {
    const all = [...b.traits, ...b.hindrances, b.gift, b.drawback];
    assert.equal(new Set(all).size, all.length, b.id);
  }
});

test("finding a Brief, and what it suggests", () => {
  const eng = findBrief("engineering", BRIEFS);
  assert.equal(eng.name, "Engineering");
  assert.equal(findBrief("", BRIEFS), null);
  assert.equal(findBrief("nope", BRIEFS), null);
  assert.deepEqual(suggestionsFor("traits", eng), eng.traits);
  assert.deepEqual(suggestionsFor("personal", eng), [eng.hindrances[0]]);
  assert.deepEqual(suggestionsFor("circumstantial", eng), [eng.hindrances[1]]);
  assert.deepEqual(suggestionsFor("traits", null), []);
  assert.deepEqual(giftFor(eng), { gift: "Machines Hum My Name", drawback: "Hears Them When They're Hurting" });
  assert.equal(giftFor(null), null);
});

test("the Commendation is offered once, and not again after it is taken", () => {
  const eng = findBrief("engineering", BRIEFS);
  const s = commendationSuggestion(eng, []);
  assert.equal(s.name, "Never Misses a Rivet");
  assert.equal(s.ruleBreak, "conditions");
  assert.equal(commendationSuggestion(eng, [{ name: "never misses a rivet" }]), null);
  assert.ok(commendationSuggestion(eng, [{ name: "Something Else" }]));
  assert.equal(commendationSuggestion(null, []), null);
});
