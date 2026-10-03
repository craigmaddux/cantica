const { SchemaField, ArrayField, StringField, BooleanField } = foundry.data.fields;

/**
 * A Scene Card: a place, drawn onto the tabletop. Its Traits are just Traits: short phrases about
 * the place. A roller may pick one for +1 die; the GM may spend Scrutiny on one against a roll.
 * The card's art is the actor's image.
 */
export default class CardData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CANTICA.Card"];

  static defineSchema() {
    return {
      description: new StringField({ required: true, blank: true, initial: "" }),

      // The scene everyone falls back to when their token isn't standing on a card.
      active: new BooleanField({ initial: false }),

      // Just Traits: a phrase, and an optional note on how it plays. (Older cards also stored an
      // effect, "applies automatically" and "GM only"; those are dropped.)
      traits: new ArrayField(new SchemaField({
        id: new StringField({ required: true, blank: false }),
        name: new StringField({ required: true, blank: true, initial: "" }),
        note: new StringField({ required: true, blank: true, initial: "" })
      }))
    };
  }
}
