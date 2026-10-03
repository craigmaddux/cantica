import { SYSTEM_ID, SKILL_GROUPS, DICE_TRAITS } from "../config.mjs";
import { buildPool, DIFFICULTIES } from "../rules.mjs";
import { tally, visibleTraits } from "../scene.mjs";
import { sceneChoices } from "../cards.mjs";
import { rollPool } from "../dice/roll.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * The pool builder: pick the skill, tick relevant Traits, choose the scene you're in and
 * which of its Traits apply, set Bound dice, and see the pool before rolling.
 */
export default class PoolDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["cantica", "pool-dialog"],
    position: { width: 460 },
    window: { title: "CANTICA.Pool.Title", icon: "fa-solid fa-dice-d10" },
    form: { handler: PoolDialog.#onSubmit, closeOnSubmit: true }
  };

  static PARTS = {
    form: { template: `systems/${SYSTEM_ID}/templates/dialog/pool.hbs` }
  };

  /**
   * @param {object} options
   * @param {Actor} options.actor
   * @param {string} [options.skill] Skill preselected in the dialog.
   */
  constructor({ actor, skill = "notice", ...options } = {}) {
    super(options);
    this.actor = actor;
    this.skill = skill;
  }

  get title() {
    return `${game.i18n.localize("CANTICA.Pool.Title")}: ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const i18n = game.i18n;
    const { traits, touched, gift } = this.actor.system;
    const targets = this.#npcTargets();
    const scene = sceneChoices(this.actor);

    return {
      actor: this.actor,
      skillGroups: Object.entries(SKILL_GROUPS).map(([group, keys]) => ({
        label: i18n.localize(`CANTICA.Group.${group}`),
        skills: keys.map(key => ({
          key,
          label: i18n.localize(`CANTICA.Skill.${key}.label`),
          rating: this.actor.skillRating(key),
          selected: key === this.skill
        }))
      })),
      traits: DICE_TRAITS.map(key => ({
        key,
        label: i18n.localize(`CANTICA.Trait.${key}`),
        text: traits[key],
        disabled: !traits[key]
      })),
      encumbranceText: traits.encumbrance,
      touched,
      giftText: gift,
      stamps: this.actor.system.stamps,
      canExpedite: this.actor.system.stamps > 0,

      // The scene: the card the token stands on, else the active card. The player can change it.
      hasScene: scene.cards.length > 0,
      sceneNone: !scene.selectedId,
      sceneHint: i18n.localize(`CANTICA.Pool.SceneSource.${scene.source}`),
      sceneCards: scene.cards.map(card => ({
        id: card.id,
        name: card.name,
        selected: card.id === scene.selectedId,
        traits: visibleTraits(card.system.traits, game.user.isGM).map(trait => ({
          value: `${card.id}:${trait.id}`,
          name: trait.name,
          note: trait.note,
          effect: trait.effect,
          sign: trait.effect === "circumstance" ? "+1" : "−1",
          checked: trait.auto
        }))
      })),

      // A targeted NPC's Rating is used directly as the Difficulty. Preselect the first target.
      targets: targets.map(({ id, name, rating }, i) => ({
        value: `target:${id}`,
        name,
        rating,
        label: i18n.format("CANTICA.Pool.TargetOption", { name, rating, kind: i18n.localize(`CANTICA.Rating.${rating}`) }),
        selected: i === 0
      })),
      difficulties: Object.keys(DIFFICULTIES).map(level => ({
        value: level,
        label: `D${level} · ${i18n.localize(`CANTICA.Difficulty.${level}`)}`,
        selected: Number(level) === 1 && !targets.length
      }))
    };
  }

  /** NPCs the user has targeted, with their Ratings. */
  #npcTargets() {
    return [...game.user.targets]
      .filter(token => token.actor?.type === "npc")
      .map(token => ({ id: token.id, name: token.actor.name, rating: token.actor.system.rating }));
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("input", () => this.#updatePreview());
      el.addEventListener("change", () => this.#updatePreview());
    });
    this.#updatePreview();
  }

  /** Show only the Trait list of the chosen scene. */
  #syncSceneGroups() {
    const chosen = this.element.elements.sceneCard?.value ?? "";
    this.element.querySelectorAll(".scene-traits").forEach(group => { group.hidden = group.dataset.card !== chosen; });
  }

  /** Read the current form state. Reads the DOM directly so the preview and the roll can't disagree. */
  #readInput() {
    const form = this.element;
    const num = name => Math.max(0, Math.trunc(Number(form.elements[name]?.value) || 0));
    const chosen = form.elements.difficulty.selectedOptions[0];

    const sceneId = form.elements.sceneCard?.value ?? "";
    const sceneTraits = sceneId
      ? [...form.querySelectorAll(`.scene-traits[data-card="${sceneId}"] input[name="sceneTrait"]:checked`)]
        .map(el => ({ name: el.dataset.name, effect: el.dataset.effect }))
      : [];

    return {
      skill: form.elements.skill.value,
      traitKeys: [...form.querySelectorAll('input[name="traits"]:checked')].map(el => el.value),
      gift: Boolean(form.elements.gift?.checked),
      circumstances: num("circumstances"),
      obstacles: num("obstacles"),
      bound: num("bound"),
      sceneName: sceneId ? form.elements.sceneCard.selectedOptions[0].textContent.trim() : "",
      sceneTraits,
      difficulty: Number(chosen.dataset.difficulty),
      targetName: chosen.dataset.name ?? "",
      expedite: Boolean(form.elements.expedite?.checked),
      encumbrance: Boolean(form.elements.encumbrance?.checked),
      greaterBound: Boolean(form.elements.greaterBound?.checked)
    };
  }

  #updatePreview() {
    this.#syncSceneGroups();
    const input = this.#readInput();
    const scene = tally(input.sceneTraits);
    const pool = buildPool({
      skill: this.actor.skillRating(input.skill),
      traits: input.traitKeys.length,
      gift: input.gift,
      circumstances: input.circumstances + scene.circumstances,
      obstacles: input.obstacles + scene.obstacles,
      bound: input.bound,
      expedite: input.expedite
    });
    const i18n = game.i18n;
    const el = this.element.querySelector("[data-preview]");
    el.querySelector("[data-total]").textContent = pool.total;
    el.querySelector("[data-breakdown]").textContent = i18n.format("CANTICA.Pool.Breakdown", {
      amber: pool.margin, white: pool.white, violet: pool.violet
    });
    el.querySelector("[data-note]").textContent =
      pool.capped ? i18n.localize("CANTICA.Roll.Capped")
        : pool.floored ? i18n.localize("CANTICA.Roll.Floored") : "";
  }

  static async #onSubmit(event, form, formData) {
    await rollPool(this.actor, this.#readInput());
  }
}
