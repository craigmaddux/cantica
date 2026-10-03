import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRoll } from "../module/rules.mjs";
import { cardView, shownOutcome } from "../module/roll-card.mjs";
import { canExpedite, canCountersign, canRaise, canAddDie, addDie, raiseRating, diceOnTable } from "../module/card-actions.mjs";

const t = (key, data) => (data ? `${key} ${JSON.stringify(data)}` : key);

// Margin 8 (hit), whites 9 (hit) and 3 (miss): 2 successes vs D2 = With Conditions.
const baseState = (over = {}) => ({
  actorId: "ilse", actorName: "Ilse Varro", skillLabel: "Hullcraft", difficulty: 2, difficultyText: "D2", sceneId: "", sceneName: "",
  factors: [], notes: [], hindranceNote: "",
  dice: [{ kind: "margin", value: 8, success: true }, { kind: "white", value: 9, success: true }, { kind: "white", value: 3, success: false }],
  outcome: evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 2 }), upgradeConditions: false,
  dissonanceLabel: "", stampNote: false, complication: null,
  targetName: "", extra: [], expedited: false, countersigned: [], ratingRaise: 0, log: [],
  ...over
});

test("Expedite adds one rolled white die after the roll, and the tier follows", () => {
  const state = baseState();
  assert.equal(shownOutcome(state).tier, "conditions");
  const hit = addDie(state, { value: 8, by: "expedite", who: "Ilse" });
  assert.equal(shownOutcome(hit).successes, 3);
  assert.equal(shownOutcome(hit).tier, "approved");
  const miss = addDie(state, { value: 2, by: "expedite", who: "Ilse" });
  assert.equal(shownOutcome(miss).successes, 2);
  assert.equal(diceOnTable(miss), 4);
  // the original state is untouched
  assert.equal(state.extra.length, 0);
});

test("the added die is a white die: it succeeds on 7+", () => {
  const s = baseState();
  assert.equal(addDie(s, { value: 7, by: "expedite", who: "x" }).extra[0].success, true);
  assert.equal(addDie(s, { value: 6, by: "expedite", who: "x" }).extra[0].success, false);
});

test("Expedite is once per roll; Countersign once per ally and never your own", () => {
  const s = baseState();
  assert.equal(canExpedite(s), true);
  const after = addDie(s, { value: 5, by: "expedite", who: "Ilse" });
  assert.equal(canExpedite(after), false);

  assert.equal(canCountersign(s, "ilse"), false);
  assert.equal(canCountersign(s, "deya"), true);
  const signed = addDie(s, { value: 5, by: "countersign", who: "Deya", whoId: "deya" });
  assert.equal(canCountersign(signed, "deya"), false);
  assert.equal(canCountersign(signed, "marguerite"), true);
  // Countersign doesn't use up the roller's own Expedite
  assert.equal(canExpedite(signed), true);
  assert.equal(canCountersign(s, ""), false);
});

test("the pool's cap of 7 dice applies to dice added later", () => {
  const seven = baseState({ dice: Array.from({ length: 7 }, () => ({ kind: "white", value: 1, success: false })) });
  assert.equal(canAddDie(seven), false);
  assert.equal(canExpedite(seven), false);
  assert.equal(canCountersign(seven, "deya"), false);
  const six = baseState({ dice: seven.dice.slice(0, 6) });
  const full = addDie(six, { value: 9, by: "expedite", who: "x" });
  assert.equal(canAddDie(full), false);
});

test("the GM can raise an NPC's Rating by 1 for one roll, once", () => {
  const vs = baseState({ targetName: "Proctor Halvard", difficulty: 1, outcome: evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 1 }) });
  assert.equal(shownOutcome(vs).tier, "approved");
  assert.equal(canRaise(vs), true);
  const raised = raiseRating(vs);
  assert.equal(shownOutcome(raised).difficulty, 2);
  assert.equal(shownOutcome(raised).tier, "conditions");
  assert.equal(canRaise(raised), false);
  assert.equal(cardView(raised, t).difficulty, 2);
});

test("there is no Rating to raise on a roll against a ladder Difficulty", () => {
  assert.equal(canRaise(baseState()), false);
  assert.equal(cardView(baseState(), t).canRaise, false);
});

test("added dice, a raised Rating and the Complication all combine, in order", () => {
  // 2 successes vs D1 = approved. Add a hit: 3 (commended). Raise: D2, 3 is approved. Complicate: 2, conditions.
  let s = baseState({ difficulty: 1, targetName: "Halvard", outcome: evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 1 }) });
  s = addDie(s, { value: 9, by: "expedite", who: "Ilse" });
  assert.equal(shownOutcome(s).tier, "commended");
  s = raiseRating(s);
  assert.equal(shownOutcome(s).tier, "approved");
  s = { ...s, complication: { trait: "Steam Everywhere", negated: false } };
  const view = cardView(s, t);
  assert.equal(view.successes, 2);
  assert.equal(view.wasSuccesses, 3);
  assert.equal(view.outcome.tier, "conditions");
  // negating the Complication restores everything done before it, not the original roll
  const negated = cardView({ ...s, complication: { trait: "Steam Everywhere", negated: true } }, t);
  assert.equal(negated.successes, 3);
  assert.equal(negated.outcome.tier, "approved");
});

test("a Commendation's With Conditions → Approved still applies after dice are added", () => {
  const s = baseState({ upgradeConditions: true, dice: baseState().dice, outcome: evaluateRoll({ margin: 8, white: [3, 3] }, { difficulty: 1, upgradeConditions: true }) });
  assert.equal(shownOutcome(s).tier, "approved");
  const missed = addDie(s, { value: 2, by: "expedite", who: "x" });
  assert.equal(shownOutcome(missed).tier, "approved");
});

test("the card shows the added dice and says what was done", () => {
  let s = baseState();
  s = addDie(s, { value: 9, by: "expedite", who: "Ilse" });
  s = addDie(s, { value: 4, by: "countersign", who: "Deya", whoId: "deya" });
  s = raiseRating({ ...s, targetName: "Halvard" });
  const view = cardView(s, t);
  assert.equal(view.dice.length, 5);
  assert.equal(view.dice.filter(d => d.extra).length, 2);
  assert.deepEqual(view.actions.map(a => a.kind), ["expedite", "countersign", "raise"]);
  assert.ok(view.actions[1].text.includes("Deya"));
});

test("the card knows which actions are still open", () => {
  const view = cardView(baseState(), t);
  assert.equal(view.canExpedite, true);
  assert.equal(view.canCountersign, true);
  const used = cardView(addDie(baseState(), { value: 1, by: "expedite", who: "x" }), t);
  assert.equal(used.canExpedite, false);
  assert.equal(used.canCountersign, true);
});

test("cards saved before v0.8.1 (no extra dice, no log) still draw", () => {
  const old = baseState();
  delete old.extra; delete old.log; delete old.ratingRaise; delete old.countersigned; delete old.expedited; delete old.targetName; delete old.actorId;
  const view = cardView(old, t);
  assert.equal(view.successes, 2);
  assert.equal(view.dice.length, 3);
  assert.deepEqual(view.actions, []);
});
