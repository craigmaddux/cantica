import { SKILLS, OPEN_TRAITS, CARD_TOKEN } from "../config.mjs";
import { skillChange, traitSlotPurchase, traitRankUp, awardTenure, stampsPerSession, TRAIT_COST } from "../progression.mjs";

export default class CanticaActor extends foundry.documents.Actor {
  /** Scene Cards are drawn onto the tabletop: a big, neutral, linked token that everyone can see. */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // A brand-new character starts in creation: a 15 Tenure skill budget, maximum rating 2.
    if (this.type === "character" && data.system?.skills === undefined && data.system?.creation === undefined) {
      this.updateSource({ "system.creation": true });
    }

    if (this.type === "card") {
      const { DOCUMENT_OWNERSHIP_LEVELS, TOKEN_DISPLAY_MODES, TOKEN_DISPOSITIONS } = CONST;
      this.updateSource({
        "ownership.default": DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        prototypeToken: {
          actorLink: true,
          width: CARD_TOKEN.width,
          height: CARD_TOKEN.height,
          lockRotation: true,
          displayName: TOKEN_DISPLAY_MODES.NONE,
          disposition: TOKEN_DISPOSITIONS.NEUTRAL,
          sight: { enabled: false },
          texture: { fit: "fill" }
        }
      });
    }
  }

  /** Roll data for formulas and macros: `@skills.hullcraft` etc. */
  getRollData() {
    const data = super.getRollData();
    if (this.type === "character") data.skills = { ...this.system.skills };
    return data;
  }

  /** @returns {number} Rating of a skill, 0 if the key is unknown. */
  skillRating(skill) {
    return this.type === "character" && SKILLS.includes(skill) ? this.system.skills[skill] : 0;
  }

  /** @returns {number} Rank (1-2) of Station or an open Trait. */
  traitRank(key) {
    return this.type === "character" ? (this.system.traitRanks?.[key] ?? 1) : 1;
  }

  /** Station and the open Traits the character has room for and has filled in, with ranks, for the roll dialog. */
  get rollTraits() {
    const { traits, traitSlots } = this.system;
    const keys = ["station", ...OPEN_TRAITS.slice(0, traitSlots)];
    return keys.filter(key => traits[key]).map(key => ({ key, text: traits[key], rank: this.traitRank(key) }));
  }

  /** Encumbrances that can be in play: the two, plus a Touched character's Drawback. */
  get encumbranceList() {
    const { encumbrances, touched, drawback } = this.system;
    const list = [
      { key: "personal", text: encumbrances.personal },
      { key: "circumstantial", text: encumbrances.circumstantial }
    ];
    if (touched) list.push({ key: "drawback", text: drawback });
    return list;
  }

  /* -------------------------------------------- */
  /*  Stamps and Tenure                           */
  /* -------------------------------------------- */

  /** Adjust Stamps by `delta`, never below zero. @returns {Promise<number>} the new total */
  async adjustStamps(delta) {
    const stamps = Math.max(0, this.system.stamps + delta);
    await this.update({ "system.stamps": stamps });
    return stamps;
  }

  /** Start of a session: at least the Stamps this Grade begins with (2, +1 at Grades III, VI and IX). */
  async startSession() {
    const perSession = stampsPerSession(this.system.grade);
    if (this.system.stamps < perSession) await this.update({ "system.stamps": perSession });
    return perSession;
  }

  /** A log entry for the History tab. */
  #entry(fields) {
    return { id: foundry.utils.randomID(), at: Date.now(), kind: "note", session: "", amount: 0, reason: "", gradeUp: 0, ...fields };
  }

  async #log(entries, update = {}) {
    await this.update({ ...update, "system.history": [...this.toObject().system.history, ...entries] });
  }

  /**
   * Award Tenure: raises lifetime earned (which sets Grade) and unspent. A Grade-up is highlighted in the log.
   * @returns {Promise<object>} the result of {@link awardTenure}
   */
  async awardTenure(amount, { session = "", reason = "", kind = "earned" } = {}) {
    const { tenureEarned, tenureUnspent } = this.system;
    const result = awardTenure({ earned: tenureEarned, unspent: tenureUnspent }, amount);
    if (!result.gained) return result;
    await this.#log(
      [this.#entry({ kind, session, amount: result.gained, reason, gradeUp: result.gradeUp ? result.gradeAfter : 0 })],
      { "system.tenureEarned": result.earned, "system.tenureUnspent": result.unspent }
    );
    return result;
  }

  /** Add a free-text note to the log. */
  async logNote(reason, session = "") {
    await this.#log([this.#entry({ kind: "note", session, reason })]);
  }

  /* -------------------------------------------- */
  /*  Skills and Traits                           */
  /* -------------------------------------------- */

  /**
   * Set a skill rating (0-2), paying for it. Creation draws on the 15 Tenure budget;
   * play spends unspent Tenure (1 for rating 1, 3 more for rating 2). The GM may set anything, free.
   * @returns {Promise<{ok: boolean, reason?: string}>}
   */
  async setSkill(skill, to) {
    const from = this.system.skills[skill];
    const gm = game.user.isGM;
    const result = skillChange({
      from, to,
      creation: this.system.creation,
      unspent: this.system.tenureUnspent,
      spent: this.system.skillSpent,
      gm
    });
    if (!result.ok) {
      ui.notifications.warn(game.i18n.localize(`CANTICA.Skill.Deny.${result.reason}`));
      return result;
    }

    const update = { [`system.skills.${skill}`]: to };
    const paying = !this.system.creation && !gm && result.cost > 0;
    if (paying) {
      update["system.tenureUnspent"] = this.system.tenureUnspent - result.cost;
      const label = game.i18n.localize(`CANTICA.Skill.${skill}.label`);
      await this.#log([this.#entry({ kind: "spent", amount: result.cost, reason: `${label} ${from} → ${to}` })], update);
    } else {
      await this.update(update);
    }
    return result;
  }

  /** Buy another open Trait slot: 4 Tenure, up to six. */
  async buyTraitSlot() {
    const { traitSlots, tenureUnspent } = this.system;
    const result = traitSlotPurchase({ slots: traitSlots, unspent: tenureUnspent });
    if (!result.ok) {
      ui.notifications.warn(game.i18n.localize(`CANTICA.Traits.Deny.${result.reason}`));
      return result;
    }
    await this.#log(
      [this.#entry({ kind: "spent", amount: TRAIT_COST, reason: game.i18n.localize("CANTICA.Traits.Bought") })],
      { "system.traitSlots": traitSlots + 1, "system.tenureUnspent": tenureUnspent - TRAIT_COST }
    );
    return result;
  }

  /**
   * Raise a Trait to rank 2 (6 Tenure, Grade III), or, for the GM, set any rank for free.
   * @param {string} key  "station" or an open Trait key.
   * @param {number} to   The new rank.
   */
  async setTraitRank(key, to) {
    const rank = this.traitRank(key);
    const gm = game.user.isGM;
    if (to === rank) return { ok: true, cost: 0 };

    // Lowering is the GM's call only; raising is paid for.
    if (to < rank) {
      if (!gm) return { ok: false, cost: 0, reason: "noLower" };
      await this.update({ [`system.traitRanks.${key}`]: to });
      return { ok: true, cost: 0 };
    }

    const result = traitRankUp({
      rank, written: Boolean(this.system.traits[key]), grade: this.system.grade, unspent: this.system.tenureUnspent, gm
    });
    if (!result.ok) {
      ui.notifications.warn(game.i18n.localize(`CANTICA.Traits.Rank.Deny.${result.reason}`));
      return result;
    }

    const update = { [`system.traitRanks.${key}`]: to };
    if (result.cost) {
      update["system.tenureUnspent"] = this.system.tenureUnspent - result.cost;
      await this.#log(
        [this.#entry({ kind: "spent", amount: result.cost, reason: game.i18n.format("CANTICA.Traits.Rank.Bought", { trait: this.system.traits[key] }) })],
        update
      );
    } else {
      await this.update(update);
    }
    return result;
  }

  /** Close character creation: from here, skills are bought with Tenure. */
  async finishCreation() {
    await this.update({ "system.creation": false });
  }
}
