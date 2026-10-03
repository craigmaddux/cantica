import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPool, evaluateRoll, tierFor, commendationEffects, effectiveDifficulty, traitDice } from "../module/rules.mjs";
import { marginTarget } from "../module/progression.mjs";

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
  const p = buildPool({ skill: 2, traits: 2, circumstances: 4 });
  assert.equal(p.total, 7);
  assert.equal(p.capped, true);
  assert.equal(p.white, 6);
});

test("Ilse Varro: Margin + Hullcraft 2 + a rank 2 Trait + Gift = 5 dice, the Gift turns one violet", () => {
  const p = buildPool({ skill: 2, traits: traitDice({ rank: 2 }), gift: true });
  assert.equal(p.total, 5);
  assert.equal(p.violet, 1);
  assert.equal(p.white, 3);
  assert.equal(p.margin, 1);
  assert.equal(p.giftEffect, "convert");
});

test("a Trait adds dice equal to its rank; Stretch makes it 1", () => {
  assert.equal(traitDice({ rank: 1 }), 1);
  assert.equal(traitDice({ rank: 2 }), 2);
  assert.equal(traitDice({ rank: 2, stretch: true }), 1);
  assert.equal(traitDice({}), 1);
  assert.equal(traitDice({ rank: 9 }), 2);
  assert.equal(buildPool({ skill: 1, traits: traitDice({ rank: 2 }) }).total, 4);
  assert.equal(buildPool({ skill: 1, traits: traitDice({ rank: 2, stretch: true }) }).total, 3);
});

test("the Gift adds no die when the pool has other dice", () => {
  const without = buildPool({ skill: 1, traits: 1 });
  const withGift = buildPool({ skill: 1, traits: 1, gift: true });
  assert.equal(withGift.total, without.total);
  assert.equal(withGift.violet, 1);
  assert.equal(withGift.white, without.white - 1);
});

test("the Gift adds one violet die to a pool that is only the Margin", () => {
  const p = buildPool({ gift: true });
  assert.deepEqual([p.total, p.margin, p.white, p.violet, p.giftEffect], [2, 1, 0, 1, "die"]);
  // Obstacles can leave only the Margin too.
  const squeezed = buildPool({ skill: 1, obstacles: 1, gift: true });
  assert.deepEqual([squeezed.total, squeezed.violet, squeezed.giftEffect], [2, 1, "die"]);
});

test("the Gift does nothing extra when every other die is already violet", () => {
  const p = buildPool({ skill: 1, bound: 1, gift: true });
  assert.equal(p.total, 2);
  assert.equal(p.violet, 1);
  assert.equal(p.white, 0);
  assert.equal(p.giftEffect, "");
});

test("the Gift is separate from Bound gear", () => {
  const p = buildPool({ skill: 3, bound: 1, gift: true });
  assert.equal(p.total, 4);
  assert.equal(p.violet, 2);
  assert.equal(p.white, 1);
});

test("violet replaces white; it never adds to the count", () => {
  const p = buildPool({ skill: 1, bound: 1 });
  assert.equal(p.total, 2);
  assert.equal(p.violet, 1);
  assert.equal(p.white, 0);
});

test("Bound gear turns one white die violet, never more, and a pool of only the Margin has none to turn", () => {
  assert.equal(buildPool({ skill: 2, bound: 1 }).violet, 1);
  assert.equal(buildPool({ skill: 2, bound: 5 }).violet, 1);
  assert.equal(buildPool({ bound: 1 }).violet, 0);
});

test("violet limit: one from the Gift and one from Bound gear, two in total", () => {
  const p = buildPool({ skill: 2, traits: 2, gift: true, bound: 9 });
  assert.equal(p.violet, 2);
  assert.equal(p.white, 2);
  assert.equal(p.total, 5);
});

test("the Margin can never be violet", () => {
  const p = buildPool({ gift: true, bound: 9 });
  assert.equal(p.total, 2);
  assert.equal(p.margin, 1);
  assert.equal(p.violet, 1);
});

