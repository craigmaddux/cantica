import { SKILLS, SKILL_MAX, STARTING_SPREAD, NOTICE_STATUSES } from "../config.mjs";

const { SchemaField, NumberField, StringField, BooleanField, ArrayField } = foundry.data.fields;

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

      // Harm arrives as named Notices with a bureaucratic status.
      notices: new ArrayField(new SchemaField({
        name: new StringField({ required: true, blank: true, initial: "" }),
        status: new StringField({ required: true, choices: NOTICE_STATUSES, initial: "pending" })
      })),

      notes: new StringField({ required: true, blank: true, initial: "" })
    };
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
