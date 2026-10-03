import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPool, evaluateRoll } from "../module/rules.mjs";

test("Margin alone: Skill 0 still rolls one die", () => {
  const p = buildPool({});
  assert.deepEqual([p.total, p.margin, p.white, p.violet], [1, 1, 0, 0]);
});

test("pool is floored at the Margin when obstacles outweigh everything", () => {
  const p = buildPool({ skill: 1, obstacles: 5 });
  assert.equal(p.total, 1);
  assert.equal(p.floored, true);
});

test("pool is capped at 7", () => {
  const p = buildPool({ skill: 3, traits: 3, circumstances: 4 });
  assert.equal(p.total, 7);
  assert.equal(p.capped, true);
  assert.equal(p.white, 6);
});

test("Ilse Varro: Margin + Hullcraft 3 + Station + Gift = 6 dice, two violet", () => {
  const p = buildPool({ skill: 3, traits: 1, gift: true });
  assert.equal(p.total, 6);
  assert.equal(p.violet, 2);
  assert.equal(p.white, 3);
  assert.equal(p.margin, 1);
});

test("violet replaces white; it never adds to the count", () => {
  const p = buildPool({ skill: 1, bound: 2 });
  assert.equal(p.total, 2);
  assert.equal(p.violet, 1); // only one colorable die besides the Margin
  assert.equal(p.white, 0);
});

test("the Margin can never be violet", () => {
  const p = buildPool({ gift: true, bound: 9 });
  assert.equal(p.total, 2);
  assert.equal(p.margin, 1);
  assert.equal(p.violet, 1);
});

test("successes: white and Margin 7+, violet 6+", () => {
  const r = evaluateRoll({ margin: 7, white: [6, 7], violet: [5, 6] }, { difficulty: 2 });
  assert.equal(r.successes, 3);
  assert.equal(r.tier, "commended");
});

test("result tiers", () => {
  const roll = (margin, white) => evaluateRoll({ margin, white }, { difficulty: 3 });
  assert.equal(roll(2, [3, 4]).tier, "denied");
  assert.equal(roll(8, [3]).tier, "conditions");
  assert.equal(roll(8, [3]).shortBy, 2);
  assert.equal(roll(8, [9, 3]).shortBy, 1);
  assert.equal(roll(8, [9, 7]).tier, "approved");
  assert.equal(roll(8, [9, 7, 10]).tier, "commended");
});

test("Margin of Grace on 10 only; counts as a success", () => {
  const r = evaluateRoll({ margin: 10 }, { difficulty: 1 });
  assert.equal(r.grace, true);
  assert.equal(r.successes, 1);
  assert.equal(evaluateRoll({ margin: 9 }).grace, false);
});

test("Margin of Error: 1 normally, 1-2 with Encumbrance in play", () => {
  assert.equal(evaluateRoll({ margin: 1 }).error, true);
  assert.equal(evaluateRoll({ margin: 2 }).error, false);
  assert.equal(evaluateRoll({ margin: 2 }, { encumbrance: true }).error, true);
  assert.equal(evaluateRoll({ margin: 3 }, { encumbrance: true }).error, false);
});

test("Stamp earned only when Encumbrance is in play and the Margin errs", () => {
  assert.equal(evaluateRoll({ margin: 1 }, { encumbrance: true }).stampEarned, true);
  assert.equal(evaluateRoll({ margin: 1 }).stampEarned, false);
  assert.equal(evaluateRoll({ margin: 5 }, { encumbrance: true }).stampEarned, false);
});

test("Resonance: violet 1s, or 1-2 with Greater Bound", () => {
  assert.equal(evaluateRoll({ margin: 5, violet: [1, 2, 6] }).resonance, 1);
  assert.equal(evaluateRoll({ margin: 5, violet: [1, 2, 6] }, { greaterBound: true }).resonance, 2);
  assert.equal(evaluateRoll({ margin: 5, white: [1, 2] }).resonance, 0);
});

// Check the doc's odds table by exact binomial: P(>= k successes) with n dice at 40%.
function atLeast(n, k, p = 0.4) {
  const choose = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return r; };
  let total = 0;
  for (let s = k; s <= n; s++) total += choose(n, s) * p ** s * (1 - p) ** (n - s);
  return Math.round(total * 100);
}

test("odds reference table in the design doc", () => {
  const table = { 3: [78, 35, 6], 4: [87, 52, 18, 3], 5: [92, 66, 32, 9], 7: [97, 84, 58, 29] };
  for (const [dice, expected] of Object.entries(table)) {
    expected.forEach((pct, i) => assert.equal(atLeast(Number(dice), i + 1), pct, `${dice} dice, ${i + 1}+`));
  }
});
