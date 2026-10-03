import { SYSTEM_ID } from "../config.mjs";
import { EFFECTS, visibleTraits } from "../scene.mjs";
import { addTrait, setActiveCard, amendScene } from "../cards.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * A Scene Card. The GM edits everything. Players see the Traits that aren't GM-only,
 * and can add one by spending a Stamp.
 */
export default class CardSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** Traits the viewer has expanded, so a re-render doesn't fold them shut mid-edit. */
  #open = new Set();

  static DEFAULT_OPTIONS = {
    classes: ["cantica", "sheet", "card"],
    position: { width: 560, height: 720 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      addTrait: CardSheet.#onAddTrait,
      deleteTrait: CardSheet.#onDeleteTrait,
      setActive: CardSheet.#onSetActive,
      amend: CardSheet.#onAmend
    }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/card.hbs`, scrollable: [".cantica-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const i18n = game.i18n;
    const isGM = game.user.isGM;
    const system = this.actor.system;

    context.actor = this.actor;
    context.system = system;
    context.isGM = isGM;
    context.editable = isGM && this.isEditable;

    // Keep each Trait's real position: the form fields are named by array index.
    const indexed = system.traits.map((trait, index) => ({ ...trait, index }));
    context.traits = visibleTraits(indexed, isGM).map(trait => ({
      ...trait,
      open: this.#open.has(trait.id),
      sign: trait.effect === "circumstance" ? "+1" : "−1",
      mode: i18n.localize(trait.auto ? "CANTICA.Card.Auto" : "CANTICA.Card.OptIn"),
      effects: EFFECTS.map(value => ({ value, label: i18n.localize(`CANTICA.Card.${value}`), selected: trait.effect === value }))
    }));
    return context;
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelectorAll("details[data-trait]").forEach(details => {
      details.addEventListener("toggle", () => {
        if (details.open) this.#open.add(details.dataset.trait);
        else this.#open.delete(details.dataset.trait);
      });
    });
  }

  /** Fields named system.traits.N.field arrive keyed by N; fold them into the existing list. */
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const edited = data.system?.traits;
    if (edited) {
      const current = this.actor.toObject().system.traits;
      data.system.traits = current.map((trait, i) => ({ ...trait, ...(edited[i] ?? {}) }));
    }
    return data;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onAddTrait() {
    if (!game.user.isGM) return;
    const trait = await addTrait(this.actor, { name: game.i18n.localize("CANTICA.Card.NewTrait"), effect: "obstacle" });
    this.#open.add(trait.id);
    this.render();
  }

  static async #onDeleteTrait(event, target) {
    if (!game.user.isGM) return;
    const { trait } = target.dataset;
    this.#open.delete(trait);
    await this.actor.update({ "system.traits": this.actor.toObject().system.traits.filter(t => t.id !== trait) });
  }

  static async #onSetActive() {
    if (game.user.isGM) await setActiveCard(this.actor);
  }

  static async #onAmend() {
    await amendScene(this.actor);
  }
}
