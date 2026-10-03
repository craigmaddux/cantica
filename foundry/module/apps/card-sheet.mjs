import { SYSTEM_ID } from "../config.mjs";
import { addTrait, setActiveCard, amendScene } from "../cards.mjs";
import { isShown, setShown, openPanel } from "../scene-panel.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * A Scene Card. The GM edits everything. Players see the card and its Traits, and can add a Trait
 * by spending a Stamp. Traits are just Traits: a phrase and an optional note.
 */
export default class CardSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** Traits the viewer has expanded, so a re-render does not fold them shut mid-edit. */
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
      amend: CardSheet.#onAmend,
      toggleTable: CardSheet.#onToggleTable,
      popOut: CardSheet.#onPopOut
    }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/card.hbs`, scrollable: [".cantica-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const isGM = game.user.isGM;
    const system = this.actor.system;

    context.actor = this.actor;
    context.system = system;
    context.isGM = isGM;
    context.editable = isGM && this.isEditable;
    context.shown = isShown(this.actor.id);

    // Keep each Trait's real position: the form fields are named by array index.
    context.traits = system.traits.map((trait, index) => ({ ...trait, index, open: this.#open.has(trait.id) }));
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
    const trait = await addTrait(this.actor, { name: game.i18n.localize("CANTICA.Card.NewTrait") });
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

  /** GM: put this card on everyone's screen, or take it off. */
  static async #onToggleTable() {
    await setShown(this.actor.id, !isShown(this.actor.id));
    this.render();
  }

  /** Open the panel on this screen only. */
  static #onPopOut() {
    openPanel(this.actor.id);
  }
}
