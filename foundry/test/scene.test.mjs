import { test } from "node:test";
import assert from "node:assert/strict";
import { containsPoint, pickCard, visibleTraits, tally, newTrait } from "../module/scene.mjs";

const room = { id: "engine", x: 0, y: 0, w: 400, h: 300, sort: -1000 };
const corner = { id: "locker", x: 300, y: 200, w: 100, h: 100, sort: -999 };

test("a point inside a card is on it; edges count", () => {
  assert.equal(containsPoint(room, { x: 200, y: 150 }), true);
  assert.equal(containsPoint(room, { x: 0, y: 0 }), true);
  assert.equal(containsPoint(room, { x: 400, y: 300 }), true);
  assert.equal(containsPoint(room, { x: 401, y: 150 }), false);
});

test("pickCard finds the card under a token", () => {
  assert.equal(pickCard({ x: 50, y: 50 }, [room, corner]), "engine");
  assert.equal(pickCard({ x: 900, y: 900 }, [room, corner]), null);
  assert.equal(pickCard({ x: 50, y: 50 }, []), null);
});

test("overlapping cards: the smaller, more specific one wins", () => {
  assert.equal(pickCard({ x: 350, y: 250 }, [room, corner]), "locker");
  assert.equal(pickCard({ x: 350, y: 250 }, [corner, room]), "locker");
});

test("equal-size overlap falls to the card on top", () => {
  const a = { id: "a", x: 0, y: 0, w: 100, h: 100, sort: -1000 };
  const b = { id: "b", x: 0, y: 0, w: 100, h: 100, sort: -990 };
  assert.equal(pickCard({ x: 10, y: 10 }, [a, b]), "b");
});

test("players don't see GM-only traits", () => {
  const traits = [{ name: "Steam", hidden: false }, { name: "Loose panel", hidden: true }];
  assert.deepEqual(visibleTraits(traits, false).map(t => t.name), ["Steam"]);
  assert.equal(visibleTraits(traits, true).length, 2);
});

test("ticked traits become +/- dice", () => {
  const traits = [
    { effect: "obstacle" }, { effect: "obstacle" }, { effect: "circumstance" }
  ];
  assert.deepEqual(tally(traits), { circumstances: 1, obstacles: 2 });
  assert.deepEqual(tally([]), { circumstances: 0, obstacles: 0 });
});

test("new traits: obstacles apply automatically, circumstances are opt-in", () => {
  assert.equal(newTrait({ id: "1", name: "Darkness", effect: "obstacle" }).auto, true);
  assert.equal(newTrait({ id: "2", name: "Spare coupling", effect: "circumstance" }).auto, false);
  assert.equal(newTrait({ id: "3", name: "Odd", effect: "nonsense" }).effect, "obstacle");
  assert.equal(newTrait({ id: "4", name: "  Steam  " }).name, "Steam");
  assert.equal(newTrait({ id: "5", name: "x", effect: "circumstance", auto: true }).auto, true);
});
