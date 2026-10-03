/**
 * Scene Cards: pure helpers with no Foundry dependency, unit-tested in Node.
 *
 * A Scene Card is an actor dragged onto the tabletop as a large token. It carries
 * a list of Traits: each is a +1 Circumstance or a −1 Obstacle. A character is "in"
 * a card when their token sits on it; the roll dialog uses that card's Traits.
 */

export const EFFECTS = ["circumstance", "obstacle"];

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

/** Players never see GM-only (hidden) Traits. */
export function visibleTraits(traits, isGM) {
  return isGM ? traits : traits.filter(trait => !trait.hidden);
}

/** Dice a set of ticked Traits contributes: +1 per Circumstance, −1 per Obstacle. */
export function tally(traits) {
  return {
    circumstances: traits.filter(t => t.effect === "circumstance").length,
    obstacles: traits.filter(t => t.effect === "obstacle").length
  };
}

/**
 * A new Trait. Obstacles apply automatically by default (darkness hits everyone);
 * Circumstances are opt-in, since they help "anyone who can plausibly use them".
 */
export function newTrait({ id, name = "", note = "", effect = "obstacle", auto, hidden = false } = {}) {
  const kind = EFFECTS.includes(effect) ? effect : "obstacle";
  return {
    id,
    name: String(name).trim(),
    note: String(note).trim(),
    effect: kind,
    auto: auto ?? kind === "obstacle",
    hidden: Boolean(hidden)
  };
}
