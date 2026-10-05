const { SchemaField, ArrayField, StringField, BooleanField, NumberField } = foundry.data.fields;

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

      // A Docket in this scene: a job against a Deadline (see docket.mjs). Only the GM sees it; the table sees
      // only the running tally of successes, on the card's token and panel.
      docket: new SchemaField({
        open: new BooleanField({ initial: false }),
        name: new StringField({ required: true, blank: true, initial: "" }),
        boxes: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        deadline: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 3 }),
        round: new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
        successes: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      }),

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
