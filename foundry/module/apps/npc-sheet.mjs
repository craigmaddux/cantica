import { SYSTEM_ID, NPC_TIERS } from "../config.mjs";
import { RATINGS } from "../rules.mjs";
import { trackContext, takeNotice, clearNotice, treatNotice, clearMinors } from "./notice-track.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/** NPC stat block: Name, Rating, Tags, Tier, and the Notice track their tier allows. About 30 seconds each. */
export default class NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["cantica", "sheet", "npc"],
    position: { width: 480, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { takeNotice, clearNotice, treatNotice, clearMinors }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/npc.hbs`, scrollable: [".cantica-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const i18n = game.i18n;
    const system = this.actor.system;

    context.actor = this.actor;
    context.system = system;
    context.editable = this.isEditable;

    context.ratings = Object.keys(RATINGS).map(value => ({
      value,
      label: `${value} · ${i18n.localize(`CANTICA.Rating.${value}`)}`,
      selected: Number(value) === system.rating
    }));
    context.tiers = NPC_TIERS.map(value => ({
      value,
      label: i18n.localize(`CANTICA.NpcTier.${value}`),
      selected: system.tier === value
    }));
    context.actionTags = [1, 2, 3].map(n => ({
      value: n,
      label: `${i18n.localize("CANTICA.Npc.Tag")} ${n}${system[`tag${n}`] ? `: ${system[`tag${n}`]}` : ""}`,
      selected: system.actionTag === n
    }));
    context.tierHint = i18n.localize(`CANTICA.NpcTier.${system.tier}Hint`);
    context.track = trackContext(this.actor);
    return context;
  }
}
