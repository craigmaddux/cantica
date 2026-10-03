/**
 * Cantica dice rules. Pure functions with no Foundry dependency, so the same
 * logic is unit-tested in Node (see test/rules.test.mjs).
 *
 * Pool = Margin (1 amber) + Skill + Traits + Circumstances - Obstacles, cap 7.
 * White dice and the Margin succeed on 7+; violet (Bound) dice on 6+.
 */

export const POOL_CAP = 7;
export const WHITE_TARGET = 7;
export const VIOLET_TARGET = 6;
export const GIFT_VIOLET_DICE = 2;

/** Difficulty ladder: successes needed for a clean result. */
export const DIFFICULTIES = {
  1: "easy",
  2: "standard",
  3: "hard",
  4: "heroic",
  5: "story"
};

/**
 * Work out how many dice of each color to roll.
 * @param {object} input
 * @param {number} [input.skill=0]         Skill rating, 0-3.
 * @param {number} [input.traits=0]        Ticked Traits (Station, Deck, Bond, Encumbrance), each +1.
 * @param {boolean} [input.gift=false]     The Gift is in play: +1 die and up to two dice turn violet.
 * @param {number} [input.circumstances=0] Environmental advantages, +1 each.
 * @param {number} [input.obstacles=0]     Environmental penalties, -1 each.
 * @param {number} [input.bound=0]         Extra violet dice from other sources (Bound gear, a plea).
 */
export function buildPool({ skill = 0, traits = 0, gift = false, circumstances = 0, obstacles = 0, bound = 0 } = {}) {
  const clean = n => Math.max(0, Math.trunc(Number(n) || 0));
  const raw = 1 + clean(skill) + clean(traits) + (gift ? 1 : 0) + clean(circumstances) - clean(obstacles);
  const total = Math.min(POOL_CAP, Math.max(1, raw));

  // The Margin is always amber; colored dice replace white dice, never add to the count.
  const colorable = total - 1;
  const violet = Math.min(colorable, clean(bound) + (gift ? GIFT_VIOLET_DICE : 0));
  const white = colorable - violet;

  return { raw, total, margin: 1, white, violet, capped: raw > POOL_CAP, floored: raw < 1 };
}

/**
 * Turn raw die results into an outcome.
 * @param {object} dice
 * @param {number} dice.margin   The amber die result.
 * @param {number[]} dice.white  White die results.
 * @param {number[]} dice.violet Violet die results.
 * @param {object} opts
 * @param {number} opts.difficulty     Successes needed (1-5).
 * @param {boolean} [opts.encumbrance] Encumbrance in play: Margin of Error widens to 1-2.
 * @param {boolean} [opts.greaterBound] Greater Bound: Resonance on 1-2.
 */
export function evaluateRoll({ margin, white = [], violet = [] }, { difficulty = 2, encumbrance = false, greaterBound = false } = {}) {
  const marginSuccess = margin >= WHITE_TARGET;
  const whiteSuccesses = white.filter(r => r >= WHITE_TARGET).length;
  const violetSuccesses = violet.filter(r => r >= VIOLET_TARGET).length;
  const successes = (marginSuccess ? 1 : 0) + whiteSuccesses + violetSuccesses;

  const grace = margin === 10;
  const error = margin <= (encumbrance ? 2 : 1);
  const resonanceMax = greaterBound ? 2 : 1;
  const resonance = violet.filter(r => r <= resonanceMax).length;

  let tier;
  if (successes === 0) tier = "denied";
  else if (successes < difficulty) tier = "conditions";
  else if (successes === difficulty) tier = "approved";
  else tier = "commended";

  // How far short of Difficulty: heavier conditions the further short.
  const shortBy = tier === "conditions" ? difficulty - successes : 0;

  return {
    successes, difficulty, tier, shortBy,
    marginSuccess, grace, error, resonance,
    // Encumbrance in play: an Error is the flaw biting, and the player earns a Stamp.
    stampEarned: error && encumbrance
  };
}
