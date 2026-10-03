import { SKILLS, SKILL_MAX, OPEN_TRAITS } from "../config.mjs";
import { RULE_BREAKS } from "../rules.mjs";
import {
  gradeFor, ROMAN, marginTarget, stampsPerSession, commendationSlots, skillsCost, CREATION_BUDGET, TRAIT_BASE, TRAIT_MAX, TRAIT_RANK_MAX
} from "../progression.mjs";
import { noticeTrackField, migrateOldNotices } from "./track.mjs";

const { SchemaField, NumberField, StringField, BooleanField, ArrayField } = foundry.data.fields;

/** Station and the open Traits: the keys that carry a rank. */
const RANKED_TRAITS = ["station", ...OPEN_TRAITS];

export default class CharacterData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CANTICA.Character"];

  static defineSchema() {
    const skills = {};
    for (const key of SKILLS) {
      skills[key] = new NumberField({ required: true, nullable: false, integer: true, min: 0, max: SKILL_MAX, initial: 0 });
    }

    const text = () => new StringField({ required: true, blank: true, initial: "" });
    const count = (initial = 0) => new NumberField({ required: true, nullable: false, integer: true, min: 0, initial });

    const openTraits = {};
    for (const key of OPEN_TRAITS) openTraits[key] = text();

    return {
      skills: new SchemaField(skills),

      // Station is required (your high concept). Three open Traits to start; more can be bought, up to six.
      traits: new SchemaField({ station: text(), ...openTraits }),
      // Each Trait has a rank, 1 or 2: it adds that many dice. Rank 2 costs 6 Tenure and needs Grade III.
      traitRanks: new SchemaField(Object.fromEntries(RANKED_TRAITS.map(key =>
        [key, new NumberField({ required: true, nullable: false, integer: true, min: 1, max: TRAIT_RANK_MAX, initial: 1 })]))),
      traitSlots: new NumberField({ required: true, nullable: false, integer: true, min: TRAIT_BASE, max: TRAIT_MAX, initial: TRAIT_BASE }),

      // Two Encumbrances: they never add dice. If any is in play the Margin of Error widens to 1-2.
      encumbrances: new SchemaField({ personal: text(), circumstantial: text() }),

      // Touched characters add a Gift (no die of its own: it turns a white die violet, or adds one violet die to a pool
      // that is only the Margin) and a Drawback
      // (a third Encumbrance). Registered: Form TH-14(C).
      touched: new BooleanField({ initial: false }),
      gift: text(),
      drawback: text(),
      registered: new BooleanField({ initial: false }),

      stamps: count(),

      // Grade follows lifetime Tenure earned; unspent is what you can spend.
      tenureEarned: count(),
      tenureUnspent: count(),

      // Character creation: a 15 Tenure skill budget, maximum rating 2. Finished once, then Tenure is spent in play.
      // Off by default, so imported and older characters are never reopened; a brand-new character
      // is switched on in CanticaActor#_preCreate.
      creation: new BooleanField({ initial: false }),

      commendations: new ArrayField(new SchemaField({
        id: new StringField({ required: true, blank: false }),
        name: text(),
        situation: text(),
        ruleBreak: new StringField({ required: true, choices: RULE_BREAKS, initial: "trait2" })
      })),

      // The log: Tenure earned, purchases, Compline answers, a highlight when a Grade is reached.
      history: new ArrayField(new SchemaField({
        id: new StringField({ required: true, blank: false }),
        at: new NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
        kind: new StringField({ required: true, choices: ["earned", "spent", "compline", "note"], initial: "note" }),
        session: text(),
        amount: new NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
        reason: text(),
        gradeUp: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      })),

      // One shared track: 2 Minor boxes, 2 Major boxes, 1 Final box.
      notices: noticeTrackField(),

      notes: text()
    };
  }

  /** Bring older actors up to the current shape. */
  static migrateData(source) {
    // v0.4: Deck and Bond became open Traits; the old Encumbrance became the circumstantial one.
    const old = source.traits;
    if (old && typeof old === "object") {
      if (old.deck !== undefined) { if (!old.trait1) old.trait1 = old.deck; delete old.deck; }
      if (old.bond !== undefined) { if (!old.trait2) old.trait2 = old.bond; delete old.bond; }
      if (old.encumbrance !== undefined) {
        source.encumbrances ??= {};
        if (!source.encumbrances.circumstantial) source.encumbrances.circumstantial = old.encumbrance;
        delete old.encumbrance;
      }
    }

    // v0.5: Tenure split into earned (sets Grade) and unspent.
    if (typeof source.tenure === "number") {
      source.tenureEarned ??= source.tenure;
      source.tenureUnspent ??= source.tenure;
      delete source.tenure;
    }

    // v0.7: there is no skill rating 3. Any skill at 3 drops to 2 and refunds the 6 Tenure it cost,
    // to unspent only: Tenure earned, and so Grade, never changes.
    if (source.skills && typeof source.skills === "object") {
      let refund = 0;
      for (const [key, rating] of Object.entries(source.skills)) {
        if (rating > SKILL_MAX) { refund += 6 * (rating - SKILL_MAX); source.skills[key] = SKILL_MAX; }
      }
      if (refund) source.tenureUnspent = (Number(source.tenureUnspent) || 0) + refund;
    }

    // v0.7: the Commendation rule-break "add 2 dice" became "a second Trait also applies".
    if (Array.isArray(source.commendations)) {
      for (const entry of source.commendations) if (entry?.ruleBreak === "dice2") entry.ruleBreak = "trait2";
    }

    return super.migrateData(migrateOldNotices(source));
  }

  prepareDerivedData() {
    const grade = gradeFor(this.tenureEarned);
    this.grade = grade;
    this.gradeRoman = ROMAN[grade];
    this.marginTarget = marginTarget(grade);
    this.stampsPerSession = stampsPerSession(grade);
    this.commendationSlots = commendationSlots(grade);

    // Creation: how much of the 15 Tenure budget the current skills use.
    this.skillSpent = skillsCost(this.skills);
    this.creationRemaining = CREATION_BUDGET - this.skillSpent;
  }
}
