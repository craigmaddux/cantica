import { NPC_TIERS } from "../config.mjs";
import { noticeTrackField, migrateOldNotices } from "./track.mjs";

const { NumberField, StringField } = foundry.data.fields;

/**
 * Stat block: Name, Rating, Tags (two; a Major has three, one of them the Action Tag), Tier. The GM never rolls; NPCs act through
 * their Rating, which is used directly as the Difficulty of any roll against or
 * to resist them.
 */
export default class NpcData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CANTICA.Npc"];

  static defineSchema() {
    return {
      // 1 ordinary, 2 tough, 3 nemesis, 4 reserved.
      rating: new NumberField({ required: true, nullable: false, integer: true, min: 1, max: 4, initial: 1 }),
      // What they are good at. When a Tag applies, the player loses a die.
      tag1: new StringField({ required: true, blank: true, initial: "" }),
      tag2: new StringField({ required: true, blank: true, initial: "" }),
      // A Major has a third. Only one Tag ever applies to a roll.
      tag3: new StringField({ required: true, blank: true, initial: "" }),
      // Which Tag (1-3) is their Action Tag: what they do when they act (Crack Shot, Silver Tongue).
      actionTag: new NumberField({ required: true, nullable: false, integer: true, min: 1, max: 3, initial: 1 }),
      // Background: any Notice takes them out. Minor: one Minor box. Major: the full track.
      tier: new StringField({ required: true, choices: NPC_TIERS, initial: "minor" }),
      notices: noticeTrackField(),
      notes: new StringField({ required: true, blank: true, initial: "" })
    };
  }

  static migrateData(source) {
    return super.migrateData(migrateOldNotices(source));
  }
}
