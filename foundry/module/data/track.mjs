import { SLOTS, NOTICE_TYPES } from "../notices.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/** The shared Notice track: [ Minor ] [ Minor ] [ Major ] [ Final ], each box a named Notice of type B or S. */
export function noticeTrackField() {
  const slot = () => new SchemaField({
    name: new StringField({ required: true, blank: true, initial: "" }),
    type: new StringField({ required: true, choices: NOTICE_TYPES, initial: "B" })
  });
  return new SchemaField(Object.fromEntries(SLOTS.map(key => [key, slot()])));
}

/** v0.1 stored Notices as a list; the track replaces it. Drop the old shape rather than fail validation. */
export function migrateOldNotices(source) {
  if (Array.isArray(source.notices)) delete source.notices;
  return source;
}
