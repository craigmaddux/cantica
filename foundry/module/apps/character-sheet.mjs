import { SYSTEM_ID, SKILL_GROUPS, SKILL_MAX, OPEN_TRAITS } from "../config.mjs";
import { RULE_BREAKS } from "../rules.mjs";
import { CREATION_BUDGET, CREATION_MAX, TRAIT_MAX, TRAIT_COST } from "../progression.mjs";
import PoolDialog from "./pool-dialog.mjs";
import { trackContext, takeNotice, clearNotice, treatNotice, clearMinors } from "./notice-track.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/** Prompts shown as placeholders (not labels) in the open Trait slots. */
const TRAIT_PROMPTS = ["where you come from", "who you owe or love", "what you believe"];

export default class CharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** The tab being shown, kept across re-renders. */
  #tab = "record";

  static DEFAULT_OPTIONS = {
    classes: ["cantica", "sheet", "character"],
    position: { width: 900, height: 860 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      setTab: CharacterSheet.#onSetTab,
      rollSkill: CharacterSheet.#onRollSkill,
      setSkill: CharacterSheet.#onSetSkill,
      finishCreation: CharacterSheet.#onFinishCreation,
      buyTraitSlot: CharacterSheet.#onBuyTraitSlot,
      adjustStamps: CharacterSheet.#onAdjustStamps,
      startSession: CharacterSheet.#onStartSession,
      citeClause: CharacterSheet.#onCiteClause,
      addCommendation: CharacterSheet.#onAddCommendation,
      deleteCommendation: CharacterSheet.#onDeleteCommendation,
      awardTenure: CharacterSheet.#onAwardTenure,
      compline: CharacterSheet.#onCompline,
      arcMilestone: CharacterSheet.#onArcMilestone,
      takeNotice,
      clearNotice,
      treatNotice,
      clearMinors
    }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/character.hbs`, scrollable: [".tab-panel"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const i18n = game.i18n;
    const system = this.actor.system;
    const isGM = game.user.isGM;

    context.actor = this.actor;
    context.system = system;
    context.editable = this.isEditable;
    context.isGM = isGM && this.isEditable;
    // Everyone at the table may record Tenure on a sheet they can edit: Compline, arc milestones, awards.
    context.canAward = this.isEditable;

    // Tabs: Record, Gift (only when Touched), Notes, History.
    const ids = ["record", ...(system.touched ? ["gift"] : []), "notes", "history"];
    if (!ids.includes(this.#tab)) this.#tab = "record";
    context.tabs = ids.map(id => ({ id, label: i18n.localize(`CANTICA.Tabs.${id}`), active: id === this.#tab }));
    context.tabRecord = this.#tab === "record";
    context.tabGift = this.#tab === "gift";
    context.tabNotes = this.#tab === "notes";
    context.tabHistory = this.#tab === "history";

    // Skills, with the creation budget or the Tenure available to spend.
    context.skillGroups = Object.entries(SKILL_GROUPS).map(([group, keys]) => ({
      label: i18n.localize(`CANTICA.Group.${group}`),
      skills: keys.map(key => ({
        key,
        label: i18n.localize(`CANTICA.Skill.${key}.label`),
        hint: i18n.localize(`CANTICA.Skill.${key}.hint`),
        rating: system.skills[key],
        pips: Array.fromRange(SKILL_MAX, 1).map(n => ({
          n,
          filled: system.skills[key] >= n,
          // Rating 3 is locked below Grade III, and above 2 during creation.
          locked: n === 3 && !isGM && (system.creation || system.grade < 3)
        }))
      }))
    }));
    context.creation = {
      on: system.creation,
      spent: system.skillSpent,
      budget: CREATION_BUDGET,
      remaining: system.creationRemaining,
      max: CREATION_MAX,
      over: system.creationRemaining < 0
    };

    // Station and the open Traits (three to start; up to six).
    context.openTraits = OPEN_TRAITS.slice(0, system.traitSlots).map((key, i) => ({
      key,
      value: system.traits[key],
      prompt: TRAIT_PROMPTS[i] ?? "a knack nobody expects"
    }));
    context.canBuyTrait = !system.creation && system.traitSlots < TRAIT_MAX;
    context.traitCost = TRAIT_COST;

    // Commendations: slots come with Grade (II, V, VIII).
    const slots = system.commendationSlots;
    context.commendations = system.commendations.map((c, index) => ({
      ...c,
      index,
      breaks: RULE_BREAKS.map(value => ({ value, label: i18n.localize(`CANTICA.Commendation.${value}`), selected: c.ruleBreak === value }))
    }));
    context.commendationSlots = slots;
    context.canAddCommendation = system.commendations.length < slots;

    context.track = trackContext(this.actor);

    // History, newest first. A Grade-up is highlighted.
    context.history = [...system.history].sort((a, b) => b.at - a.at).map(entry => ({
      ...entry,
      date: new Date(entry.at).toLocaleDateString(),
      kindLabel: i18n.localize(`CANTICA.History.${entry.kind}`),
      sign: entry.kind === "spent" ? "−" : entry.kind === "note" ? "" : "+",
      hasAmount: entry.kind !== "note",
      gradeLabel: entry.gradeUp ? i18n.format("CANTICA.History.GradeUp", { grade: ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][entry.gradeUp] }) : ""
    }));
    return context;
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
  }

  /** Fields named system.commendations.N.field arrive keyed by N; fold them into the existing list. */
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const edited = data.system?.commendations;
    if (edited) {
      const current = this.actor.toObject().system.commendations;
      data.system.commendations = current.map((entry, i) => ({ ...entry, ...(edited[i] ?? {}) }));
    }
    return data;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** Switch tabs without re-rendering: show one panel, mark one tab. */
  static #onSetTab(event, target) {
    this.#tab = target.dataset.tab;
    this.element.querySelectorAll(".sheet-tabs .sheet-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === this.#tab));
    this.element.querySelectorAll(".tab-panel").forEach(panel => { panel.hidden = panel.dataset.tab !== this.#tab; });
  }

  static #onRollSkill(event, target) {
    new PoolDialog({ actor: this.actor, skill: target.dataset.skill }).render({ force: true });
  }

  /** Click a pip to set that rating; click the current rating again to step down one. Buying costs Tenure. */
  static async #onSetSkill(event, target) {
    const { skill } = target.dataset;
    const value = Number(target.dataset.value);
    const current = this.actor.system.skills[skill];
    await this.actor.setSkill(skill, value === current ? value - 1 : value);
  }

  /** Close character creation: from here on, skills are bought with Tenure. */
  static async #onFinishCreation() {
    const i18n = game.i18n;
    const go = await DialogV2.confirm({
      window: { title: i18n.localize("CANTICA.Creation.FinishTitle") },
      content: `<p>${i18n.localize("CANTICA.Creation.FinishBody")}</p>`,
      rejectClose: false
    });
    if (go) await this.actor.finishCreation();
  }

  static async #onBuyTraitSlot() {
    const i18n = game.i18n;
    const go = await DialogV2.confirm({
      window: { title: i18n.localize("CANTICA.Traits.BuyTitle") },
      content: `<p>${i18n.format("CANTICA.Traits.BuyBody", { cost: TRAIT_COST })}</p>`,
      rejectClose: false
    });
    if (go) await this.actor.buyTraitSlot();
  }

  static async #onAdjustStamps(event, target) {
    await this.actor.adjustStamps(Number(target.dataset.delta));
  }

  /** Start of a session: Stamps up to what this Grade begins with. */
  static async #onStartSession() {
    const perSession = await this.actor.startSession();
    ui.notifications.info(game.i18n.format("CANTICA.Stamps.SessionStarted", { n: perSession }));
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

  static async #onAddCommendation() {
    const system = this.actor.system;
    if (system.commendations.length >= system.commendationSlots) return;
    const entry = { id: foundry.utils.randomID(), name: "", situation: "", ruleBreak: "dice2" };
    await this.actor.update({ "system.commendations": [...this.actor.toObject().system.commendations, entry] });
  }

  static async #onDeleteCommendation(event, target) {
    const list = this.actor.toObject().system.commendations.filter(c => c.id !== target.dataset.id);
    await this.actor.update({ "system.commendations": list });
  }

  /** Award Tenure for any reason. */
  static async #onAwardTenure() {
    const i18n = game.i18n;
    const fields = await DialogV2.prompt({
      window: { title: i18n.localize("CANTICA.History.AwardTitle") },
      content: `<div class="form-group"><label>${i18n.localize("CANTICA.History.Amount")}</label>
          <input type="number" name="amount" value="1" min="1" autofocus></div>
        <div class="form-group"><label>${i18n.localize("CANTICA.History.Reason")}</label>
          <input type="text" name="reason"></div>
        <div class="form-group"><label>${i18n.localize("CANTICA.History.Session")}</label>
          <input type="text" name="session"></div>`,
      ok: {
        label: i18n.localize("CANTICA.History.Award"),
        callback: (event, button) => ({
          amount: Number(button.form.elements.amount.value),
          reason: button.form.elements.reason.value.trim(),
          session: button.form.elements.session.value.trim()
        })
      },
      rejectClose: false
    });
    if (fields) await announceAward(this.actor, await this.actor.awardTenure(fields.amount, fields));
  }

  /** Compline. Three questions; each yes earns 1 Tenure. */
  static async #onCompline() {
    const i18n = game.i18n;
    const questions = [1, 2, 3].map(n => i18n.localize(`CANTICA.History.Q${n}`));
    const answers = await DialogV2.prompt({
      window: { title: i18n.format("CANTICA.History.ComplineTitle", { name: this.actor.name }) },
      content: `<p class="hint">${i18n.localize("CANTICA.History.ComplineHint")}</p>
        ${questions.map((q, i) => `<label class="check"><input type="checkbox" name="q${i}"> <span>${q}</span></label>`).join("")}
        <div class="form-group"><label>${i18n.localize("CANTICA.History.Session")}</label>
          <input type="text" name="session"></div>`,
      ok: {
        label: i18n.localize("CANTICA.History.Award"),
        callback: (event, button) => ({
          yes: questions.filter((q, i) => button.form.elements[`q${i}`].checked),
          session: button.form.elements.session.value.trim()
        })
      },
      rejectClose: false
    });
    if (!answers) return;
    const reason = answers.yes.length ? answers.yes.join(" · ") : i18n.localize("CANTICA.History.NoAnswers");
    await announceAward(this.actor, await this.actor.awardTenure(answers.yes.length, { kind: "compline", session: answers.session, reason }));
  }

  /** An arc concluded. +3 Tenure. */
  static async #onArcMilestone() {
    const i18n = game.i18n;
    await announceAward(this.actor, await this.actor.awardTenure(3, { reason: i18n.localize("CANTICA.History.ArcMilestone") }));
  }
}

/** Tell the table about a Grade-up. Awards are otherwise quiet. */
async function announceAward(actor, result) {
  if (!result?.gradeUp) return;
  const ChatMessage = CONFIG.ChatMessage.documentClass;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat/grade.hbs`, {
      actorName: actor.name,
      grade: actor.system.gradeRoman
    })
  });
}
