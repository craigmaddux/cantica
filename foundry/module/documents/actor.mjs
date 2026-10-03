import { SKILLS } from "../config.mjs";

export default class CanticaActor extends foundry.documents.Actor {
  /** Scene Cards are drawn onto the tabletop: a big, neutral, linked token that everyone can see. */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (this.type === "card") {
      const { DOCUMENT_OWNERSHIP_LEVELS, TOKEN_DISPLAY_MODES, TOKEN_DISPOSITIONS } = CONST;
      this.updateSource({
        "ownership.default": DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        prototypeToken: {
          actorLink: true,
          width: 4,
          height: 3,
          lockRotation: true,
          displayName: TOKEN_DISPLAY_MODES.HOVER,
          disposition: TOKEN_DISPOSITIONS.NEUTRAL,
          sight: { enabled: false },
          texture: { fit: "cover" }
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

  /** Adjust Stamps by `delta`, never below zero. @returns {Promise<number>} the new total */
  async adjustStamps(delta) {
    const stamps = Math.max(0, this.system.stamps + delta);
    await this.update({ "system.stamps": stamps });
    return stamps;
  }

  async adjustTenure(delta) {
    const tenure = Math.max(0, this.system.tenure + delta);
    await this.update({ "system.tenure": tenure });
    return tenure;
  }
}
