/**
 * Cantica dice rules (spec v0.5). Pure functions with no Foundry dependency, so
 * the same logic is unit-tested in Node (see test/rules.test.mjs).
 *
 * Pool = Margin (1 amber) + Skill + Traits + Circumstances - Obstacles, cap 7.
 * White dice succeed on 7+; violet (Bound) dice on 6+; the Margin on a threshold that
 * improves with Grade (7+ at Grades I-III, down to 4+ at Grade X).
 * Difficulty = successes needed to succeed at all.
 */

export const POOL_CAP = 7;
export const WHITE_TARGET = 7;
export const VIOLET_TARGET = 6;
export const GIFT_VIOLET_DICE = 2;

/** Difficulty ladder offered in the roll dialog. D4 is a story event and is never rolled as a ladder step. */
export const DIFFICULTIES = {
  0: "easy",
  1: "standard",
  2: "hard",
  3: "heroic"
};

/** NPC Ratings: used directly as the Difficulty of any roll against or to resist them. */
export const RATINGS = {
  1: "ordinary",
  2: "tough",
  3: "nemesis",
  4: "reserved"
};

/**
 * Work out how many dice of each color to roll.
 * @param {object} input
 * @param {number} [input.skill=0]         Skill rating, 0-3.
 * @param {number} [input.traits=0]        Ticked Traits (Station and the open Traits), each +1.
 * @param {boolean} [input.gift=false]     The Gift is in play: +1 die and up to two dice turn violet.
 * @param {number} [input.circumstances=0] Environmental advantages, +1 each.
 * @param {number} [input.obstacles=0]     Environmental penalties, -1 each.
 * @param {number} [input.bound=0]         Extra violet dice from other sources (Bound gear, a plea).
 * @param {boolean} [input.expedite=false] A Stamp spent for +1 die (one per roll).
 * @param {number} [input.bonus=0]         Extra dice from Commendations.
 */
export function buildPool({ skill = 0, traits = 0, gift = false, circumstances = 0, obstacles = 0, bound = 0, expedite = false, bonus = 0 } = {}) {
  const clean = n => Math.max(0, Math.trunc(Number(n) || 0));
  const raw = 1 + clean(skill) + clean(traits) + (gift ? 1 : 0) + clean(circumstances) - clean(obstacles) + (expedite ? 1 : 0) + clean(bonus);
  const total = Math.min(POOL_CAP, Math.max(1, raw));

  // The Margin is always amber; colored dice replace white dice, never add to the count.
  const colorable = total - 1;
  const violet = Math.min(colorable, clean(bound) + (gift ? GIFT_VIOLET_DICE : 0));
  const white = colorable - violet;

  return { raw, total, margin: 1, white, violet, capped: raw > POOL_CAP, floored: raw < 1 };
}

/**
 * The result tier for a number of successes against a Difficulty.
 * Below Difficulty is Denied; meeting it is With Conditions; one more is Approved;
 * two or more is Commended. At D0 nothing is below Difficulty, so Easy never Denies.
 */
export function tierFor(successes, difficulty) {
  if (successes < difficulty) return "denied";
  if (successes === difficulty) return "conditions";
  if (successes === difficulty + 1) return "approved";
  return "commended";
}

/**
 * Turn raw die results into an outcome.
 * @param {object} dice
 * @param {number} dice.margin   The amber die result.
 * @param {number[]} dice.white  White die results.
 * @param {number[]} dice.violet Violet die results.
 * @param {object} opts
 * @param {number} opts.difficulty        Successes needed (already adjusted for any Commendation).
 * @param {boolean} [opts.encumbrance]    Any Encumbrance (or a Drawback) in play: Margin of Error widens to 1-2.
 * @param {boolean} [opts.greaterBound]   Greater Bound: Resonance on 1-2.
 * @param {number} [opts.marginTarget=7]  The Margin's success threshold, from Grade.
 * @param {boolean} [opts.upgradeConditions] A Commendation turns With Conditions into Approved.
 * @param {number} [opts.suppressResonance]  Violet 1s that don't Resonate (Commendation).
 */
export function evaluateRoll({ margin, white = [], violet = [] }, {
  difficulty = 1, encumbrance = false, greaterBound = false,
  marginTarget = WHITE_TARGET, upgradeConditions = false, suppressResonance = 0
} = {}) {
  const marginSuccess = margin >= marginTarget;
  const whiteSuccesses = white.filter(r => r >= WHITE_TARGET).length;
  const violetSuccesses = violet.filter(r => r >= VIOLET_TARGET).length;
  const successes = (marginSuccess ? 1 : 0) + whiteSuccesses + violetSuccesses;

  // The 1 is always an Error and the 10 always Grace, at every Grade.
  const grace = margin === 10;
  const error = margin <= (encumbrance ? 2 : 1);
  const resonanceMax = greaterBound ? 2 : 1;
  const resonance = Math.max(0, violet.filter(r => r <= resonanceMax).length - Math.max(0, suppressResonance));

  let tier = tierFor(successes, difficulty);
  if (upgradeConditions && tier === "conditions") tier = "approved";

  return {
    successes, difficulty, tier,
    marginSuccess, marginTarget, grace, error, resonance,
    // Every Margin of Error gives the GM +1 Scrutiny, in addition to the twist.
    scrutiny: error ? 1 : 0,
    // Any Encumbrance in play: an Error is the flaw biting, and the player earns a Stamp.
    stampEarned: error && encumbrance
  };
}

/* ── Commendations ── */

/** The six rule-breaks a Commendation can use. */
export const RULE_BREAKS = ["dice2", "difficulty", "obstacle", "conditions", "impossible", "resonance"];

/**
 * What the ticked Commendations do to a roll.
 * @param {{ruleBreak: string}[]} selected
 */
export function commendationEffects(selected) {
  const count = kind => selected.filter(c => c.ruleBreak === kind).length;
  return {
    bonusDice: 2 * count("dice2"),               // +2 dice instead of +1 (Trait-style)
    difficultyShift: -count("difficulty"),        // treat the Difficulty as one lower
    obstaclesIgnored: count("obstacle"),          // ignore one obstacle
    upgradeConditions: count("conditions") > 0,   // With Conditions becomes Approved
    suppressResonance: count("resonance"),        // a violet 1 doesn't Resonate
    impossible: selected.filter(c => c.ruleBreak === "impossible") // narrative permission only
  };
}

/** Difficulty after Commendations; never below 0. */
export const effectiveDifficulty = (difficulty, shift) => Math.max(0, difficulty + shift);
