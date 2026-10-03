import { SYSTEM_ID, SKILL_GROUPS, SKILL_MAX } from "../config.mjs";
import { STEPS } from "../registration-steps.mjs";
import { CREATION_BUDGET } from "../progression.mjs";
import { loadBriefs, findBrief, briefSkills, suggestionsFor, giftFor } from "../briefs.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Characters being registered. While a character is held, its sheet will not open: the walkthrough
 * is the only window until it is finished, skipped or closed, and then the sheet appears.
 */
const holding = new Set();
export const holds = id => holding.has(id);
export const hold = id => holding.add(id);
export const release = id => holding.delete(id);

/** Open the walkthrough for a character, putting its sheet away first. */
export async function openRegistration(actor) {
  hold(actor.id);
  if (actor.sheet?.rendered) await actor.sheet.close();
  return new Registration(actor).render({ force: true });
}

/** Bring the walkthrough forward (used when someone tries to open the sheet meanwhile). */
export function focusRegistration(id) {
  foundry.applications.instances?.get(`cantica-registration-${id}`)?.bringToFront?.();
}

/**
 * Register With Gloss: character creation as a conversation. Each step asks one thing, says what it
 * does in the game, and offers a few examples. Every answer is saved to the character as it is given,
 * so skipping to the full sheet at any point loses nothing. Gloss's words live in registration-steps.mjs.
 */
export default class Registration extends HandlebarsApplicationMixin(ApplicationV2) {
  #step = 0;