test("successes: white and Margin 7+, violet 6+", () => {
  const r = evaluateRoll({ margin: 7, white: [6, 7], violet: [5, 6] }, { difficulty: 1 });
  assert.equal(r.successes, 3);
  assert.equal(r.tier, "commended");
});

test("result ladder, row by row (spec v0.2)", () => {
  const ladder = {
    0: ["conditions", "approved", "commended"],                 // 0, 1, 2+ successes; never denied
    1: ["denied", "conditions", "approved", "commended"],       // 0, 1, 2, 3+
    2: ["denied", "denied", "conditions", "approved", "commended"],
    3: ["denied", "denied", "denied", "conditions", "approved", "commended"]
  };
  for (const [difficulty, tiers] of Object.entries(ladder)) {
    for (let successes = 0; successes <= 7; successes++) {
      const expected = tiers[Math.min(successes, tiers.length - 1)];
      assert.equal(tierFor(successes, Number(difficulty)), expected, `D${difficulty}, ${successes} successes`);
    }
  }
});

test("Easy never Denies; an NPC Rating of 4 extends the ladder", () => {
  assert.equal(tierFor(0, 0), "conditions");
  assert.equal(tierFor(3, 4), "denied");
  assert.equal(tierFor(4, 4), "conditions");
  assert.equal(tierFor(6, 4), "commended");
});

