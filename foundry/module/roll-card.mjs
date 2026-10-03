import { reduceSuccesses } from "./rules.mjs";

/**
 * The chat card for a roll, as a function of its saved state. Pure, no Foundry dependency (the
 * localizer is passed in), so it is unit-tested in Node.
 *
 * The state is saved on the chat message so the card can be redrawn after the GM complicates the
 * roll with Scrutiny, or the player negates the complication with a Stamp.
 *
 * state: {
 *   actorName, skillLabel, difficulty, difficultyText, sceneId, sceneName,
 *   factors: string[], notes: string[], hindranceNote: string,
 *   dice: [{kind, value, success, flag}],
 *   outcome: object from evaluateRoll, upgradeConditions: boolean,
 *   dissonanceLabel: string, stampNote: boolean,
 *   complication: null | { trait: string, negated: boolean }
 * }
 */

/** The outcome as the card should show it: reduced by a live Complication, restored once negated. */
export function shownOutcome(state) {
  const c = state.complication;
  if (c && !c.negated) return reduceSuccesses(state.outcome, 1, { upgradeConditions: state.upgradeConditions });
  return state.outcome;
}

/**
 * @param {object} state
 * @param {(key: string, data?: object) => string} t  Localizer.
 */
export function cardView(state, t) {
  const c = state.complication;
  const shown = shownOutcome(state);
  const reduced = Boolean(c && !c.negated);

  return {
    actorName: state.actorName,
    skillLabel: state.skillLabel,
    difficulty: state.difficulty,
    difficultyText: state.difficultyText,
    sceneName: state.sceneName || "",
    factors: state.factors,
    notes: state.notes,
    encumbranceNote: state.hindranceNote || "",
    dice: state.dice,
    outcome: shown,
    successes: shown.successes,
    // "3 → 2" so everyone can see what the Complication took.
    wasSuccesses: reduced ? state.outcome.successes : null,
    tierLabel: t(`CANTICA.Tier.${shown.tier}`),
    // Cards saved before v0.8 call it Resonance.
    dissonanceLabel: state.dissonanceLabel || state.resonanceLabel || "",
    stampNote: state.stampNote,
    complication: c
      ? {
        trait: c.trait,
        negated: c.negated,
        text: c.negated ? t("CANTICA.Complication.NegatedText", { trait: c.trait }) : t("CANTICA.Complication.Text", { trait: c.trait })
      }
      : null,
    // The buttons are always in the card; the chat hook shows them only to the right people.
    canComplicate: Boolean(state.sceneId) && !c,
    canNegate: reduced
  };
}