  static DEFAULT_OPTIONS = {
    classes: ["cantica", "registration"],
    position: { width: 660 },
    window: { title: "CANTICA.Register.Title", icon: "fa-solid fa-id-badge", resizable: false },
    actions: {
      next: Registration.#onNext,
      back: Registration.#onBack,
      skip: Registration.#onSkip,
      pick: Registration.#onPick,
      pickPair: Registration.#onPickPair,
      pickBrief: Registration.#onPickBrief,
      setSkill: Registration.#onSetSkill,
      finish: Registration.#onFinish
    }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/app/registration.hbs` }
  };

  constructor(actor) {
    super({ id: `cantica-registration-${actor.id}` });
    this.actor = actor;
  }

  get title() {
    return `${game.i18n.localize("CANTICA.Register.Title")}: ${this.actor.name}`;
  }

  async _prepareContext() {
    const i18n = game.i18n;
    const step = STEPS[this.#step];
    const actor = this.actor;
    const system = actor.system;
    const get = path => foundry.utils.getProperty(actor, path) ?? "";
    const brief = findBrief(system.brief);

    const context = {
      step,
      number: this.#step + 1,
      total: STEPS.length,
      percent: Math.round(((this.#step + 1) / STEPS.length) * 100),
      isFirst: this.#step === 0,
      isLast: this.#step === STEPS.length - 1,
      isWelcome: step.kind === "welcome",
      isText: step.kind === "text",
      isSkills: step.kind === "skills",
      isTouched: step.kind === "touched",
      isReview: step.kind === "review",
      value: step.field ? get(step.field) : ""
    };

    // Station Briefs: starting points offered at the role step, and suggestions at the steps after it.
    if (step.briefs) {
      const list = loadBriefs();
      context.briefCards = list.map(b => ({ id: b.id, name: b.name, tagline: b.tagline, selected: b.id === system.brief }));
      context.noBrief = !system.brief;
      context.briefIntro = brief ? { greeting: brief.greeting, blurb: brief.blurb, shine: brief.shine } : null;
    }
    if (step.suggests && brief) {
      context.suggestions = suggestionsFor(step.suggests, brief);
      context.suggestionLabel = i18n.format("CANTICA.Brief.FromBrief", { name: brief.name });
    }

    if (step.kind === "skills") {
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
      context.briefNote = brief && system.creation ? i18n.format("CANTICA.Brief.SkillsNote", { name: brief.name }) : "";
      context.budget = { spent: system.skillSpent, total: CREATION_BUDGET, remaining: system.creationRemaining, over: system.creationRemaining < 0 };
    }

    if (step.kind === "touched") {
      context.touched = system.touched;
      context.gift = get(step.gift.field);
      context.drawback = get(step.gift.drawbackField);
      context.registered = system.registered;
      context.briefPair = giftFor(brief);
      context.briefPairLabel = brief ? i18n.format("CANTICA.Brief.FromBrief", { name: brief.name }) : "";
    }

    if (step.kind === "review") {
      const traits = ["station", "trait1", "trait2", "trait3"].map(k => system.traits[k]).filter(Boolean);
      const skills = Object.entries(system.skills).filter(([, rating]) => rating > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, rating]) => `${i18n.localize(`CANTICA.Skill.${key}.label`)} ${rating}`);
      context.summary = {
        name: actor.name,
        brief: brief?.name ?? "",
        traits,
        hindrances: [system.encumbrances.personal, system.encumbrances.circumstantial].filter(Boolean),
        skills,
        touched: system.touched,
        gift: system.gift,
        drawback: system.drawback,
        registered: system.registered
      };
    }
    return context;
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;

    // Every answer is saved as it is given.
    root.querySelectorAll("[data-field]").forEach(el => {
      if (el.tagName === "BUTTON") return;
      el.addEventListener("change", async () => {
        await this.#save(el);
        // The Touched box shows or hides the Gift questions.
        if (el.dataset.field === "system.touched") this.render();
      });
    });
    root.querySelector("[data-field]:not(button)")?.focus?.();
  }

  /** However the walkthrough ends (finished, skipped, or closed), the sheet appears. */
  _onClose(options) {
    super._onClose?.(options);
    release(this.actor.id);
    if (this.actor.collection) this.actor.sheet.render(true);
  }

  /** Save one answer to the character. */
  async #save(el) {
    const path = el.dataset.field;
    const value = el.type === "checkbox" ? el.checked : el.value.trim();
    if (foundry.utils.getProperty(this.actor, path) === value) return;
    await this.actor.update({ [path]: value });
  }

  /** Save whatever is typed on this step (so Next never loses an answer). */
  async #saveAll() {
    for (const el of this.element.querySelectorAll("[data-field]")) {
      if (el.tagName !== "BUTTON") await this.#save(el);
    }
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onNext() {
    await this.#saveAll();
    this.#step = Math.min(this.#step + 1, STEPS.length - 1);
    this.render();
  }

  static async #onBack() {
    await this.#saveAll();
    this.#step = Math.max(this.#step - 1, 0);
    this.render();
  }

  /** Stop here and go to the full sheet. Nothing is lost. */
  static async #onSkip() {
    await this.#saveAll();
    await this.close();
  }

  /** Click an example: it fills the answer. */
  static async #onPick(event, target) {
    const { field, value } = target.dataset;
    const input = this.element.querySelector(`input[data-field="${field}"]`);
    if (input) input.value = value;
    await this.actor.update({ [field]: value });
  }

  /**
   * Pick a Station Brief (or "Something else", which has no id): Station becomes the Brief's name and, during
   * creation, the skills become its standard spread. Its Traits, Hindrances and Gift are only suggested later.
   */
  static async #onPickBrief(event, target) {
    const brief = findBrief(target.dataset.id);
    const update = { "system.brief": brief?.id ?? "" };
    if (brief) {
      update["system.traits.station"] = brief.name;
      if (this.actor.system.creation) update["system.skills"] = briefSkills(brief);
    }
    await this.actor.update(update);
    this.render();
  }

  /** Click a Gift and Drawback pair: it fills both. */
  static async #onPickPair(event, target) {
    const step = STEPS[this.#step];
    const { gift, drawback } = target.dataset;
    await this.actor.update({ [step.gift.field]: gift, [step.gift.drawbackField]: drawback });
    this.render();
  }

  /** Click a dot to set that rating; click the current rating again to step down. */
  static async #onSetSkill(event, target) {
    const { skill } = target.dataset;
    const value = Number(target.dataset.value);
    const current = this.actor.system.skills[skill];
    await this.actor.setSkill(skill, value === current ? value - 1 : value);
    this.render();
  }

  /** Close creation, start the first session's Stamps, and open the finished sheet. */
  static async #onFinish() {
    await this.#saveAll();
    await this.actor.finishCreation();
    await this.actor.startSession();
    await this.close();
  }
}
