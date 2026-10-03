/**
 * Cantica dice rules (spec v0.8). Pure functions with no Foundry dependency, so
 * the same logic is unit-tested in Node (see test/rules.test.mjs).
 *
 * Pool = Margin (1 amber) + Skill + one Trait (its rank, or 1 if stretched) + Circumstances - Obstacles, cap 7.
 * White dice succeed on 7+; violet (Bound) dice on 6+; the Margin on a threshold that
 * improves with Grade (7+ at Grades I-III, down to 4+ at Grade X).
 * Difficulty = successes needed to succeed at all.
 */

import { TRAIT_RANK_MAX } from "./progression.mjs";

export const POOL_CAP = 7;
export const WHITE_TARGET = 7;
export const VIOLET_TARGET = 6;

/**
 * At most two dice are violet: one from the Gift and one from Bound gear. (Gear never adds a die;
 * Bound gear turns an existing white die violet, as the Gift does.)
 */
export const BOUND_GEAR_MAX = 1;
/**
 * Dice a chosen Trait adds: its rank (1-2), or 1 whatever its rank when stretched to fit the situation.
 * @param {{rank?: number, stretch?: boolean}} trait
 */
export function traitDice({ rank = 1, stretch = false } = {}) {
  if (stretch) return 1;
  return Math.min(TRAIT_RANK_MAX, Math.max(1, Math.trunc(Number(rank) || 1)));
}

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
 * @param {number} [input.skill=0]         Skill rating, 0-2.
 * @param {number} [input.traits=0]        Dice from the chosen character Trait(s): see {@link traitDice}.
 * @param {boolean} [input.gift=false]     The Gift is in play. It adds no die, except one violet die to a pool
 *                                         that is only the Margin; otherwise it turns one white die violet.
 * @param {number} [input.circumstances=0] Environmental advantages, +1 each (a scene Trait counts here).
 * @param {number} [input.obstacles=0]     Environmental penalties, -1 each.
 * @param {number} [input.bound=0]         Bound gear in play (0 or 1): it turns one white die violet. More than one is treated as one.
 * @param {boolean} [input.expedite=false] A Stamp spent for +1 die (one per roll).
 */
export function buildPool({ skill = 0, traits = 0, gift = false, circumstances = 0, obstacles = 0, bound = 0, expedite = false } = {}) {
  const clean = n => Math.max(0, Math.trunc(Number(n) || 0));
  const raw = 1 + clean(skill) + clean(traits) + clean(circumstances) - clean(obstacles) + (expedite ? 1 : 0);
  let total = Math.min(POOL_CAP, Math.max(1, raw));

  // The Margin is always amber; colored dice replace white dice, never add to the count.
  let colorable = total - 1;
  let violet = Math.min(colorable, Math.min(BOUND_GEAR_MAX, clean(bound)));

  // The Gift: nothing extra, unless the pool is only the Margin (one violet die), or there is a white die to turn violet.
  let giftEffect = "";
  if (gift) {
    if (colorable === 0) {
      giftEffect = "die";
      total += 1; colorable += 1; violet += 1;
    } else if (colorable - violet > 0) {
      giftEffect = "convert";
      violet += 1;
    }
  }
  const white = colorable - violet;

  return { raw, total, margin: 1, white, violet, giftEffect, capped: raw > POOL_CAP, floored: raw < 1 };
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
 * @param {boolean} [opts.greaterBound]   Greater Bound (or the Hum at the Refrain): Dissonance on 1-2.
 * @param {number} [opts.marginTarget=7]  The Margin's success threshold, from Grade.
 * @param {boolean} [opts.upgradeConditions] A Commendation turns With Conditions into Approved.
 * @param {number} [opts.suppressDissonance]  Violet 1s that don't cause Dissonance (Commendation).
 */
export function evaluateRoll({ margin, white = [], violet = [] }, {
  difficulty = 1, encumbrance = false, greaterBound = false,
  marginTarget = WHITE_TARGET, upgradeConditions = false, suppressDissonance = 0
} = {}) {
  const marginSuccess = margin >= marginTarget;
  const whiteSuccesses = white.filter(r => r >= WHITE_TARGET).length;
  const violetSuccesses = violet.filter(r => r >= VIOLET_TARGET).length;
  const successes = (marginSuccess ? 1 : 0) + whiteSuccesses + violetSuccesses;

  // The 1 is always an Error and the 10 always Grace, at every Grade.
  const grace = margin === 10;
  const error = margin <= (encumbrance ? 2 : 1);
  const dissonanceMax = greaterBound ? 2 : 1;
  const dissonance = Math.max(0, violet.filter(r => r <= dissonanceMax).length - Math.max(0, suppressDissonance));

  let tier = tierFor(successes, difficulty);
  if (upgradeConditions && tier === "conditions") tier = "approved";

  return {
    successes, difficulty, tier,
    marginSuccess, marginTarget, grace, error, dissonance,
    // Every Margin of Error gives the GM +1 Scrutiny, in addition to the twist.
    scrutiny: error ? 1 : 0,
    // Any Encumbrance in play: an Error is the flaw biting, and the player earns a Stamp.
    stampEarned: error && encumbrance
  };
}

/* ── Commendations ── */

/** The six rule-breaks a Commendation can use. */
export const RULE_BREAKS = ["trait2", "difficulty", "obstacle", "conditions", "impossible", "dissonance"];

/**
 * What the ticked Commendations do to a roll.
 * @param {{ruleBreak: string}[]} selected
 */
export function commendationEffects(selected) {
  const count = kind => selected.filter(c => c.ruleBreak === kind).length;
  return {
    secondTrait: count("trait2") > 0,             // a second character Trait also applies
    difficultyShift: -count("difficulty"),        // treat the Difficulty as one lower
    obstaclesIgnored: count("obstacle"),          // ignore one obstacle
    upgradeConditions: count("conditions") > 0,   // With Conditions becomes Approved
    suppressDissonance: count("dissonance"),      // a violet 1 doesn't cause Dissonance
    impossible: selected.filter(c => c.ruleBreak === "impossible") // narrative permission only
  };
}

/** Difficulty after Commendations; never below 0. */
export const effectiveDifficulty = (difficulty, shift) => Math.max(0, difficulty + shift);

/* ── The GM's Complication ── */

/**
 * The GM spends Scrutiny on a scene Trait after a roll: one success fewer. The tier is worked out
 * again from the lower count (a Commendation that turns With Conditions into Approved still applies).
 * The player can negate it by spending a Stamp, which simply restores the original outcome.
 * @param {object} outcome  From {@link evaluateRoll}.
 * @param {number} [by=1]
 * @param {{upgradeConditions?: boolean}} [opts]
 */
export function reduceSuccesses(outcome, by = 1, { upgradeConditions = false } = {}) {
  const successes = Math.max(0, outcome.successes - by);
  let tier = tierFor(successes, outcome.difficulty);
  if (upgradeConditions && tier === "conditions") tier = "approved";
  return { ...outcome, successes, tier, reducedBy: outcome.successes - successes };
}
