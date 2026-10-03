import { SYSTEM_ID, DICE_TRAITS } from "../config.mjs";
import { buildPool, evaluateRoll, WHITE_TARGET, VIOLET_TARGET } from "../rules.mjs";

/** Dice So Nice colorset names (flavors), registered in dsn.mjs. */
export const COLORSETS = {
  margin: "cantica-amber",
  white: "cantica-white",
  violet: "cantica-violet"
};

/**
 * Build the pool, roll it, post the chat card, and award any Stamp earned.
 * @param {Actor} actor
 * @param {object} input
 * @param {string} input.skill            Skill key.
 * @param {string[]} [input.traitKeys]    Ticked Traits among station/deck/bond.
 * @param {boolean} [input.gift]          The Gift is in play.
 * @param {number} [input.circumstances]  Environmental advantages (+1 each).
 * @param {number} [input.obstacles]      Environmental penalties (-1 each).
 * @param {number} [input.bound]          Extra violet dice from other sources.
 * @param {number} [input.difficulty]     Successes needed, 1-5.
 * @param {boolean} [input.encumbrance]   Encumbrance in play (the Margin of Error widens to 1-2).
 * @param {boolean} [input.greaterBound]  Resonance on 1-2.
 */
export async function rollPool(actor, input) {
  const i18n = game.i18n;
  const skill = input.skill;
  const traitKeys = (input.traitKeys ?? []).filter(k => DICE_TRAITS.includes(k));
  const gift = Boolean(input.gift && actor.system.touched);
  const difficulty = Number(input.difficulty) || 2;
  const encumbrance = Boolean(input.encumbrance);
  const greaterBound = Boolean(input.greaterBound);

  const pool = buildPool({
    skill: actor.skillRating(skill),
    traits: traitKeys.length,
    gift,
    circumstances: input.circumstances,
    obstacles: input.obstacles,
    bound: input.bound
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
  const outcome = evaluateRoll({ margin, white, violet }, { difficulty, encumbrance, greaterBound });

  // Everything the card shows, localized here so the template stays dumb.
  const resonanceMax = greaterBound ? 2 : 1;
  const errorMax = encumbrance ? 2 : 1;
  const dice = [
    { kind: "margin", value: margin, success: margin >= WHITE_TARGET, flag: outcome.grace ? "grace" : outcome.error ? "error" : "" },
    ...white.map(value => ({ kind: "white", value, success: value >= WHITE_TARGET, flag: "" })),
    ...violet.map(value => ({ kind: "violet", value, success: value >= VIOLET_TARGET, flag: value <= resonanceMax ? "resonance" : "" }))
  ];

  const factors = [i18n.localize("CANTICA.Roll.Margin"), `${i18n.localize(`CANTICA.Skill.${skill}.label`)} ${actor.skillRating(skill)}`];
  for (const key of traitKeys) factors.push(actor.system.traits[key] || i18n.localize(`CANTICA.Trait.${key}`));
  if (gift) factors.push(actor.system.gift || i18n.localize("CANTICA.Roll.Gift"));
  if (input.circumstances) factors.push(`+${input.circumstances} ${i18n.localize("CANTICA.Roll.Circumstances")}`);
  if (input.obstacles) factors.push(`−${input.obstacles} ${i18n.localize("CANTICA.Roll.Obstacles")}`);
  if (input.bound) factors.push(`${input.bound} ${i18n.localize("CANTICA.Roll.BoundSource")}`);

  const context = {
    actorName: actor.name,
    skillLabel: i18n.localize(`CANTICA.Skill.${skill}.label`),
    difficulty,
    difficultyLabel: i18n.localize(`CANTICA.Difficulty.${difficulty}`),
    pool,
    factors,
    notes: [
      pool.capped && i18n.localize("CANTICA.Roll.Capped"),
      pool.floored && i18n.localize("CANTICA.Roll.Floored")
    ].filter(Boolean),
    dice,
    outcome,
    tierLabel: i18n.localize(`CANTICA.Tier.${outcome.tier}`),
    conditionsLabel: outcome.shortBy ? i18n.localize(`CANTICA.Conditions.${Math.min(outcome.shortBy, 3)}`) : "",
    errorRange: errorMax === 2 ? "1–2" : "1",
    resonanceLabel: outcome.resonance ? i18n.format("CANTICA.Roll.ResonanceCount", { n: outcome.resonance }) : "",
    stampNote: outcome.stampEarned,
    hasGrace: outcome.grace
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

  // Encumbrance in play and the Margin errs: the flaw bites and the player earns a Stamp.
  if (outcome.stampEarned) await actor.adjustStamps(1);

  return { message, roll, pool, outcome };
}
