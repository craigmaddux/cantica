/**
 * The Notice track (spec v0.2). Pure functions, unit-tested in Node.
 *
 * One shared track for Characters and Major NPCs:
 *   [ Minor ] [ Minor ] [ Major ] [ Final ]
 * Each box holds a named Notice of type B (Body) or S (Standing).
 *
 * Overflow: with both Minor boxes full, a new Minor becomes a Major; with the
 * Major box full, the next hit is Final (taken out of the scene).
 */

export const SLOTS = ["minor1", "minor2", "major", "final"];
export const NOTICE_TYPES = ["B", "S"];

/** Which boxes each tier has. Final is always present; it means "taken out". */
export const TIER_CAPACITY = {
  background: { minor: 0, major: 0 }, // any Notice takes them out
  minor: { minor: 1, major: 0 },      // the next Notice, or any Major, takes them out
  major: { minor: 2, major: 1 }       // a full track, like a PC
};

/** Characters have the full track. */
export const CHARACTER_TIER = "major";

export const emptySlot = () => ({ name: "", type: "B" });
export const emptyTrack = () => Object.fromEntries(SLOTS.map(slot => [slot, emptySlot()]));
export const isFilled = slot => Boolean(slot?.name?.trim());

/** Slots visible for a tier, in display order. */
export function slotsFor(tier) {
  const cap = TIER_CAPACITY[tier] ?? TIER_CAPACITY[CHARACTER_TIER];
  return [...["minor1", "minor2"].slice(0, cap.minor), ...(cap.major ? ["major"] : []), "final"];
}

/**
 * Land a Notice on a track.
 * @param {object} track   Current track, keyed by slot.
 * @param {string} tier    background | minor | major
 * @param {"minor"|"major"} kind  Severity of the incoming Notice.
 * @param {{name: string, type: string}} notice
 * @returns {{track: object, slot: string, overflowed: boolean, out: boolean}}
 */
export function placeNotice(track, tier, kind, notice) {
  const cap = TIER_CAPACITY[tier] ?? TIER_CAPACITY[CHARACTER_TIER];
  const next = structuredClone({ ...emptyTrack(), ...track });
  const entry = { name: notice.name.trim(), type: NOTICE_TYPES.includes(notice.type) ? notice.type : "B" };
  let overflowed = false;
  let target = null;

  if (kind === "minor") {
    target = ["minor1", "minor2"].slice(0, cap.minor).find(slot => !isFilled(next[slot])) ?? null;
    if (!target) { kind = "major"; overflowed = true; }
  }
  if (!target && kind === "major") {
    if (cap.major && !isFilled(next.major)) target = "major";
    else overflowed = true;
  }
  if (!target) target = "final";

  next[target] = entry;
  return { track: next, slot: target, overflowed, out: target === "final" };
}

/** End of session: clear all Minor Notices. */
export function clearMinors(track) {
  const next = structuredClone({ ...emptyTrack(), ...track });
  next.minor1 = emptySlot();
  next.minor2 = emptySlot();
  return next;
}
