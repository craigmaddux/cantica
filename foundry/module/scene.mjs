/**
 * Scene Cards: pure helpers with no Foundry dependency, unit-tested in Node.
 *
 * A Scene Card is a place on the tabletop. Its Traits are just Traits: short phrases about the
 * place (Steam Everywhere, A Spare Coupling in the Locker). They do two things:
 *   1. A roller may pick ONE of them in the roll dialog, for +1 die.
 *   2. The GM may spend Scrutiny on one after a roll: one success fewer, which the player can
 *      negate by spending a Stamp.
 * A character is "in" a card when their token sits on it.
 */

/** A scene Trait picked in the roll dialog adds this many dice. Only one may be picked. */
export const SCENE_TRAIT_DICE = 1;

/** Is the point inside the rectangle (edges included)? */
export function containsPoint(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

/**
 * Which card is a point on? When cards overlap, the smallest one wins (it is the
 * more specific place); equal sizes fall to the one drawn on top (higher sort).
 * @param {{x: number, y: number}} point  Usually the center of the character's token.
 * @param {{id: string, x: number, y: number, w: number, h: number, sort?: number}[]} cards
 * @returns {string|null} the card's id
 */
export function pickCard(point, cards) {
  const hits = cards.filter(card => containsPoint(card, point));
  if (!hits.length) return null;
  hits.sort((a, b) => (a.w * a.h) - (b.w * b.h) || (b.sort ?? 0) - (a.sort ?? 0));
  return hits[0].id;
}

/** A new scene Trait: a phrase, and an optional note on how it plays. */
export function newTrait({ id, name = "", note = "" } = {}) {
  return { id, name: String(name).trim(), note: String(note).trim() };
}

/** Dice a chosen scene Trait contributes (none if nothing is chosen). */
export const sceneTraitDice = chosen => (chosen ? SCENE_TRAIT_DICE : 0);

/**
 * Of the scene Traits ticked in the dialog, only the first counts: only one scene Trait
 * can be added to a roll.
 */
export const firstScene = picks => (Array.isArray(picks) ? picks[0] ?? null : picks ?? null);
