import { EFFECTS } from "../scene.mjs";

const { SchemaField, ArrayField, StringField, BooleanField } = foundry.data.fields;

/**
 * A Scene Card: a place, drawn onto the tabletop as a large token. Its Traits are the
 * environmental dice for anyone standing on it. The card's art is the actor's image.
 */
export default class CardData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CANTICA.Card"];

  static defineSchema() {
    return {
      description: new StringField({ required: true, blank: true, initial: "" }),

      // The scene everyone falls back to when their token isn't standing on a card.
      active: new BooleanField({ initial: false }),

      traits: new ArrayField(new SchemaField({
        id: new StringField({ required: true, blank: false }),
        name: new StringField({ required: true, blank: true, initial: "" }),
        note: new StringField({ required: true, blank: true, initial: "" }),
        // A +1 Circumstance or a −1 Obstacle.
        effect: new StringField({ required: true, choices: EFFECTS, initial: "obstacle" }),
        // Applies without asking (darkness) or is opt-in (a handy pipe).
        auto: new BooleanField({ initial: true }),
        // GM-only until revealed.
        hidden: new BooleanField({ initial: false })
      }))
    };
  }
}
