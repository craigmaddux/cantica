import { SYSTEM_ID, DICE_TRAITS } from "../config.mjs";
import { buildPool, evaluateRoll, WHITE_TARGET, VIOLET_TARGET } from "../rules.mjs";
import { gainScrutiny } from "../scrutiny.mjs";

/** Dice So Nice colorset names (flavors), registered in dsn.mjs. */
export const COLORSETS = {
  margin: "cantica-amber",
  white: "cantica-white",
  violet: "cantica-violet"
};

/**
 * Build the pool, roll it, post the chat card, and settle Stamps and Scrutiny.
 * @param {Actor} actor
 * @param {object} input
 * @param {string} input.skill            Skill key.
 * @param {string[]} [input.traitKeys]    Ticked Traits among station/deck/bond.
 * @param {boolean} [input.gift]          The Gift is in play.
 * @param {number} [input.circumstances]  Environmental advantages (+1 each).
 * @param {number} [input.obstacles]      Environmental penalties (-1 each).
 * @param {number} [input.bound]          Extra violet dice from other sources.
 * @param {number} [input.difficulty]     Successes needed: D0-D3, or an NPC's Rating.
 * @param {string} [input.targetName]     Name of the NPC whose Rating is the Difficulty.
 * @param {boolean} [input.expedite]      Spend a Stamp for +1 die (one per roll).
 * @param {boolean} [input.encumbrance]   Encumbrance in play (the Margin of Error widens to 1-2).
 * @param {boolean} [input.greaterBound]  Resonance on 1-2.
 */
export async function rollPool(actor, input) {
  const i18n = game.i18n;
  const skill = input.skill;
  const traitKeys = (input.traitKeys ?? []).filter(k => DICE_TRAITS.includes(k));
  const gift = Boolean(input.gift && actor.system.touched);
  const difficulty = Number.isFinite(Number(input.difficulty)) ? Number(input.difficulty) : 1;
  const encumbrance = Boolean(input.encumbrance);
  const greaterBound = Boolean(input.greaterBound);
  const expedite = Boolean(input.expedite) && actor.system.stamps > 0;

  const pool = buildPool({
    skill: actor.skillRating(skill),
    traits: traitKeys.length,
    gift,
    circumstances: input.circumstances,
    obstacles: input.obstacles,
    bound: input.bound,
    expedite
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
  const dice = [
    { kind: "margin", value: margin, success: margin >= WHITE_TARGET, flag: outcome.grace ? "grace" : outcome.error ? "error" : "" },
    ...white.map(value => ({ kind: "white", value, success: value >= WHITE_TARGET, flag: "" })),
    ...violet.map(value => ({ kind: "violet", value, success: value >= VIOLET_TARGET, flag: value <= resonanceMax ? "resonance" : "" }))
  ];

  const skillLabel = i18n.localize(`CANTICA.Skill.${skill}.label`);
  const factors = [i18n.localize("CANTICA.Roll.Margin"), `${skillLabel} ${actor.skillRating(skill)}`];
  for (const key of traitKeys) factors.push(actor.system.traits[key] || i18n.localize(`CANTICA.Trait.${key}`));
  if (gift) factors.push(actor.system.gift || i18n.localize("CANTICA.Roll.Gift"));
  if (input.circumstances) factors.push(`+${input.circumstances} ${i18n.localize("CANTICA.Roll.Circumstances")}`);
  if (input.obstacles) factors.push(`−${input.obstacles} ${i18n.localize("CANTICA.Roll.Obstacles")}`);
  if (input.bound) factors.push(`${input.bound} ${i18n.localize("CANTICA.Roll.BoundSource")}`);
  if (expedite) factors.push(i18n.localize("CANTICA.Roll.Expedite"));

  const ladder = i18n.has(`CANTICA.Difficulty.${difficulty}`) ? i18n.localize(`CANTICA.Difficulty.${difficulty}`) : "";
  const difficultyText = input.targetName
    ? i18n.format("CANTICA.Roll.VsTarget", { name: input.targetName, rating: difficulty })
    : `D${difficulty}${ladder ? ` · ${ladder}` : ""}`;

  const context = {
    actorName: actor.name,
    skillLabel,
    difficulty,
    difficultyText,
    pool,
    factors,
    notes: [
      pool.capped && i18n.localize("CANTICA.Roll.Capped"),
      pool.floored && i18n.localize("CANTICA.Roll.Floored")
    ].filter(Boolean),
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

  // Stamps: Expedite spends one; Encumbrance biting earns one. Settle them in a single update.
  const stampDelta = (outcome.stampEarned ? 1 : 0) - (expedite ? 1 : 0);
  if (stampDelta) await actor.adjustStamps(stampDelta);

  // Every Margin of Error gives the GM +1 Scrutiny.
  if (outcome.scrutiny) await gainScrutiny();

  return { message, roll, pool, outcome };
}
