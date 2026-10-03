/**
 * What can be done to a roll after it has been made, from its chat card (spec v0.8.1). Pure functions
 * on the card's saved state, with no Foundry dependency, so they are unit-tested in Node.
 *
 * Players spend Stamps:
 *   Expedite    one more die on your own roll (once per roll)
 *   Countersign one more die on an ally's roll (once per ally per roll)
 *   Negate      cancel the GM's Complication (see scene.mjs / roll-card.mjs)
 * The GM spends Scrutiny:
 *   Complicate  one success fewer, on one of the scene's Traits
 *   Raise       an NPC's Rating up by 1 for this one roll
 *
 * The extra dice are white (they succeed on 7+) and are saved on the state, so the card can always be
 * redrawn from it. The pool's cap of 7 dice applies: once 7 are on the table, no more can be added.
 */

import { POOL_CAP, WHITE_TARGET } from "./rules.mjs";

/** Dice on the table: the ones rolled, and the ones added since. */
export const diceOnTable = state => (state.dice?.length ?? 0) + (state.extra?.length ?? 0);

export const canAddDie = state => diceOnTable(state) < POOL_CAP;

/** Expedite: the roller's own Stamp, once per roll. */
export const canExpedite = state => canAddDie(state) && !state.expedited;

/** Countersign: another character's Stamp, once per character per roll. */
export const canCountersign = (state, allyId) =>
  canAddDie(state) && Boolean(allyId) && allyId !== state.actorId && !(state.countersigned ?? []).includes(allyId);

/** Raise the Rating: only a roll against an NPC, and only once. */
export const canRaise = state => Boolean(state.targetName) && !(state.ratingRaise > 0);

/**
 * Add one rolled white die. Returns a new state; the original is not changed.
 * @param {object} state
 * @param {object} die
 * @param {number} die.value     The d10 result.
 * @param {"expedite"|"countersign"} die.by
 * @param {string} die.who       The name of the character who spent the Stamp.
 * @param {string} [die.whoId]   Their actor id (Countersign is once per character).
 */
export function addDie(state, { value, by, who, whoId = "" }) {
  const entry = { kind: "white", value, success: value >= WHITE_TARGET, extra: true, by };
  return {
    ...state,
    extra: [...(state.extra ?? []), entry],
    expedited: state.expedited || by === "expedite",
    countersigned: by === "countersign" ? [...(state.countersigned ?? []), whoId] : state.countersigned ?? [],
    log: [...(state.log ?? []), { kind: by, who, value, success: entry.success }]
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
