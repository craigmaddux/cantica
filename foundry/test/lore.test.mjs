import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { norm, toPlain, unlink, linkify, entryText, buildIndex, search, paragraphs } from "../module/lore-text.mjs";

// Load the real ledger data, exactly as the website and the system do.
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../../ledger-data.js", import.meta.url), "utf8"), ctx);
const entries = ctx.window.LEDGER;
const kinds = ctx.window.LEDGER_KINDS.map(k => k.id);
const byId = Object.fromEntries(entries.map(e => [e.id, e]));
buildIndex(entries, byId);

test("the ledger data is well formed: unique ids, every link resolves", () => {
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  for (const e of entries) {
    assert.ok(kinds.includes(e.kind), `${e.id} kind`);
    for (const p of e.body) for (const m of p.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)) assert.ok(byId[m[1]], `${e.id} links to unknown ${m[1]}`);
  }
});

test("every person and place has what the lore import needs", () => {
  const people = entries.filter(e => e.kind === "people");
  const places = entries.filter(e => e.kind === "places");
  assert.ok(people.length >= 13 && places.length >= 13);
  for (const e of [...people, ...places]) {
    assert.ok(e.name && e.summary, e.id);
    assert.ok(toPlain(paragraphs(e.body), byId).length > 20, `${e.id} has body text`);
  }
});

test("links become labels in plain text and anchors in HTML", () => {
  assert.equal(unlink("See [[chorus|Chorus]] and [[the-bound]].", byId), "See Chorus and the-bound.".replace("the-bound", "The Bound"));
  const html = linkify("Ask [[chorus]].", byId, (id, label) => `<a data-id="${id}">${label}</a>`);
  assert.equal(html, 'Ask <a data-id="chorus">Chorus</a>.');
  assert.equal(linkify("[[nope]]", byId, () => "x"), "nope");
});

test("plain text keeps lists and paragraphs readable", () => {
  const text = toPlain("<p>One &amp; two.</p><ul><li>First</li><li>Second</li></ul><p>End.</p>");
  assert.equal(text, "One & two.\n\n• First\n• Second\n\nEnd.");
});

test("entryText leads with the summary", () => {
  const e = byId["tamsin-voy"];
  const text = entryText(e, byId);
  assert.ok(text.startsWith(e.summary));
  assert.ok(text.includes("Retirement Society"));
  assert.ok(!text.includes("[["));
});

test("search finds by name, alias, and body; ranks name matches first", () => {
  const top = q => search(entries, q, kinds).map(e => e.id);
  assert.equal(top("chorus")[0], "chorus");
  assert.ok(top("jukebox").includes("the-bar"));          // alias
  assert.ok(top("scarf").includes("ottoline-pask"));       // alias
  assert.equal(top("zzzzzz").length, 0);
  assert.ok(top("stem side")[0].startsWith("stem-side"));   // two words, either spelling
});

test("with no query, everything comes back grouped by kind", () => {
  const all = search(entries, "", kinds);
  assert.equal(all.length, entries.length);
  // (arrays made inside the vm context are a different realm; copy before comparing)
  const order = Array.from(all, e => kinds.indexOf(e.kind));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test("norm folds case, accents and punctuation", () => {
  assert.equal(norm("  Ship's  Company! "), "ships company");
  assert.equal(norm("Café"), "cafe");
});
