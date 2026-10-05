import { test } from "node:test";
import assert from "node:assert/strict";
import { wrap, clampLines, layoutCard, cardHash, imageSize, coverCrop, PLATE_START, plateStartFor } from "../module/card-layout.mjs";

// A stand-in for measuring text: every character is half the font size wide.
const measure = (text, font) => text.length * (parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1]) * 0.5);

test("wrap breaks at spaces and keeps every line within the width", () => {
  const font = "20px serif";
  const lines = wrap("Recyclers shudder on their mounts and the air tastes of warm metal", font, 200, measure);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(measure(line, font) <= 200 || !line.includes(" "), line);
  assert.equal(lines.join(" "), "Recyclers shudder on their mounts and the air tastes of warm metal");
});

test("a single word wider than the line is kept whole, not lost", () => {
  assert.deepEqual(wrap("Extraordinarily", "20px serif", 40, measure), ["Extraordinarily"]);
});

test("clampLines cuts to the limit and ends in an ellipsis that fits", () => {
  const font = "20px serif";
  const lines = wrap("one two three four five six seven eight nine ten eleven twelve", font, 120, measure);
  const clamped = clampLines(lines, 2, font, 120, measure);
  assert.equal(clamped.length, 2);
  assert.ok(clamped[1].endsWith("…"));
  assert.ok(measure(clamped[1], font) <= 120);
  assert.deepEqual(clampLines(["short"], 2, font, 120, measure), ["short"]);
});

const card = (over = {}) => ({
  name: "Engine Room",
  description: "Recyclers shudder on their mounts and the air tastes of warm metal. Third shift is mid-handover and nobody is sure whose problem the noise is.",
  traits: ["Steam Everywhere", "Third-Shift Crew in the Way", "A Spare Coupling in the Locker", "The Hatch Was Unlocked All Along", "Loud Enough to Hide a Conversation", "One More Trait Than Fits"],
  width: 800, height: 800, ...over
});

const texts = layout => layout.ops.filter(op => op.t === "text");

test("text fits inside the card for every token shape, wide or tall, big or small", () => {
  const shapes = [[4, 3], [4, 4], [6, 2], [3, 5], [8, 2], [2, 2], [10, 6]];
  for (const [sw, sh] of shapes) {
    const { width, height } = imageSize(sw, sh);
    const layout = layoutCard(card({ width, height }), measure);
    for (const op of texts(layout)) {
      const px = parseFloat(op.font.match(/(\d+(?:\.\d+)?)px/)[1]);
      assert.ok(op.y >= 0 && op.y + px <= height, `${sw}x${sh}: "${op.text}" runs off the bottom (y ${op.y}, ${px}px, card ${height})`);
      assert.ok(op.x + measure(op.text, op.font) <= width + 1, `${sw}x${sh}: "${op.text}" runs off the side`);
    }
    // the name is always shown
    assert.ok(texts(layout).some(op => op.text === "Engine Room"), `${sw}x${sh} shows the name`);
  }
});

test("a low, wide card starts its plate higher, and still shows some Traits", () => {
  assert.equal(plateStartFor(1200, 400), 0.28);
  assert.equal(plateStartFor(800, 600), PLATE_START);
  const wide = layoutCard(card({ width: 1200, height: 400 }), measure);
  assert.ok(wide.shown >= 1, "at least one Trait fits on a 6x2 card");
});

test("the card has a plate, the name, a clamped place, and its Traits", () => {
  const layout = layoutCard(card(), measure);
  const lines = texts(layout).map(op => op.text);
  assert.ok(lines.includes("Engine Room"));
  assert.ok(lines.includes("TRAITS"));
  assert.ok(lines.some(l => l.startsWith("◆ Steam Everywhere")));
  assert.equal(layout.plateTop, Math.round(800 * PLATE_START));
  // the place is at most two lines
  assert.ok(texts(layout).filter(op => op.font.startsWith("italic") && !op.text.startsWith("+")).length <= 2);
});

test("nothing is drawn below the card, and what doesn't fit is counted", () => {
  const layout = layoutCard(card({ width: 400, height: 400 }), measure);
  for (const op of texts(layout)) assert.ok(op.y <= 400, `${op.text} at ${op.y}`);
  assert.equal(layout.shown + layout.more, 6);
  assert.ok(layout.more > 0, "some Traits don't fit on a small card");
  assert.ok(texts(layout).some(op => op.text === `+ ${layout.more} more`));
});

