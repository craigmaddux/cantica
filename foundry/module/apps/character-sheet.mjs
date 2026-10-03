import { SYSTEM_ID, SKILL_GROUPS, SKILL_MAX, TRAITS } from "../config.mjs";
import PoolDialog from "./pool-dialog.mjs";
import { trackContext, takeNotice, clearNotice, clearMinors } from "./notice-track.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class CharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["cantica", "sheet", "character"],
    position: { width: 780, height: 840 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollSkill: CharacterSheet.#onRollSkill,
      setSkill: CharacterSheet.#onSetSkill,
      adjustStamps: CharacterSheet.#onAdjustStamps,
      adjustTenure: CharacterSheet.#onAdjustTenure,
      citeClause: CharacterSheet.#onCiteClause,
      takeNotice,
      clearNotice,
      clearMinors
    }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/character.hbs`, scrollable: [".cantica-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const i18n = game.i18n;
    const system = this.actor.system;

    context.actor = this.actor;
    context.system = system;
    context.editable = this.isEditable;

    context.skillGroups = Object.entries(SKILL_GROUPS).map(([group, keys]) => ({
      label: i18n.localize(`CANTICA.Group.${group}`),
      skills: keys.map(key => ({
        key,
        label: i18n.localize(`CANTICA.Skill.${key}.label`),
        hint: i18n.localize(`CANTICA.Skill.${key}.hint`),
        rating: system.skills[key],
        pips: Array.fromRange(SKILL_MAX, 1).map(n => ({ n, filled: system.skills[key] >= n }))
      }))
    }));

    context.traits = TRAITS.map(key => ({
      key,
      label: i18n.localize(`CANTICA.Trait.${key}`),
      hint: i18n.localize(`CANTICA.Trait.${key}Hint`),
      value: system.traits[key]
    }));

    context.track = trackContext(this.actor);

    context.spread = {
      ...system.spread,
      summary: [3, 2, 1, 0].map(r => `${system.spread.counts[r]}×${r}`).join(" · ")
    };
    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static #onRollSkill(event, target) {
    new PoolDialog({ actor: this.actor, skill: target.dataset.skill }).render({ force: true });
  }

  /** Click a pip to set that rating; click the current rating again to step down one. */
  static async #onSetSkill(event, target) {
    const { skill } = target.dataset;
    const value = Number(target.dataset.value);
    const current = this.actor.system.skills[skill];
    await this.actor.update({ [`system.skills.${skill}`]: value === current ? value - 1 : value });
  }

  static async #onAdjustStamps(event, target) {
    await this.actor.adjustStamps(Number(target.dataset.delta));
  }

  static async #onAdjustTenure(event, target) {
    await this.actor.adjustTenure(Number(target.dataset.delta));
  }

  /** Spend a Stamp to declare that a rule in the Checklist exists and applies here. */
  static async #onCiteClause() {
    const i18n = game.i18n;
    if (this.actor.system.stamps < 1) {
      ui.notifications.warn(i18n.localize("CANTICA.Stamps.None"));
      return;
    }

    const clause = await DialogV2.prompt({
      window: { title: i18n.localize("CANTICA.Stamps.CiteTitle") },
      content: `<div class="form-group stacked"><label>${i18n.localize("CANTICA.Stamps.CitePrompt")}</label>
        <input type="text" name="clause" autofocus></div>`,
      ok: {
        label: i18n.localize("CANTICA.Stamps.Cite"),
        callback: (event, button) => button.form.elements.clause.value.trim()
      },
      rejectClose: false
    });
    if (!clause) return;

    await this.actor.adjustStamps(-1);
    const ChatMessage = CONFIG.ChatMessage.documentClass;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await foundry.applications.handlebars.renderTemplate(
        `systems/${SYSTEM_ID}/templates/chat/clause.hbs`,
        { actorName: this.actor.name, clause }
      )
    });
  }
}