test("Margin of Grace on 10 only; counts as a success", () => {
  const r = evaluateRoll({ margin: 10 }, { difficulty: 0 });
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

test("every Margin of Error gives the GM Scrutiny; only Encumbrance earns a Stamp", () => {
  const plain = evaluateRoll({ margin: 1 });
  assert.equal(plain.scrutiny, 1);
  assert.equal(plain.stampEarned, false);

  const burdened = evaluateRoll({ margin: 2 }, { encumbrance: true });
  assert.equal(burdened.scrutiny, 1);
  assert.equal(burdened.stampEarned, true);

  const fine = evaluateRoll({ margin: 5 }, { encumbrance: true });
  assert.equal(fine.scrutiny, 0);
  assert.equal(fine.stampEarned, false);
});

test("Dissonance: violet 1s, or 1-2 with Greater Bound", () => {
  assert.equal(evaluateRoll({ margin: 5, violet: [1, 2, 6] }).dissonance, 1);
  assert.equal(evaluateRoll({ margin: 5, violet: [1, 2, 6] }, { greaterBound: true }).dissonance, 2);
  assert.equal(evaluateRoll({ margin: 5, white: [1, 2] }).dissonance, 0);
});

// ---- Odds reference table from the design doc (white dice, 7+ on d10) ----

function binomial(n, k, p = 0.4) {
  let c = 1;
  for (let i = 1; i <= k; i++) c = c * (n - k + i) / i;
  return c * p ** k * (1 - p) ** (n - k);
}

/** Percent chance of each result tier for n dice at a Difficulty, using exact binomials. */
function tierOdds(n, difficulty) {
  const odds = { denied: 0, conditions: 0, approved: 0, commended: 0 };
  for (let k = 0; k <= n; k++) odds[tierFor(k, difficulty)] += binomial(n, k) * 100;
  return odds;
}

test("odds reference table (spec v0.2): Denied / With Conditions / Approved / Commended", () => {
  // [denied, conditions, approved, commended]; null = "—"
  const doc = {
    3: { 0: [null, 22, 43, 35], 1: [22, 43, 29, 6], 2: [65, 29, 6, 0] },
    4: { 0: [null, 13, 35, 52], 1: [13, 35, 35, 18], 2: [48, 35, 15, 3], 3: [82, 15, 3, 0] },
    5: { 0: [null, 8, 26, 66], 1: [8, 26, 35, 32], 2: [34, 35, 23, 9], 3: [68, 23, 8, 1] },
    7: { 0: [null, 3, 13, 84], 1: [3, 13, 26, 58], 2: [16, 26, 29, 29], 3: [42, 29, 19, 10] }
  };
  for (const [dice, rows] of Object.entries(doc)) {
    for (const [difficulty, expected] of Object.entries(rows)) {
      const o = tierOdds(Number(dice), Number(difficulty));
      const actual = [o.denied, o.conditions, o.approved, o.commended].map(v => Math.round(v));
      expected.forEach((pct, i) => {
        if (pct === null) assert.equal(actual[i], 0, `${dice} dice D${difficulty}: Denied should be never`);
        else assert.equal(actual[i], pct, `${dice} dice D${difficulty}, column ${i}`);
      });
    }
  }
});

// ---- v0.5: Grade and Commendations ----

test("the Margin's success threshold follows Grade; 1 is always Error and 10 always Grace", () => {
  // Grade I-III: a 6 on the Margin is not a success. Grade IV: it is.
  assert.equal(evaluateRoll({ margin: 6 }, { marginTarget: marginTarget(3) }).marginSuccess, false);
  assert.equal(evaluateRoll({ margin: 6 }, { marginTarget: marginTarget(4) }).marginSuccess, true);
  assert.equal(evaluateRoll({ margin: 4 }, { marginTarget: marginTarget(10) }).marginSuccess, true);
  assert.equal(evaluateRoll({ margin: 3 }, { marginTarget: marginTarget(10) }).marginSuccess, false);

  for (const grade of [1, 4, 7, 10]) {
    const opts = { marginTarget: marginTarget(grade) };
    assert.equal(evaluateRoll({ margin: 1 }, opts).error, true, `Grade ${grade} 1 is Error`);
    assert.equal(evaluateRoll({ margin: 10 }, opts).grace, true, `Grade ${grade} 10 is Grace`);
    assert.equal(evaluateRoll({ margin: 10 }, opts).marginSuccess, true);
  }
});

test("a better Margin threshold adds a success and can change the tier", () => {
  const dice = { margin: 5, white: [8] };
  assert.equal(evaluateRoll(dice, { difficulty: 2, marginTarget: 7 }).tier, "denied");
  assert.equal(evaluateRoll(dice, { difficulty: 2, marginTarget: 5 }).tier, "conditions");
});

test("Commendation: With Conditions becomes Approved, nothing else changes", () => {
  const dice = { margin: 8, white: [3] };
  assert.equal(evaluateRoll(dice, { difficulty: 1 }).tier, "conditions");
  assert.equal(evaluateRoll(dice, { difficulty: 1, upgradeConditions: true }).tier, "approved");
  assert.equal(evaluateRoll({ margin: 2, white: [3] }, { difficulty: 1, upgradeConditions: true }).tier, "denied");
  assert.equal(evaluateRoll({ margin: 8, white: [9] }, { difficulty: 1, upgradeConditions: true }).tier, "approved");
});

test("Commendation: a violet 1 doesn't cause Dissonance", () => {
  const dice = { margin: 5, violet: [1, 1, 8] };
  assert.equal(evaluateRoll(dice).dissonance, 2);
  assert.equal(evaluateRoll(dice, { suppressDissonance: 1 }).dissonance, 1);
  assert.equal(evaluateRoll(dice, { suppressDissonance: 5 }).dissonance, 0);
});

test("Commendation effects from the rule-break menu", () => {
  const fx = commendationEffects([
    { ruleBreak: "trait2" }, { ruleBreak: "difficulty" }, { ruleBreak: "obstacle" },
    { ruleBreak: "conditions" }, { ruleBreak: "dissonance" }, { ruleBreak: "impossible", name: "Walked Out" }
  ]);
  assert.equal(fx.secondTrait, true);
  assert.equal(fx.difficultyShift, -1);
  assert.equal(fx.obstaclesIgnored, 1);
  assert.equal(fx.upgradeConditions, true);
  assert.equal(fx.suppressDissonance, 1);
  assert.equal(fx.impossible.length, 1);
  assert.equal(commendationEffects([]).secondTrait, false);
});

test("a Commendation never takes Difficulty below 0", () => {
  assert.equal(effectiveDifficulty(2, -1), 1);
  assert.equal(effectiveDifficulty(0, -1), 0);
});
