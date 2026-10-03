import { SYSTEM_ID, OPEN_TRAITS } from "../config.mjs";
import { buildPool, evaluateRoll, commendationEffects, effectiveDifficulty, WHITE_TARGET, VIOLET_TARGET } from "../rules.mjs";
import { marginTarget as marginTargetFor } from "../progression.mjs";
import { gainScrutiny } from "../scrutiny.mjs";
import { sceneTraitDice } from "../scene.mjs";
import { cardView } from "../roll-card.mjs";

/** Dice So Nice colorset names (flavors), registered in dsn.mjs. */
export const COLORSETS = {
  margin: "cantica-amber",
  white: "cantica-white",
  violet: "cantica-violet"
};

const ROLL_TRAITS = ["station", ...OPEN_TRAITS];

/** The localizer the card view uses. */
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

/**
 * Draw the chat card for a saved roll state. Used when the roll is made, and again whenever the GM
 * complicates it or the player negates the complication.
 */
export async function renderRollCard(state) {
  return foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat/roll.hbs`, cardView(state, t));
}

/**
 * Build the pool, roll it, post the chat card, and settle Stamps and Scrutiny.
 * @param {Actor} actor
 * @param {object} input
 * @param {string} input.skill              Skill key.
 * @param {string[]} [input.traitKeys]      Ticked Traits: station and the open Traits.
 * @param {boolean} [input.gift]            The Gift is in play.
 * @param {string[]} [input.encumbranceKeys] Hindrances in play: personal, circumstantial, drawback.
 * @param {{id: string, name: string, ruleBreak: string}[]} [input.commendations] Ticked Commendations.
 * @param {number} [input.circumstances]    Environmental advantages (+1 each).
 * @param {number} [input.obstacles]        Environmental penalties (-1 each).
 * @param {number} [input.bound]            Extra violet dice from other sources.
 * @param {string} [input.sceneId]          The Scene Card the roll happens in.
 * @param {string} [input.sceneName]
 * @param {{id: string, name: string}} [input.sceneTrait] The one scene Trait picked for +1 die.
 * @param {number} [input.difficulty]       Successes needed: D0-D3, or an NPC's Rating.
 * @param {string} [input.targetName]       Name of the NPC whose Rating is the Difficulty.
 * @param {boolean} [input.expedite]        Spend a Stamp for +1 die (one per roll).
 * @param {boolean} [input.greaterBound]    Resonance on 1-2.
 */
export async function rollPool(actor, input) {
  const i18n = game.i18n;
  const skill = input.skill;
  const traitKeys = (input.traitKeys ?? []).filter(k => ROLL_TRAITS.includes(k) && actor.system.traits[k]);
  const gift = Boolean(input.gift && actor.system.touched);
  const baseDifficulty = Number.isFinite(Number(input.difficulty)) ? Number(input.difficulty) : 1;
  const greaterBound = Boolean(input.greaterBound);
  const expedite = Boolean(input.expedite) && actor.system.stamps > 0;

  // Hindrances never add dice. If any is in play, the Margin of Error widens to 1-2.
  const encumbranceKeys = input.encumbranceKeys ?? [];
  const encumbrance = encumbranceKeys.length > 0 || Boolean(input.encumbrance);

  // Commendations: only ones the character really has, as many as the player ticked.
  const owned = new Map(actor.system.commendations.map(c => [c.id, c]));
  const commendations = (input.commendations ?? []).map(c => owned.get(c.id)).filter(Boolean);
  const fx = commendationEffects(commendations);
  const difficulty = effectiveDifficulty(baseDifficulty, fx.difficultyShift);

  // One scene Trait may be picked, for +1 die.
  const sceneTrait = input.sceneTrait ?? null;
  const obstacles = Math.max(0, (input.obstacles || 0) - fx.obstaclesIgnored);

  const pool = buildPool({
    skill: actor.skillRating(skill),
    traits: traitKeys.length,
    gift,
    circumstances: (input.circumstances || 0) + sceneTraitDice(sceneTrait),
    obstacles,
    bound: input.bound,
    expedite,
    bonus: fx.bonusDice
  });

  const parts = [`1d10[${COLORSETS.margin}]`];
  if (pool.white) parts.push(`${pool.white}d10[${COLORSETS.white}]`);
  if (pool.violet) parts.push(`${pool.violet}d10[${COLORSETS.violet}]`);
  const roll = new foundry.dice.Roll(parts.join(" + "));

  // Dice So Nice picks the colorset from the term's flavor; set `appearance` too for newer versions.
  for (const term of roll.dice) term.options.appearance = { colorset: term.options.flavor };
  await roll.evaluate();

  const results = flavor => roll.dice.find(d => d.options.flavor === flavor)?.results.map(r => r.result) ?? [];
  const margin = results(COLORSETS.margin)[0];
  const white = results(COLORSETS.white);
  const violet = results(COLORSETS.violet);

  // The Margin's success threshold improves with Grade: 7+ at I-III, down to 4+ at X.
  const marginTarget = actor.system.marginTarget ?? marginTargetFor(1);
  const outcome = evaluateRoll({ margin, white, violet }, {
    difficulty, encumbrance, greaterBound, marginTarget,
    upgradeConditions: fx.upgradeConditions,
    suppressResonance: fx.suppressResonance
  });

  // Everything the card shows, worked out now and saved so the card can be redrawn later.
  const resonanceMax = greaterBound ? 2 : 1;
  const dice = [
    { kind: "margin", value: margin, success: margin >= marginTarget, flag: outcome.grace ? "grace" : outcome.error ? "error" : "" },
    ...white.map(value => ({ kind: "white", value, success: value >= WHITE_TARGET, flag: "" })),
    ...violet.map(value => ({ kind: "violet", value, success: value >= VIOLET_TARGET, flag: value <= resonanceMax ? "resonance" : "" }))
  ];

  const skillLabel = i18n.localize(`CANTICA.Skill.${skill}.label`);
  const factors = [i18n.localize("CANTICA.Roll.Margin"), `${skillLabel} ${actor.skillRating(skill)}`];
  for (const key of traitKeys) factors.push(actor.system.traits[key]);
  if (gift) factors.push(actor.system.gift || i18n.localize("CANTICA.Roll.Gift"));
  for (const c of commendations) factors.push(`★ ${c.name || i18n.localize("CANTICA.Commendation.Heading")} (${i18n.localize(`CANTICA.Commendation.short.${c.ruleBreak}`)})`);
  if (input.circumstances) factors.push(`+${input.circumstances} ${i18n.localize("CANTICA.Roll.Circumstances")}`);
  if (input.obstacles) factors.push(`−${input.obstacles} ${i18n.localize("CANTICA.Roll.Obstacles")}`);
  if (input.bound) factors.push(`${input.bound} ${i18n.localize("CANTICA.Roll.BoundSource")}`);
  if (sceneTrait) factors.push(`+1 ${sceneTrait.name}`);
  if (expedite) factors.push(i18n.localize("CANTICA.Roll.Expedite"));

  const ladder = i18n.has(`CANTICA.Difficulty.${difficulty}`) ? i18n.localize(`CANTICA.Difficulty.${difficulty}`) : "";
  let difficultyText = input.targetName
    ? i18n.format("CANTICA.Roll.VsTarget", { name: input.targetName, rating: baseDifficulty })
    : `D${baseDifficulty}${i18n.has(`CANTICA.Difficulty.${baseDifficulty}`) ? ` · ${i18n.localize(`CANTICA.Difficulty.${baseDifficulty}`)}` : ""}`;
  if (difficulty !== baseDifficulty) difficultyText += ` → D${difficulty}${ladder ? ` · ${ladder}` : ""}`;

  const hindranceTexts = encumbranceKeys
    .map(key => (key === "drawback" ? actor.system.drawback : actor.system.encumbrances[key]))
    .filter(Boolean);

  const state = {
    actorName: actor.name,
    skillLabel,
    difficulty,
    difficultyText,
    sceneId: input.sceneId || "",
    sceneName: input.sceneName || "",
    factors,
    notes: [
      pool.capped && i18n.localize("CANTICA.Roll.Capped"),
      pool.floored && i18n.localize("CANTICA.Roll.Floored"),
      marginTarget < 7 && i18n.format("CANTICA.Roll.MarginTarget", { n: marginTarget }),
      fx.upgradeConditions && i18n.localize("CANTICA.Roll.UpgradeNote"),
      ...fx.impossible.map(c => i18n.format("CANTICA.Roll.ImpossibleNote", { name: c.name || i18n.localize("CANTICA.Commendation.Heading") }))
    ].filter(Boolean),
    hindranceNote: hindranceTexts.length ? i18n.format("CANTICA.Roll.InPlay", { text: hindranceTexts.join(" · ") }) : "",
    dice,
    outcome,
    upgradeConditions: fx.upgradeConditions,
    resonanceLabel: outcome.resonance ? i18n.format("CANTICA.Roll.ResonanceCount", { n: outcome.resonance }) : "",
    stampNote: outcome.stampEarned,
    complication: null
  };

  const ChatMessage = CONFIG.ChatMessage.documentClass;
  const data = {
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    content: await renderRollCard(state),
    sound: CONFIG.sounds.dice,
    flags: { [SYSTEM_ID]: { actorId: actor.id, grace: outcome.grace, stampClaimed: false, state } }
  };
  ChatMessage.applyRollMode(data, game.settings.get("core", "rollMode"));
  const message = await ChatMessage.create(data);

  // Stamps: Expedite spends one; a Hindrance biting earns one. Settle them in a single update.
  const stampDelta = (outcome.stampEarned ? 1 : 0) - (expedite ? 1 : 0);
  if (stampDelta) await actor.adjustStamps(stampDelta);

  // Every Margin of Error gives the GM +1 Scrutiny.
  if (outcome.scrutiny) await gainScrutiny();

  return { message, roll, pool, outcome };
}
