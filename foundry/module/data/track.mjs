import { SLOTS, NOTICE_TYPES, migrateTrack } from "../notices.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * The shared Notice track: three Minor boxes, two Major boxes, one Final.
 * Each box is a named Notice of type B or S, with a "clears by" line.
 */
export function noticeTrackField() {
  const slot = () => new SchemaField({
    name: new StringField({ required: true, blank: true, initial: "" }),
    type: new StringField({ required: true, choices: NOTICE_TYPES, initial: "B" }),
    clearsBy: new StringField({ required: true, blank: true, initial: "" })
  });
  return new SchemaField(Object.fromEntries(SLOTS.map(key => [key, slot()])));
}

/**
 * Older worlds stored Notices as a list (v0.1) or as a 2/1/1 track without a clears-by line (v0.2).
 * Drop the list; reshape the track.
 */
export function migrateOldNotices(source) {
  if (Array.isArray(source.notices)) delete source.notices;
  else if (source.notices) source.notices = migrateTrack(source.notices);
  return source;
}
