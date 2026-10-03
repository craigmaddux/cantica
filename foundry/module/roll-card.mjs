import { reduceSuccesses, tierFor } from "./rules.mjs";
import { canExpedite, canAddDie, canRaise } from "./card-actions.mjs";

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
 *   complication: null | { trait: string, negated: boolean },
 *   actorId, targetName,                         // the roller, and the NPC whose Rating is the Difficulty
 *   extra: [{kind, value, success, extra, by}],  // white dice added after the roll (Expedite, Countersign)
 *   expedited: boolean, countersigned: string[], ratingRaise: number,
 *   log: [{kind: "expedite"|"countersign"|"raise", who, value, success}]
 * }
 */

/**
 * The outcome with everything done to the roll since it was made, short of the Complication: added dice
 * count their successes and a raised Rating raises the Difficulty, and the tier is worked out again.
 */
export function adjustedOutcome(state) {
  const base = state.outcome;
  const added = (state.extra ?? []).filter(d => d.success).length;
  const raise = state.ratingRaise ?? 0;
  if (!added && !raise) return base;
  const successes = base.successes + added;
  const difficulty = base.difficulty + raise;
  let tier = tierFor(successes, difficulty);
  if (state.upgradeConditions && tier === "conditions") tier = "approved";
  return { ...base, successes, difficulty, tier };
}

/** The outcome as the card should show it: reduced by a live Complication, restored once negated. */
export function shownOutcome(state) {
  const c = state.complication;
  const adjusted = adjustedOutcome(state);
  if (c && !c.negated) return reduceSuccesses(adjusted, 1, { upgradeConditions: state.upgradeConditions });
  return adjusted;
}

/**
 * @param {object} state
 * @param {(key: string, data?: object) => string} t  Localizer.
 */
export function cardView(state, t) {
  const c = state.complication;
  const shown = shownOutcome(state);
  const adjusted = adjustedOutcome(state);
  const reduced = Boolean(c && !c.negated);

  return {
    actorName: state.actorName,
    skillLabel: state.skillLabel,
    difficulty: shown.difficulty,
    difficultyText: state.difficultyText,
    sceneName: state.sceneName || "",
    factors: state.factors,
    notes: state.notes,
    encumbranceNote: state.hindranceNote || "",
    dice: [...state.dice, ...(state.extra ?? [])],
    // What has been done to the roll since, in order: dice added, the Rating raised.
    actions: (state.log ?? []).map(entry => ({
      kind: entry.kind,
      title: t(`CANTICA.CardAction.${entry.kind}.title`),
      text: t(`CANTICA.CardAction.${entry.kind}.text`, { who: entry.who, value: entry.value, hit: entry.success ? t("CANTICA.CardAction.hit") : t("CANTICA.CardAction.miss") })
    })),
    outcome: shown,
    successes: shown.successes,
    // "3 → 2" so everyone can see what the Complication took.
    wasSuccesses: reduced ? adjusted.successes : null,
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
    canNegate: reduced,
    // Whether each action is still open on this roll. The chat hook shows each button only to the people it is for.
    canExpedite: canExpedite(state),
    canCountersign: canAddDie(state),
    canRaise: canRaise(state)
  };
}
