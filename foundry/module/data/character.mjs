import { SKILLS, SKILL_MAX, STARTING_SPREAD } from "../config.mjs";
import { noticeTrackField, migrateOldNotices } from "./track.mjs";

const { SchemaField, NumberField, StringField, BooleanField } = foundry.data.fields;

export default class CharacterData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CANTICA.Character"];

  static defineSchema() {
    const skills = {};
    for (const key of SKILLS) {
      skills[key] = new NumberField({ required: true, nullable: false, integer: true, min: 0, max: SKILL_MAX, initial: 0 });
    }

    const trait = () => new StringField({ required: true, blank: true, initial: "" });

    return {
      skills: new SchemaField(skills),

      traits: new SchemaField({
        station: trait(),
        deck: trait(),
        bond: trait(),
        encumbrance: trait()
      }),

      // Touched characters add a Gift: a Trait that adds its die and turns up to two dice violet.
      touched: new BooleanField({ initial: false }),
      gift: trait(),

      stamps: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      tenure: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),

      // One shared track: 2 Minor boxes, 1 Major box, 1 Final box.
      notices: noticeTrackField(),

      notes: new StringField({ required: true, blank: true, initial: "" })
    };
  }

  static migrateData(source) {
    return super.migrateData(migrateOldNotices(source));
  }

  /**
   * Informational only: does the current skill spread match the starting spread?
   * It will rightly stop matching once Tenure raises skills.
   */
  prepareDerivedData() {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const key of SKILLS) counts[this.skills[key]]++;
    this.spread = {
      counts,
      matchesStart: Object.entries(STARTING_SPREAD).every(([rating, n]) => counts[rating] === n)
    };
  }
}
