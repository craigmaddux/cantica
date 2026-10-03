import { test } from "node:test";
import assert from "node:assert/strict";
import { STEPS, FIELDS, fieldsOf } from "../module/registration-steps.mjs";

test("the walkthrough starts with a welcome and ends with a review", () => {
  assert.equal(STEPS[0].kind, "welcome");
  assert.equal(STEPS.at(-1).kind, "review");
});

test("step ids are unique, and every step has Gloss's words", () => {
  const ids = STEPS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const step of STEPS) {
    assert.ok(step.gloss && step.gloss.length > 20, `${step.id} has something for Gloss to say`);
    assert.ok(step.title, `${step.id} has a title`);
  }
});

test("every field a step fills in exists on the sheet", () => {
  for (const step of STEPS) for (const field of fieldsOf(step)) assert.ok(FIELDS.includes(field), `${step.id}: ${field}`);
});

test("everything Gloss asks for is covered: role, three Traits, two Hindrances, skills, the Touched questions", () => {
  const covered = new Set(STEPS.flatMap(fieldsOf));
  for (const field of FIELDS) assert.ok(covered.has(field), `no step fills in ${field}`);
  assert.ok(STEPS.some(s => s.kind === "skills"));
  assert.equal(STEPS.filter(s => s.field?.startsWith("system.traits.trait")).length, 3);
  assert.equal(STEPS.filter(s => s.field?.startsWith("system.encumbrances.")).length, 2);
});

test("text steps offer a handful of examples, each a short phrase", () => {
  for (const step of STEPS.filter(s => s.kind === "text")) {
    assert.ok(step.examples.length >= 5, `${step.id} examples`);
    assert.equal(new Set(step.examples).size, step.examples.length, `${step.id} has no repeats`);
    for (const example of step.examples) assert.ok(example.length <= 40, `${step.id}: "${example}" is short`);
  }
});

test("the Touched step offers Gift and Drawback pairs", () => {
  const touched = STEPS.find(s => s.kind === "touched");
  assert.ok(touched.pairs.length >= 3);
  for (const pair of touched.pairs) assert.ok(pair.gift && pair.drawback);
});
