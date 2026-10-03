import { SYSTEM_ID, OPEN_TRAITS } from "../config.mjs";
import { buildPool, evaluateRoll, commendationEffects, effectiveDifficulty, WHITE_TARGET, VIOLET_TARGET } from "../rules.mjs";
import { marginTarget as marginTargetFor } from "../progression.mjs";
import { gainScrutiny } from "../scrutiny.mjs";
import { tally } from "../scene.mjs";

/** Dice So Nice colorset names (flavors), registered in dsn.mjs. */
export const COLORSETS = {
  margin: "cantica-amber",
  white: "cantica-white",
  violet: "cantica-violet"
};

const ROLL_TRAITS = ["station", ...OPEN_TRAITS];

/**
 * Build the pool, roll it, post the chat card, and settle Stamps and Scrutiny.
 * @param {Actor} actor
 * @param {object} input
 * @param {string} input.skill              Skill key.
 * @param {string[]} [input.traitKeys]      Ticked Traits: station and the open Traits.
 * @param {boolean} [input.gift]            The Gift is in play.
 * @param {string[]} [input.encumbranceKeys] Encumbrances in play: personal, circumstantial, drawback.
 * @param {{id: string, name: string, ruleBreak: string}[]} [input.commendations] Ticked Commendations.
 * @param {number} [input.circumstances]    Environmental advantages (+1 each).
 * @param {number} [input.obstacles]        Environmental penalties (-1 each).
 * @param {number} [input.bound]            Extra violet dice from other sources.
 * @param {string} [input.sceneName]        The Scene Card the roll happens in.
 * @param {{name: string, effect: string}[]} [input.sceneTraits] Ticked Traits of that card.
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

  // Encumbrances never add dice. If any is in play, the Margin of Error widens to 1-2.
  const encumbranceKeys = input.encumbranceKeys ?? [];
  const encumbrance = encumbranceKeys.length > 0 || Boolean(input.encumbrance);

  // Commendations: only ones the character really has, as many as the player ticked.
  const owned = new Map(actor.system.commendations.map(c => [c.id, c]));
  const commendations = (input.commendations ?? []).map(c => owned.get(c.id)).filter(Boolean);
  const fx = commendationEffects(commendations);
  const difficulty = effectiveDifficulty(baseDifficulty, fx.difficultyShift);

  // Ticked Traits of the scene the character is in: +1 per Circumstance, -1 per Obstacle.
  const sceneTraits = input.sceneTraits ?? [];
  const scene = tally(sceneTraits);
  const obstacles = Math.max(0, (input.obstacles || 0) + scene.obstacles - fx.obstaclesIgnored);

  const pool = buildPool({
    skill: actor.skillRating(skill),
    traits: traitKeys.length,
    gift,
    circumstances: (input.circumstances || 0) + scene.circumstances,
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

  // Everything the card shows, localized here so the template stays dumb.
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
  for (const trait of sceneTraits) factors.push(`${trait.effect === "circumstance" ? "+1" : "−1"} ${trait.name}`);
  if (expedite) factors.push(i18n.localize("CANTICA.Roll.Expedite"));

  const ladder = i18n.has(`CANTICA.Difficulty.${difficulty}`) ? i18n.localize(`CANTICA.Difficulty.${difficulty}`) : "";
  let difficultyText = input.targetName
    ? i18n.format("CANTICA.Roll.VsTarget", { name: input.targetName, rating: baseDifficulty })
    : `D${baseDifficulty}${i18n.has(`CANTICA.Difficulty.${baseDifficulty}`) ? ` · ${i18n.localize(`CANTICA.Difficulty.${baseDifficulty}`)}` : ""}`;
  if (difficulty !== baseDifficulty) difficultyText += ` → D${difficulty}${ladder ? ` · ${ladder}` : ""}`;

  const encumbranceTexts = encumbranceKeys
    .map(key => (key === "drawback" ? actor.system.drawback : actor.system.encumbrances[key]))
    .filter(Boolean);

  const context = {
    actorName: actor.name,
    skillLabel,
    difficulty,
    difficultyText,
    sceneName: input.sceneName || "",
    pool,
    factors,
    notes: [
      pool.capped && i18n.localize("CANTICA.Roll.Capped"),
      pool.floored && i18n.localize("CANTICA.Roll.Floored"),
      marginTarget < 7 && i18n.format("CANTICA.Roll.MarginTarget", { n: marginTarget }),
      fx.upgradeConditions && i18n.localize("CANTICA.Roll.UpgradeNote"),
      ...fx.impossible.map(c => i18n.format("CANTICA.Roll.ImpossibleNote", { name: c.name || i18n.localize("CANTICA.Commendation.Heading") }))
    ].filter(Boolean),
    encumbranceNote: encumbranceTexts.length ? i18n.format("CANTICA.Roll.InPlay", { text: encumbranceTexts.join(" · ") }) : "",
    dice,
    outcome,
    tierLabel: i18n.localize(`CANTICA.Tier.${outcome.tier}`),
    resonanceLabel: outcome.resonance ? i18n.format("CANTICA.Roll.ResonanceCount", { n: outcome.resonance }) : "",
    stampNote: outcome.stampEarned
  };

  const ChatMessage = CONFIG.ChatMessage.documentClass;
  const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat/roll.hbs`, context);
  const data = {
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    content,
    sound: CONFIG.sounds.dice,
    flags: { [SYSTEM_ID]: { actorId: actor.id, grace: outcome.grace, stampClaimed: false } }
  };
  ChatMessage.applyRollMode(data, game.settings.get("core", "rollMode"));
  const message = await ChatMessage.create(data);

  // Stamps: Expedite spends one; an Encumbrance biting earns one. Settle them in a single update.
  const stampDelta = (outcome.stampEarned ? 1 : 0) - (expedite ? 1 : 0);
  if (stampDelta) await actor.adjustStamps(stampDelta);

  // Every Margin of Error gives the GM +1 Scrutiny.
  if (outcome.scrutiny) await gainScrutiny();

  return { message, roll, pool, outcome };
}