test("a roomy card shows every Trait and no 'more'", () => {
  const layout = layoutCard(card({ traits: ["Crowded", "Everything Is Negotiable"], width: 800, height: 800 }), measure);
  assert.equal(layout.more, 0);
  assert.ok(!texts(layout).some(op => op.text.startsWith("+")));
});

test("a card with no Traits and no place still shows its name", () => {
  const layout = layoutCard({ name: "A Place With No Art Yet", description: "", traits: [], width: 800, height: 600 }, measure);
  assert.ok(texts(layout).some(op => op.text.startsWith("A Place")));
  assert.ok(!texts(layout).some(op => op.text === "TRAITS"));
});

test("a long name wraps rather than running off the card", () => {
  const layout = layoutCard(card({ name: "The Office of Unclaimed Articles, Deck Nine Off the Spine", width: 400, height: 400 }), measure);
  const titleLines = texts(layout).filter(op => op.fill === "#e8eef8" && !op.text.startsWith("◆"));
  assert.ok(titleLines.length > 1);
  for (const op of titleLines) assert.ok(op.x + measure(op.text, op.font) <= 400, op.text);
});

test("the hash changes when the card changes, and is stable when it doesn't", () => {
  const a = cardHash({ name: "A", traits: ["x"], w: 800 });
  assert.equal(a, cardHash({ name: "A", traits: ["x"], w: 800 }));
  assert.notEqual(a, cardHash({ name: "A", traits: ["x", "y"], w: 800 }));
  assert.notEqual(a, cardHash({ name: "A", traits: ["x"], w: 400 }));
});

test("the image is 200px per grid square, within limits", () => {
  assert.deepEqual(imageSize(4, 3), { width: 800, height: 600 });
  assert.deepEqual(imageSize(20, 20), { width: 1600, height: 1600 });
  // a big card keeps its shape: 12 x 9 is still 4:3
  assert.deepEqual(imageSize(12, 9), { width: 1600, height: 1200 });
  assert.deepEqual(imageSize(0.5, 0.5), { width: 200, height: 200 });
});

test("a Docket's tally is drawn in the corner and fits the card", () => {
  for (const [sw, sh] of [[4, 3], [12, 9], [3, 2]]) {
    const { width, height } = imageSize(sw, sh);
    const layout = layoutCard({ ...card({ width, height }), tally: 12 }, measure);
    const tag = layout.ops.find(op => op.t === "text" && op.text === "SUCCESSES 12");
    assert.ok(tag, `${sw}x${sh} shows the tally`);
    assert.ok(tag.x >= 0 && tag.x + measure(tag.text, tag.font) <= width, `${sw}x${sh} tally fits across`);
    assert.ok(tag.y + 10 <= layout.plateTop || tag.y < height / 2, `${sw}x${sh} tally sits near the top`);
  }
  // no Docket, no tally
  assert.ok(!layoutCard(card({ width: 800, height: 600 }), measure).ops.some(op => op.text?.startsWith("SUCCESSES")));
  assert.equal(layoutCard({ ...card({ width: 800, height: 600 }), tally: 0 }, measure).ops.filter(op => op.text === "SUCCESSES 0").length, 1);
});

test("the art is cropped to cover the card, never stretched or left short", () => {
  // square art into a wide card: full width, a band of the height
  const wide = coverCrop(1000, 1000, 800, 600);
  assert.equal(Math.round(wide.sw), 1000);
  assert.ok(wide.sh < 1000);
  assert.equal(Math.round(wide.sh / wide.sw * 1000) / 1000, 0.75); // the card's 4:3 shape
  // a tall card from wide art: full height, a slice of the width
  const tall = coverCrop(2000, 1000, 400, 800);
  assert.equal(Math.round(tall.sh), 1000);
  assert.ok(tall.sw < 2000);
  // the crop window always lies inside the picture
  for (const c of [wide, tall]) { assert.ok(c.sx >= 0 && c.sy >= 0); }
  // exact aspect match: no crop at all
  const same = coverCrop(800, 600, 400, 300);
  assert.deepEqual([Math.round(same.sx), Math.round(same.sy), Math.round(same.sw), Math.round(same.sh)], [0, 0, 800, 600]);
});
