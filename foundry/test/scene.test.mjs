import { test } from "node:test";
import assert from "node:assert/strict";
import { containsPoint, pickCard, newTrait, sceneTraitDice, firstScene, SCENE_TRAIT_DICE } from "../module/scene.mjs";
import { buildPool, evaluateRoll, reduceSuccesses } from "../module/rules.mjs";
import { cardView, shownOutcome } from "../module/roll-card.mjs";

const room = { id: "engine", x: 0, y: 0, w: 400, h: 300, sort: -1000 };
const corner = { id: "locker", x: 300, y: 200, w: 100, h: 100, sort: -999 };

test("a point inside a card is on it; edges count", () => {
  assert.equal(containsPoint(room, { x: 200, y: 150 }), true);
  assert.equal(containsPoint(room, { x: 0, y: 0 }), true);
  assert.equal(containsPoint(room, { x: 400, y: 300 }), true);
  assert.equal(containsPoint(room, { x: 401, y: 150 }), false);
});

test("pickCard finds the card under a token", () => {
  assert.equal(pickCard({ x: 50, y: 50 }, [room, corner]), "engine");
  assert.equal(pickCard({ x: 900, y: 900 }, [room, corner]), null);
  assert.equal(pickCard({ x: 50, y: 50 }, []), null);
});

test("overlapping cards: the smaller, more specific one wins", () => {
  assert.equal(pickCard({ x: 350, y: 250 }, [room, corner]), "locker");
  assert.equal(pickCard({ x: 350, y: 250 }, [corner, room]), "locker");
});

test("equal-size overlap falls to the card on top", () => {
  const a = { id: "a", x: 0, y: 0, w: 100, h: 100, sort: -1000 };
  const b = { id: "b", x: 0, y: 0, w: 100, h: 100, sort: -990 };
  assert.equal(pickCard({ x: 10, y: 10 }, [a, b]), "b");
});

test("scene Traits are just Traits: a phrase and an optional note", () => {
  assert.deepEqual(newTrait({ id: "1", name: "  Steam Everywhere  " }), { id: "1", name: "Steam Everywhere", note: "" });
  assert.deepEqual(newTrait({ id: "2", name: "Spare Coupling", note: " in the locker " }), { id: "2", name: "Spare Coupling", note: "in the locker" });
  assert.equal("effect" in newTrait({ id: "3", name: "x" }), false);
});

test("only one scene Trait can be added to a roll, for +1 die", () => {
  assert.equal(sceneTraitDice(null), 0);
  assert.equal(sceneTraitDice({ name: "Steam" }), SCENE_TRAIT_DICE);
  assert.equal(SCENE_TRAIT_DICE, 1);
  assert.deepEqual(firstScene([{ name: "A" }, { name: "B" }]), { name: "A" });
  assert.equal(firstScene([]), null);
  assert.equal(firstScene(null), null);
  // and it adds one die to the pool like any Circumstance
  assert.equal(buildPool({ skill: 2, circumstances: sceneTraitDice({ name: "Steam" }) }).total, 4);
});

/* ── the GM's Complication, and the player's Negate ── */

test("a Complication takes one success and the tier follows", () => {
  const out = evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 1 }); // 2 successes: Approved
  assert.equal(out.tier, "approved");
  const hit = reduceSuccesses(out);
  assert.equal(hit.successes, 1);
  assert.equal(hit.tier, "conditions");
  assert.equal(hit.reducedBy, 1);
});

test("a Complication can't go below zero successes", () => {
  const out = evaluateRoll({ margin: 2, white: [3] }, { difficulty: 1 });
  const hit = reduceSuccesses(out);
  assert.equal(hit.successes, 0);
  assert.equal(hit.tier, "denied");
  assert.equal(hit.reducedBy, 0);
});

test("a Complication keeps a Commendation's With Conditions → Approved", () => {
  const out = evaluateRoll({ margin: 8, white: [9] }, { difficulty: 1, upgradeConditions: true }); // 2: Approved
  const hit = reduceSuccesses(out, 1, { upgradeConditions: true }); // 1 = conditions → upgraded
  assert.equal(hit.tier, "approved");
});

const baseState = () => ({
  actorName: "Ilse", skillLabel: "Hullcraft", difficulty: 1, difficultyText: "D1", sceneId: "engine", sceneName: "Engine Room",
  factors: [], notes: [], hindranceNote: "", dice: [], upgradeConditions: false,
  outcome: evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 1 }), resonanceLabel: "", stampNote: false, complication: null
});
const t = (key, data) => `${key}${data ? JSON.stringify(data) : ""}`;

test("the card before a Complication", () => {
  const view = cardView(baseState(), t);
  assert.equal(view.successes, 2);
  assert.equal(view.wasSuccesses, null);
  assert.equal(view.canComplicate, true);
  assert.equal(view.canNegate, false);
  assert.equal(view.complication, null);
});

test("the card after the GM complicates it: fewer successes, a Negate button, no second Complication", () => {
  const state = { ...baseState(), complication: { trait: "Steam Everywhere", negated: false } };
  const view = cardView(state, t);
  assert.equal(view.successes, 1);
  assert.equal(view.wasSuccesses, 2);
  assert.equal(view.outcome.tier, "conditions");
  assert.equal(view.canComplicate, false);
  assert.equal(view.canNegate, true);
  assert.ok(view.complication.text.includes("Steam Everywhere"));
});

test("a Stamp negates it: the original outcome returns and nothing more can be done", () => {
  const state = { ...baseState(), complication: { trait: "Steam Everywhere", negated: true } };
  const view = cardView(state, t);
  assert.equal(view.successes, 2);
  assert.equal(view.outcome.tier, "approved");
  assert.equal(view.wasSuccesses, null);
  assert.equal(view.canNegate, false);
  assert.equal(view.canComplicate, false);
  assert.equal(shownOutcome(state).successes, 2);
});

test("a roll made outside any scene can't be complicated", () => {
  assert.equal(cardView({ ...baseState(), sceneId: "" }, t).canComplicate, false);
});
