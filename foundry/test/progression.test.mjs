import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gradeFor, marginTarget, stampsPerSession, commendationSlots, skillCost, skillsCost, skillChange,
  traitSlotPurchase, awardTenure, CREATION_BUDGET, ROMAN
} from "../module/progression.mjs";

test("Grade is 1 + lifetime Tenure earned / 6, capped at X", () => {
  const table = { 0: 1, 5: 1, 6: 2, 11: 2, 12: 3, 18: 4, 24: 5, 30: 6, 36: 7, 42: 8, 48: 9, 54: 10, 200: 10 };
  for (const [earned, grade] of Object.entries(table)) assert.equal(gradeFor(Number(earned)), grade, `${earned} Tenure`);
  assert.equal(ROMAN[gradeFor(12)], "III");
});

test("the spec's Grade table, row by row", () => {
  // Grade: [stamps per session, margin target, commendation slots]
  const spec = {
    1: [2, 7, 0], 2: [2, 7, 1], 3: [3, 7, 1], 4: [3, 6, 1], 5: [3, 6, 2],
    6: [4, 6, 2], 7: [4, 5, 2], 8: [4, 5, 3], 9: [5, 5, 3], 10: [5, 4, 3]
  };
  for (const [grade, [stamps, margin, slots]] of Object.entries(spec)) {
    const g = Number(grade);
    assert.equal(stampsPerSession(g), stamps, `Grade ${g} stamps`);
    assert.equal(marginTarget(g), margin, `Grade ${g} margin`);
    assert.equal(commendationSlots(g), slots, `Grade ${g} commendations`);
  }
});

test("skill costs: 0→1 is 1, 1→2 is 2, 2→3 is 6", () => {
  assert.deepEqual([0, 1, 2, 3].map(skillCost), [0, 1, 3, 9]);
  assert.equal(skillCost(3) - skillCost(2), 6);
});

test("the standard spread (three at 2, three at 1) costs exactly the 12 creation Tenure", () => {
  const spread = { a: 2, b: 2, c: 2, d: 1, e: 1, f: 1, g: 0, h: 0, i: 0, j: 0, k: 0, l: 0, m: 0 };
  assert.equal(skillsCost(spread), CREATION_BUDGET);
});

test("creation: free to rearrange within 12 Tenure, never above 2", () => {
  assert.deepEqual(skillChange({ from: 0, to: 2, creation: true, grade: 1, spent: 0 }), { ok: true, cost: 3 });
  assert.equal(skillChange({ from: 2, to: 3, creation: true, grade: 1, spent: 3 }).reason, "creationMax");
  assert.equal(skillChange({ from: 1, to: 2, creation: true, grade: 1, spent: 11 }).reason, "creationBudget");
  // lowering refunds
  assert.deepEqual(skillChange({ from: 2, to: 1, creation: true, grade: 1, spent: 12 }), { ok: true, cost: -2 });
});

test("play: raising costs unspent Tenure; no refunds", () => {
  assert.deepEqual(skillChange({ from: 0, to: 1, creation: false, grade: 1, unspent: 1 }), { ok: true, cost: 1 });
  assert.equal(skillChange({ from: 1, to: 2, creation: false, grade: 1, unspent: 1 }).reason, "needTenure");
  assert.equal(skillChange({ from: 2, to: 1, creation: false, grade: 3, unspent: 9 }).reason, "noRefund");
});

test("rating 3 is locked below Grade III", () => {
  assert.equal(skillChange({ from: 2, to: 3, creation: false, grade: 2, unspent: 6 }).reason, "needGrade");
  assert.deepEqual(skillChange({ from: 2, to: 3, creation: false, grade: 3, unspent: 6 }), { ok: true, cost: 6 });
  assert.equal(skillChange({ from: 2, to: 3, creation: false, grade: 3, unspent: 5 }).reason, "needTenure");
});

test("the GM can set any rating for free", () => {
  assert.deepEqual(skillChange({ from: 0, to: 3, creation: false, grade: 1, unspent: 0, gm: true }), { ok: true, cost: 0 });
});

test("a new open Trait costs 4, to a maximum of six", () => {
  assert.deepEqual(traitSlotPurchase({ slots: 3, unspent: 4 }), { ok: true, cost: 4 });
  assert.equal(traitSlotPurchase({ slots: 3, unspent: 3 }).reason, "needTenure");
  assert.equal(traitSlotPurchase({ slots: 6, unspent: 99 }).reason, "max");
});

test("awarding Tenure raises earned and unspent, and flags a Grade-up", () => {
  const a = awardTenure({ earned: 4, unspent: 1 }, 2);
  assert.deepEqual([a.earned, a.unspent, a.gradeBefore, a.gradeAfter, a.gradeUp], [6, 3, 1, 2, true]);
  const b = awardTenure({ earned: 6, unspent: 0 }, 3);
  assert.equal(b.gradeUp, false);
  // spending never lowers Grade: Grade follows earned only
  assert.equal(gradeFor(a.earned), 2);
});
