import { SYSTEM_ID, SKILL_GROUPS } from "../config.mjs";
import { buildPool, DIFFICULTIES, commendationEffects, traitDice } from "../rules.mjs";
import { sceneTraitDice } from "../scene.mjs";
import { sceneChoices } from "../cards.mjs";
import { rollPool } from "../dice/roll.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * The pool builder: pick the skill, tick the Traits and Commendations that apply, say which
 * Encumbrances are in play, choose the scene you're in and which of its Traits apply, set Bound
 * dice, and see the pool before rolling.
 */
export default class PoolDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["cantica", "pool-dialog"],
    position: { width: 480 },
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
    const { touched, gift } = this.actor.system;
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

      // Pick one: Station or an open Trait that is filled in, worth its rank. A second pick appears when a
      // "second Trait" Commendation is ticked. Each pick has its own Stretch.
      traitSlots: [1, 2].map(n => ({
        n,
        hidden: n === 2,
        traits: this.actor.rollTraits.map(({ key, text, rank }) => ({
          key,
          label: i18n.localize(key === "station" ? "CANTICA.Trait.station" : "CANTICA.Trait.open"),
          text,
          rank
        }))
      })),
      hasTraits: this.actor.rollTraits.length > 0,
      penalties: [0, 1, 2, 3].map(n => ({ value: n, label: n ? `−${n}` : i18n.localize("CANTICA.Pool.NoPenalty"), checked: n === 0 })),
      stamps: this.actor.system.stamps,
      canExpedite: this.actor.system.stamps > 0,
      touched,
      giftText: gift,

      // One checkbox per Encumbrance (plus the Drawback). Any one in play widens the Margin of Error.
      encumbrances: this.actor.encumbranceList.map(({ key, text }) => ({
        key,
        label: i18n.localize(key === "drawback" ? "CANTICA.Gift.Drawback" : `CANTICA.Encumbrance.${key}`),
        text,
        disabled: !text
      })),

      // Commendations the player ticks when the situation applies.
      commendations: this.actor.system.commendations.map(c => ({
        id: c.id,
        name: c.name || i18n.localize("CANTICA.Commendation.Heading"),
        situation: c.situation,
        ruleBreak: c.ruleBreak,
        effect: i18n.localize(`CANTICA.Commendation.short.${c.ruleBreak}`)
      })),

      marginTarget: this.actor.system.marginTarget,

      // The scene: the card the token stands on, else the active card. The player can change it.
      hasScene: scene.cards.length > 0,
      sceneNone: !scene.selectedId,
      sceneHint: i18n.localize(`CANTICA.Pool.SceneSource.${scene.source}`),
      sceneCards: scene.cards.map(card => ({
        id: card.id,
        name: card.name,
        selected: card.id === scene.selectedId,
        traits: card.system.traits.filter(trait => trait.name).map(trait => ({
          value: `${card.id}:${trait.id}`,
          id: trait.id,
          cardId: card.id,
          name: trait.name,
          note: trait.note
        }))
      })),

      // A targeted NPC's Rating is used directly as the Difficulty. Preselect the first target.
      targets: targets.map(({ id, name, rating, tags }, i) => ({
        value: `target:${id}`,
        index: i,
        tags: tags.map(tag => ({ name: tag.name, action: tag.action })),
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
      .map(token => ({
        id: token.id,
        name: token.actor.name,
        rating: token.actor.system.rating,
        // Only one Tag ever applies to a roll. The Action Tag is what they do when they act.
        tags: [1, 2, 3]
          .map(n => ({ name: token.actor.system[`tag${n}`], action: token.actor.system.actionTag === n }))
          .filter(tag => tag.name)
      }));
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("input", () => this.#updatePreview());
      el.addEventListener("change", () => this.#updatePreview());
    });
    this.#updatePreview();
  }

  /** Show only the Tags of the NPC chosen as the target (a Rating on the ladder has none). */
  #syncTargetTags() {
    const chosen = this.element.elements.difficulty?.value ?? "";
    this.element.querySelectorAll(".target-tags").forEach(group => { group.hidden = group.dataset.target !== chosen; });
  }

  /** The Tag picked for the chosen target (at most one applies to a roll): a die lost. */
  #pickedTags() {
    const chosen = this.element.elements.difficulty?.value ?? "";
    return [...this.element.querySelectorAll('input[type="radio"].tag-pick:checked')]
      .filter(el => el.dataset.target === chosen && el.value)
      .map(el => el.value)
      .slice(0, 1);
  }

  /** Show only the Trait list of the chosen scene. */
  #syncSceneGroups() {
    const chosen = this.element.elements.sceneCard?.value ?? "";
    this.element.querySelectorAll(".scene-traits").forEach(group => { group.hidden = group.dataset.card !== chosen; });
  }

  /** Show the second Trait pick only when a "second Trait" Commendation is ticked. */
  #syncTraitSlots() {
    const form = this.element;
    const second = [...form.querySelectorAll('input[name="commendation"]:checked')].some(el => el.dataset.break === "trait2");
    const slot2 = form.querySelector('.trait-slot[data-slot="2"]');
    if (slot2) slot2.hidden = !second;

    // The same Trait can't be picked twice.
    const first = form.querySelector('input[name="trait-1"]:checked')?.value ?? "";
    const next = form.querySelector('input[name="trait-2"]:checked')?.value ?? "";
    form.querySelectorAll('input[name="trait-2"]').forEach(el => { el.disabled = Boolean(el.value) && el.value === first; });
    form.querySelectorAll('input[name="trait-1"]').forEach(el => { el.disabled = second && Boolean(el.value) && el.value === next; });
  }

  /** The chosen Traits with their Stretch toggles (the second only when its slot is showing). */
  #pickedTraits() {
    const form = this.element;
    const picks = [];
    for (const n of [1, 2]) {
      if (n === 2 && form.querySelector('.trait-slot[data-slot="2"]')?.hidden) continue;
      const key = form.querySelector(`input[name="trait-${n}"]:checked`)?.value;
      if (key) picks.push({ key, stretch: Boolean(form.elements[`stretch-${n}`]?.checked) });
    }
    return picks;
  }

  /** Read the current form state. Reads the DOM directly so the preview and the roll can't disagree. */
  #readInput() {
    const form = this.element;
        const checked = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)];
    const chosen = form.elements.difficulty.selectedOptions[0];

    // Only one scene Trait can be added to a roll: a radio group, with "none" first.
    const sceneId = form.elements.sceneCard?.value ?? "";
    const picked = sceneId
      ? form.querySelector(`input[name="sceneTrait-${sceneId}"]:checked`)
      : null;
    const sceneTrait = picked?.value ? { id: picked.dataset.id, cardId: sceneId, name: picked.dataset.name } : null;

    return {
      skill: form.elements.skill.value,
      traits: this.#pickedTraits(),
      gift: Boolean(form.elements.gift?.checked),
      encumbranceKeys: checked("encumbrance").map(el => el.value),
      commendations: checked("commendation").map(el => ({ id: el.value, name: el.dataset.name, ruleBreak: el.dataset.break })),
      bound: form.elements.bound?.checked ? 1 : 0,
      expedite: Boolean(form.elements.expedite?.checked),
      help: Boolean(form.elements.help?.checked),
      noticeOnTarget: Boolean(form.elements.noticeOnTarget?.checked),
      initiative: Boolean(form.elements.initiative?.checked),
      sceneId,
      sceneName: sceneId ? form.elements.sceneCard.selectedOptions[0].textContent.trim() : "",
      sceneTrait,
      difficulty: Number(chosen.dataset.difficulty),
      targetName: chosen.dataset.name ?? "",
      obstacles: Math.max(0, Math.trunc(Number(form.querySelector('input[name="obstacles"]:checked')?.value) || 0)),
      tags: this.#pickedTags()
    };
  }

  #updatePreview() {
    this.#syncSceneGroups();
    this.#syncTraitSlots();
    this.#syncTargetTags();
    const input = this.#readInput();
    const fx = commendationEffects(input.commendations);
    const traits = input.traits.slice(0, fx.secondTrait ? 2 : 1);
    const pool = buildPool({
      skill: this.actor.skillRating(input.skill),
      traits: traits.reduce((sum, t) => sum + traitDice({ rank: this.actor.traitRank(t.key), stretch: t.stretch }), 0),
      gift: input.gift,
      // The scene Trait, Help (+1 in total, however many help), and a Notice on the target (+1).
      circumstances: sceneTraitDice(input.sceneTrait) + (input.help ? 1 : 0) + (input.noticeOnTarget ? 1 : 0),
      // A penalty you name, and each of the target's Tags that applies, cost a die each.
      obstacles: Math.max(0, input.obstacles + input.tags.length - fx.obstaclesIgnored),
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
        : pool.floored ? i18n.localize("CANTICA.Roll.Floored")
          : input.gift ? i18n.localize(`CANTICA.Roll.GiftEffect.${pool.giftEffect || "none"}`) : "";

    // A turn-order roll: the Margin's Grace and Error don't count.
    const turn = input.initiative;
    if (turn) el.querySelector("[data-error-range]").textContent = i18n.localize("CANTICA.Pool.TurnOrderNote");

    // Any Hindrance (or the Drawback) in play is Greater Bound: the Margin of Error widens to 1-2,
    // and so does Dissonance on any violet dice.
    const widened = input.encumbranceKeys.length > 0;
    const range = widened ? "1–2" : "1";
    if (!turn) {
      el.querySelector("[data-error-range]").textContent = pool.violet > 0
        ? i18n.format("CANTICA.Pool.ErrorAndDissonanceRange", { range })
        : i18n.format("CANTICA.Pool.ErrorRange", { range });
    }
  }

  static async #onSubmit(event, form, formData) {
    await rollPool(this.actor, this.#readInput());
  }
}
