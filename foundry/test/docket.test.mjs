import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sizeFor, SIZING, filledBoxes, roundsLeft, isFull, isExpired, status, outcome, addSuccesses, pushDeadline, nextRound, open, countRoll
} from "../module/docket.mjs";

test("sizing: 3, 4 or 5 boxes per player for a 3-round Deadline (spec and GM primer)", () => {
  assert.deepEqual(SIZING, { routine: 3, standard: 4, hard: 5 });
  // the GM primer's table
  assert.deepEqual([2, 3, 4, 5].map(p => sizeFor(p, "routine")), [6, 9, 12, 15]);
  assert.deepEqual([2, 3, 4, 5].map(p => sizeFor(p, "standard")), [8, 12, 16, 20]);
  assert.deepEqual([2, 3, 4, 5].map(p => sizeFor(p, "hard")), [10, 15, 20, 25]);
  assert.equal(sizeFor(0), 4);
});

test("a Docket opens at round 1 with nothing filled", () => {
  const d = open({ name: "Before the jump", boxes: 12 });
  assert.deepEqual([d.open, d.boxes, d.deadline, d.round, d.successes], [true, 12, 3, 1, 0]);
  assert.equal(status(d), "open");
  assert.equal(roundsLeft(d), 3);
});

test("every success fills a box, and the count can't go below zero", () => {
  let d = open({ boxes: 5 });
  d = addSuccesses(d, 3);
  assert.equal(filledBoxes(d), 3);
  d = addSuccesses(d, 4);
  assert.equal(d.successes, 7);
  assert.equal(filledBoxes(d), 5);
  assert.equal(isFull(d), true);
  assert.equal(addSuccesses(open({ boxes: 5 }), -3).successes, 0);
});

test("rounds pass, and a push moves the Deadline up one", () => {
  let d = open({ boxes: 8 });
  d = nextRound(d);
  assert.equal(roundsLeft(d), 2);
  d = pushDeadline(d);
  assert.equal(d.deadline, 2);
  assert.equal(roundsLeft(d), 1);
  d = nextRound(d);
  assert.equal(isExpired(d), true);
  assert.equal(roundsLeft(d), 0);
  assert.equal(pushDeadline({ ...d, deadline: 0 }).deadline, 0);
});

test("how it ends: full works; at the Deadline half or more half works; less fails", () => {
  const base = open({ boxes: 10 });
  assert.equal(outcome(base), null);
  assert.equal(outcome({ ...base, successes: 10 }), "works");
  assert.equal(outcome({ ...base, successes: 12 }), "works");
  const late = { ...base, round: 4 };
  assert.equal(outcome({ ...late, successes: 5 }), "half");
  assert.equal(outcome({ ...late, successes: 9 }), "half");
  assert.equal(outcome({ ...late, successes: 4 }), "fails");
  // filling the last box in time works even with rounds to spare
  assert.equal(status({ ...base, round: 2, successes: 10 }), "full");
});

test("counting a roll adds its successes, and counting it again adds only the difference", () => {
  const d = open({ boxes: 12 });
  const first = countRoll(d, { shown: 2 });
  assert.equal(first.docket.successes, 2);
  assert.equal(first.counted, 2);
  // the player Refiles into a hit: the card now shows 3
  const again = countRoll(first.docket, { shown: 3, counted: first.counted });
  assert.equal(again.docket.successes, 3);
  assert.equal(again.delta, 1);
  // the GM complicates it down to 2
  const down = countRoll(again.docket, { shown: 2, counted: again.counted });
  assert.equal(down.docket.successes, 2);
  assert.equal(down.delta, -1);
});

test("a Margin of Error on a counted roll moves the Deadline up, once", () => {
  const d = open({ boxes: 12 });
  const a = countRoll(d, { shown: 1, error: true });
  assert.equal(a.pushed, true);
  assert.equal(a.docket.deadline, 2);
  const b = countRoll(a.docket, { shown: 2, counted: a.counted, error: true, errorCounted: a.errorCounted });
  assert.equal(b.pushed, false);
  assert.equal(b.docket.deadline, 2);
  assert.equal(b.docket.successes, 2);
  assert.equal(countRoll(d, { shown: 1 }).docket.deadline, 3);
});
