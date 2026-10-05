/**
 * What can be done to a roll after it has been made, from its chat card (spec v0.9.1). Pure functions
 * on the card's saved state, with no Foundry dependency, so they are unit-tested in Node.
 *
 * Players spend Stamps:
 *   Refile      reroll one failed die (once per roll)
 *   Negate      cancel the GM's Complication (see roll-card.mjs)
 * The GM spends Scrutiny:
 *   Complicate  one success fewer, on one of the scene's Traits
 *   Raise       an NPC's Rating up by 1 for this one roll
 * (Expedite, +1 die, is spent before the roll, in the pool builder. Countersign, giving a Stamp to an ally to
 * use as their Expedite or Refile, is done from the character sheet, not the card.)
 *
 * A Refile replaces a die, so the pool's cap of 7 dice never stops it. (Cards made in v0.8.1 could also carry
 * dice added by a Countersign; those are still read from `extra` so old cards draw as they did.)
 */

import { POOL_CAP, WHITE_TARGET } from "./rules.mjs";

/** Dice on the table: the ones rolled, and the ones added since. */
export const diceOnTable = state => (state.dice?.length ?? 0) + (state.extra?.length ?? 0);

export const canAddDie = state => diceOnTable(state) < POOL_CAP;

/** Raise the Rating: only a roll against an NPC, and only once. */
export const canRaise = state => Boolean(state.targetName) && !(state.ratingRaise > 0);

/**
 * The failed white die a Refile would reroll: the first one rolled, else the first one added. The Margin
 * and violet dice are never refiled (their 1s and 10s have already had their effects). Every failed white
 * die is worth the same, so there is nothing to choose.
 * @returns {{list: "dice"|"extra", index: number}|null}
 */
export function failedWhiteDie(state) {
  for (const list of ["dice", "extra"]) {
    const index = (state[list] ?? []).findIndex(d => d.kind === "white" && !d.success);
    if (index >= 0) return { list, index };
  }
  return null;
}

/** Refile: once per roll, and only while there is a failed white die. */
export const canRefile = state => !state.refiled && failedWhiteDie(state) !== null;

/**
 * Reroll one failed white die. The die is replaced where it sits, remembering what it was. If it was one of
 * the dice first rolled and now succeeds, that is one more success than the saved outcome counted
 * (`refileGain`); an added die is already counted by its own result.
 * @param {object} state
 * @param {{value: number, who: string}} reroll
 * @returns {object} the new state (the same one if there is nothing to refile)
 */
export function refile(state, { value, who }) {
  const found = failedWhiteDie(state);
  if (!found || state.refiled) return state;
  const old = state[found.list][found.index];
  const success = value >= WHITE_TARGET;
  const replaced = { ...old, value, success, was: old.value, refiled: true };
  return {
    ...state,
    [found.list]: state[found.list].map((d, i) => (i === found.index ? replaced : d)),
    refiled: true,
    refileGain: found.list === "dice" && success ? 1 : 0,
    log: [...(state.log ?? []), { kind: "refile", who, value, was: old.value, success }]
  };
}

/** The GM raises the Rating by 1 for this roll. Returns a new state. */
export function raiseRating(state) {
  return {
    ...state,
    ratingRaise: (state.ratingRaise ?? 0) + 1,
    log: [...(state.log ?? []), { kind: "raise", who: "" }]
  };
}
