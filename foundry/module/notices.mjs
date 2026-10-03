/**
 * The Notice track (spec v0.5). Pure functions, unit-tested in Node.
 *
 * One shared track for Characters and Major NPCs:
 *   [ Minor ] [ Minor ] [ Minor ]
 *   [ Major ] [ Major ]
 *   [ Final ]
 * Each box holds a named Notice of type B (Body) or S (Standing), plus a "clears by" line.
 *
 * Overflow: with all three Minor boxes full, a new Minor becomes a Major; with both Major
 * boxes full, the next hit is Final (taken out of the scene).
 */

export const SLOTS = ["minor1", "minor2", "minor3", "major1", "major2", "final"];
export const NOTICE_TYPES = ["B", "S"];

/** Which boxes each tier has. Final is always present; it means "taken out". */
export const TIER_CAPACITY = {
  background: { minor: 0, major: 0 }, // any Notice takes them out
  minor: { minor: 1, major: 0 },      // the next Notice, or any Major, takes them out
  major: { minor: 3, major: 2 }       // a full track, like a PC
};

/** Characters have the full track. */
export const CHARACTER_TIER = "major";

export const MINOR_SLOTS = ["minor1", "minor2", "minor3"];
export const MAJOR_SLOTS = ["major1", "major2"];

export const slotKind = slot => (slot.startsWith("minor") ? "minor" : slot.startsWith("major") ? "major" : "final");

export const emptySlot = () => ({ name: "", type: "B", clearsBy: "" });
export const emptyTrack = () => Object.fromEntries(SLOTS.map(slot => [slot, emptySlot()]));
export const isFilled = slot => Boolean(slot?.name?.trim());

/**
 * What a Notice clears by, unless the player wrote their own:
 * Minor: end of session. Major Body: treatment. Major Standing: a scene with another person.
 */
export function defaultClearsBy(kind, type) {
  if (kind === "minor") return "end of session";
  if (kind === "major") return type === "S" ? "a scene with another person" : "treatment";
  return "";
}

/** Slots visible for a tier, in display order. */
export function slotsFor(tier) {
  const cap = TIER_CAPACITY[tier] ?? TIER_CAPACITY[CHARACTER_TIER];
  return [...MINOR_SLOTS.slice(0, cap.minor), ...MAJOR_SLOTS.slice(0, cap.major), "final"];
}

/** Are all the Minor boxes this tier has full? (A new Minor would overflow.) */
export function minorsFull(track, tier) {
  const cap = TIER_CAPACITY[tier] ?? TIER_CAPACITY[CHARACTER_TIER];
  return cap.minor > 0 && MINOR_SLOTS.slice(0, cap.minor).every(slot => isFilled(track?.[slot]));
}

/**
 * Land a Notice on a track.
 * @param {object} track   Current track, keyed by slot.
 * @param {string} tier    background | minor | major
 * @param {"minor"|"major"} kind  Severity of the incoming Notice.
 * @param {{name: string, type: string, clearsBy?: string}} notice
 * @returns {{track: object, slot: string, overflowed: boolean, out: boolean}}
 */
export function placeNotice(track, tier, kind, notice) {
  const cap = TIER_CAPACITY[tier] ?? TIER_CAPACITY[CHARACTER_TIER];
  const next = structuredClone({ ...emptyTrack(), ...track });
  const type = NOTICE_TYPES.includes(notice.type) ? notice.type : "B";
  let overflowed = false;
  let target = null;

  if (kind === "minor") {
    target = MINOR_SLOTS.slice(0, cap.minor).find(slot => !isFilled(next[slot])) ?? null;
    if (!target) { kind = "major"; overflowed = true; }
  }
  if (!target && kind === "major") {
    target = MAJOR_SLOTS.slice(0, cap.major).find(slot => !isFilled(next[slot])) ?? null;
    if (!target) overflowed = true;
  }
  if (!target) target = "final";

  const landed = slotKind(target);
  next[target] = {
    name: notice.name.trim(),
    type,
    clearsBy: (notice.clearsBy ?? "").trim() || defaultClearsBy(landed, type)
  };
  return { track: next, slot: target, overflowed, out: target === "final" };
}

/** End of session: clear all Minor Notices. */
export function clearMinors(track) {
  const next = structuredClone({ ...emptyTrack(), ...track });
  for (const slot of MINOR_SLOTS) next[slot] = emptySlot();
  return next;
}

/**
 * Bring an older stored track (v0.2: minor1, minor2, major, final, no clears-by)
 * up to the current shape.
 */
export function migrateTrack(old) {
  if (!old || typeof old !== "object") return old;
  const next = { ...old };
  if ("major" in next && !("major1" in next)) {
    next.major1 = next.major;
    delete next.major;
  }
  return next;
}
