/**
 * Dockets: a job that builds up over several rounds, against a Deadline. Venting a compartment before the
 * jump, forging the paperwork before the Proctor returns. The GM opens a Docket with boxes to fill and a
 * Deadline in rounds (usually 3). Every success fills one box (raw successes, not result tiers). Each round
 * everyone rolls once. A Margin of Error moves the Deadline up one round, and so can the GM, with Scrutiny.
 *
 * A Docket lives on a Scene Card, and only the GM sees it. Pure functions with no Foundry dependency, so the
 * same logic is unit-tested in Node (see test/docket.test.mjs).
 *
 * A docket is { open, name, boxes, deadline, round, successes }.
 */

export const DEFAULT_ROUNDS = 3;

/** Boxes per player for a 3-round Deadline and ~4-dice pools. Standard is about even odds. */
export const SIZING = { routine: 3, standard: 4, hard: 5 };

/** Boxes for a number of players: 4 players, Standard is 16. A two-round Deadline makes anything one step harder. */
export const sizeFor = (players, level = "standard") =>
  Math.max(1, Math.trunc(Number(players)) || 1) * (SIZING[level] ?? SIZING.standard);

const whole = n => Math.max(0, Math.trunc(Number(n)) || 0);

/** Boxes filled (successes beyond the last box are still counted, but there is nothing left to fill). */
export const filledBoxes = d => Math.min(whole(d.boxes), whole(d.successes));

/** Rounds left, counting the one in play. */
export const roundsLeft = d => Math.max(0, whole(d.deadline) - whole(d.round) + 1);

export const isFull = d => whole(d.boxes) > 0 && whole(d.successes) >= whole(d.boxes);

export const isExpired = d => whole(d.round) > whole(d.deadline);

/** "full" (it works), "expired" (the Deadline passed), or "open". */
export const status = d => (isFull(d) ? "full" : isExpired(d) ? "expired" : "open");

/**
 * How it ends: full, it works cleanly; at the Deadline with half the boxes or more, it half works (something is
 * saved, something is lost, or it works at a real cost); with fewer, it fails. Null while it is still open.
 */
export function outcome(d) {
  const s = status(d);
  if (s === "open") return null;
  if (s === "full") return "works";
  return whole(d.successes) * 2 >= whole(d.boxes) ? "half" : "fails";
}

export const addSuccesses = (d, n) => ({ ...d, successes: Math.max(0, whole(d.successes) + Math.trunc(Number(n) || 0)) });

/** A Margin of Error, or Scrutiny: the Deadline moves up one round. */
export const pushDeadline = d => ({ ...d, deadline: Math.max(0, whole(d.deadline) - 1) });

export const nextRound = d => ({ ...d, round: whole(d.round) + 1 });

/** A fresh Docket, open. */
export const open = ({ name = "", boxes = 0, deadline = DEFAULT_ROUNDS } = {}) =>
  ({ open: true, name, boxes: whole(boxes), deadline: whole(deadline), round: 1, successes: 0 });

/**
 * Count a roll into a Docket. A card is counted by what it shows now (after any Refile or Complication), and counting
 * it again only adds the difference. A Margin of Error on it moves the Deadline up, once.
 * @param {object} docket
 * @param {{shown: number, counted?: number, error?: boolean, errorCounted?: boolean}} roll
 * @returns {{docket: object, counted: number, errorCounted: boolean, pushed: boolean, delta: number}}
 */
export function countRoll(docket, { shown, counted = 0, error = false, errorCounted = false }) {
  const delta = whole(shown) - whole(counted);
  let next = addSuccesses(docket, delta);
  const pushed = Boolean(error) && !errorCounted;
  if (pushed) next = pushDeadline(next);
  return { docket: next, counted: whole(shown), errorCounted: Boolean(error) || errorCounted, pushed, delta };
}
