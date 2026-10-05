import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRoll } from "../module/rules.mjs";
import { cardView, shownOutcome } from "../module/roll-card.mjs";
import { canRaise, canAddDie, canRefile, failedWhiteDie, refile, raiseRating, diceOnTable } from "../module/card-actions.mjs";

const t = (key, data) => (data ? `${key} ${JSON.stringify(data)}` : key);

// Cards made in v0.8.1 could carry a die added by a Countersign. They must still read correctly.
const withExtra = (state, value) => ({ ...state, extra: [...(state.extra ?? []), { kind: "white", value, success: value >= 7, extra: true, by: "countersign" }] });

// Margin 8 (hit), whites 9 (hit) and 3 (miss): 2 successes vs D2 = With Conditions.
const baseState = (over = {}) => ({
  actorId: "ilse", actorName: "Ilse Varro", skillLabel: "Hullcraft", difficulty: 2, difficultyText: "D2", sceneId: "", sceneName: "",
  factors: [], notes: [], hindranceNote: "",
  dice: [{ kind: "margin", value: 8, success: true }, { kind: "white", value: 9, success: true }, { kind: "white", value: 3, success: false }],
  outcome: evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 2 }), upgradeConditions: false,
  dissonanceLabel: "", stampNote: false, complication: null,
  targetName: "", extra: [], refiled: false, refileGain: 0, countersigned: [], ratingRaise: 0, log: [],
  ...over
});

/* ── Refile ── */

test("Refile rerolls one failed white die in place; a hit adds a success and the tier follows", () => {
  const state = baseState();
  assert.equal(shownOutcome(state).tier, "conditions");
  const hit = refile(state, { value: 8, who: "Ilse" });
  assert.equal(hit.dice[2].value, 8);
  assert.equal(hit.dice[2].was, 3);
  assert.equal(hit.dice[2].success, true);
  assert.equal(shownOutcome(hit).successes, 3);
  assert.equal(shownOutcome(hit).tier, "approved");
  // the original state is untouched
  assert.equal(state.dice[2].value, 3);
  assert.equal(state.refiled, false);
});

test("a Refile that misses changes nothing but the die, and the Stamp is gone", () => {
  const miss = refile(baseState(), { value: 2, who: "Ilse" });
  assert.equal(miss.dice[2].value, 2);
  assert.equal(shownOutcome(miss).successes, 2);
  assert.equal(miss.refiled, true);
  assert.equal(canRefile(miss), false);
});

test("Refile is once per roll", () => {
  const s = baseState({ dice: [{ kind: "margin", value: 8, success: true }, { kind: "white", value: 1, success: false }, { kind: "white", value: 2, success: false }] });
  const once = refile(s, { value: 1, who: "x" });
  assert.equal(canRefile(once), false);
  assert.equal(refile(once, { value: 9, who: "x" }), once);
});

test("only a failed white die can be refiled: not the Margin, not a violet die, not a hit", () => {
  const none = baseState({ dice: [{ kind: "margin", value: 2, success: false, flag: "error" }, { kind: "violet", value: 1, success: false, flag: "dissonance" }, { kind: "white", value: 9, success: true }] });
  assert.equal(failedWhiteDie(none), null);
  assert.equal(canRefile(none), false);
  assert.equal(refile(none, { value: 9, who: "x" }), none);
  assert.equal(cardView(none, t).canRefile, false);
});

test("Refile takes the first failed die rolled, then an added one", () => {
  const s = baseState();
  assert.deepEqual(failedWhiteDie(s), { list: "dice", index: 2 });
  // no failed die among those rolled: an added die that failed is eligible
  const added = withExtra(baseState({ dice: baseState().dice.slice(0, 2) }), 4);
  assert.deepEqual(failedWhiteDie(added), { list: "extra", index: 0 });
  const refiled = refile(added, { value: 9, who: "Ilse" });
  // the added die was already counted by its own result, so a hit there is one success, not two
  assert.equal(refiled.refileGain, 0);
  assert.equal(shownOutcome(refiled).successes, 3);
});

test("the cap of 7 doesn't stop a Refile, which replaces a die", () => {
  const seven = baseState({ dice: [{ kind: "margin", value: 8, success: true }, ...Array.from({ length: 6 }, () => ({ kind: "white", value: 1, success: false }))] });
  assert.equal(canAddDie(seven), false);
  assert.equal(canRefile(seven), true);
  assert.equal(diceOnTable(refile(seven, { value: 9, who: "x" })), 7);
});

/* ── Raise the Rating ── */

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

/* ── together ── */

test("a Refile, a Countersign, a raised Rating and the Complication combine, in order", () => {
  // 2 successes vs D1 = approved. Refile hits: 3 (commended). Raise: D2, 3 is approved. Complicate: 2, conditions.
  let s = baseState({ difficulty: 1, targetName: "Halvard", outcome: evaluateRoll({ margin: 8, white: [9, 3] }, { difficulty: 1 }) });
  s = refile(s, { value: 9, who: "Ilse" });
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

test("a Commendation's With Conditions → Approved still applies after a die changes", () => {
  const s = baseState({ upgradeConditions: true, outcome: evaluateRoll({ margin: 8, white: [3, 3] }, { difficulty: 1, upgradeConditions: true }),
    dice: [{ kind: "margin", value: 8, success: true }, { kind: "white", value: 3, success: false }, { kind: "white", value: 3, success: false }] });
  assert.equal(shownOutcome(s).tier, "approved");
  assert.equal(shownOutcome(refile(s, { value: 2, who: "x" })).tier, "approved");
});

test("the card shows the changed and legacy added dice and says what was done", () => {
  let s = baseState();
  s = refile(s, { value: 9, who: "Ilse" });
  s = withExtra(s, 4);
  s = raiseRating({ ...s, targetName: "Halvard" });
  const view = cardView(s, t);
  assert.equal(view.dice.length, 4);
  assert.equal(view.dice.filter(d => d.extra).length, 1);
  assert.equal(view.dice.filter(d => d.refiled).length, 1);
  assert.deepEqual(view.actions.map(a => a.kind), ["refile", "raise"]);
  assert.ok(view.actions[0].text.includes('"was":3'));
});

test("the card knows which actions are still open", () => {
  const view = cardView(baseState(), t);
  assert.equal(view.canRefile, true);
  const used = cardView(refile(baseState(), { value: 1, who: "x" }), t);
  assert.equal(used.canRefile, false);
});

test("cards saved before v0.9.1 (no refile fields) still draw", () => {
  const old = baseState();
  for (const k of ["extra", "log", "ratingRaise", "countersigned", "refiled", "refileGain", "targetName", "actorId"]) delete old[k];
  const view = cardView(old, t);
  assert.equal(view.successes, 2);
  assert.equal(view.dice.length, 3);
  assert.deepEqual(view.actions, []);
  assert.equal(view.canRefile, true);
});
