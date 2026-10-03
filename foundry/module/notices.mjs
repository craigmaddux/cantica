/**
 * The Notice track (spec v0.6). Pure functions, unit-tested in Node.
 *
 * One shared track for Characters and Major NPCs:
 *   [ Minor ] [ Minor ]
 *   [ Major ] [ Major ]
 *   [ Final ]
 * Each box holds a named Notice of type B (Body) or S (Standing), plus a "clears by" line.
 *
 * Overflow: with both Minor boxes full, a new Minor becomes a Major; with both Major
 * boxes full, the next hit is Final (taken out of the scene).
 */

export const SLOTS = ["minor1", "minor2", "major1", "major2", "final"];
export const NOTICE_TYPES = ["B", "S"];

/** Which boxes each tier has. Final is always present; it means "taken out". */
export const TIER_CAPACITY = {
  background: { minor: 0, major: 0 }, // any Notice takes them out
  minor: { minor: 1, major: 0 },      // the next Notice, or any Major, takes them out
  major: { minor: 2, major: 2 }       // a full track, like a PC
};

/** Characters have the full track. */
export const CHARACTER_TIER = "major";

export const MINOR_SLOTS = ["minor1", "minor2"];
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
 * Bring an older stored track up to the current shape:
 *  - v0.2 had one Major box, named "major": it becomes major1.
 *  - v0.5.0 had a third Minor box. A filled third Minor moves up into a free Major box (or Final),
 *    and a default "end of session" clears-by becomes the Major default for its type.
 */
export function migrateTrack(old) {
  if (!old || typeof old !== "object") return old;
  const next = { ...old };
  if ("major" in next && !("major1" in next)) {
    next.major1 = next.major;
    delete next.major;
  }
  if ("minor3" in next) {
    const third = next.minor3;
    delete next.minor3;
    if (isFilled(third)) {
      const home = ["major1", "major2", "final"].find(slot => !isFilled(next[slot]));
      if (home) {
        const wasDefault = !third.clearsBy || third.clearsBy === "end of session";
        next[home] = { ...third, clearsBy: wasDefault ? defaultClearsBy(slotKind(home), third.type) : third.clearsBy };
      }
    }
  }
  return next;
}
