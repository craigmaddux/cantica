/**
 * What can be done to a roll after it has been made, from its chat card (spec v0.9.1). Pure functions
 * on the card's saved state, with no Foundry dependency, so they are unit-tested in Node.
 *
 * Players spend Stamps:
 *   Refile      reroll one failed die (once per roll)
 *   Countersign an ally's Stamp: one more die on this roll (once per ally)
 *   Negate      cancel the GM's Complication (see roll-card.mjs)
 * The GM spends Scrutiny:
 *   Complicate  one success fewer, on one of the scene's Traits
 *   Raise       an NPC's Rating up by 1 for this one roll
 * (Expedite, +1 die, is spent before the roll, in the pool builder.)
 *
 * Added dice are white (they succeed on 7+) and are saved on the state, so the card can always be
 * redrawn from it. The pool's cap of 7 dice applies to added dice: once 7 are on the table, no more
 * can be added. A Refile replaces a die, so the cap never stops it.
 */

import { POOL_CAP, WHITE_TARGET } from "./rules.mjs";

/** Dice on the table: the ones rolled, and the ones added since. */
export const diceOnTable = state => (state.dice?.length ?? 0) + (state.extra?.length ?? 0);

export const canAddDie = state => diceOnTable(state) < POOL_CAP;

/** Countersign: another character's Stamp, once per character per roll. */
export const canCountersign = (state, allyId) =>
  canAddDie(state) && Boolean(allyId) && allyId !== state.actorId && !(state.countersigned ?? []).includes(allyId);

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
 * Add one rolled white die (a Countersign). Returns a new state; the original is not changed.
 * @param {object} state
 * @param {object} die
 * @param {number} die.value     The d10 result.
 * @param {string} die.who       The name of the character who spent the Stamp.
 * @param {string} die.whoId     Their actor id (Countersign is once per character).
 */
export function addDie(state, { value, who, whoId = "" }) {
  const entry = { kind: "white", value, success: value >= WHITE_TARGET, extra: true, by: "countersign" };
  return {
    ...state,
    extra: [...(state.extra ?? []), entry],
    countersigned: [...(state.countersigned ?? []), whoId],
    log: [...(state.log ?? []), { kind: "countersign", who, value, success: entry.success }]
  };
}

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
