# Cantica (Foundry VTT system)

A native system for **Cantica**, a generational ark ship run by a tired AI that is also an angel of Order. Experimental: the table plays Savage Worlds, and this is for prototyping the rules in Foundry.

Targets Foundry **v14** (minimum v13). Optional: the **Dice So Nice** module for amber, white and violet dice.

## Install

Setup → Game Systems → Install System → paste the manifest URL:

```
https://github.com/craigmaddux/cantica/releases/latest/download/system.json
```

New releases appear as in-app updates. On Molten, the same URL works; no CloudCommander upload is needed.

## The rules in short

- **Pool** = the Margin (1 amber die, always) + Skill (0–3) + 1 per relevant Trait + 1 per Circumstance − 1 per Obstacle. **Cap 7.**
- **White dice and the Margin succeed on 7+.** **Violet (Bound) dice succeed on 6+.** Violet dice replace white dice; they never add to the count.
- **Difficulty** D1–D5 is the successes needed. 0 successes is *Denied*; short of Difficulty is *Approved, With Conditions*; meeting it is *Approved*; beating it is *Commended*.
- **Margin of Grace** on a 10; **Margin of Error** on a 1 (1–2 with Encumbrance in play, which earns a Stamp).
- **Resonance** on a violet 1 (1–2 for Greater Bound).
- **Stamps** are earned, not rolled: spend one to **Cite a Clause**. They never add a die.

## Using it

1. Create an Actor of type **Character**. To start from the sample, make a character and copy values from `samples/ilse-varro.json`, or use *Import Data* on an actor with that file.
2. Click a **skill name** on the sheet to open the pool builder. Click the **pips** to set a rating.
3. In the pool builder, tick relevant Traits, set Circumstances, Obstacles and any extra Bound dice, pick a Difficulty, and roll.
4. Macros: `game.cantica.rollPool(actor, { skill: "hullcraft", traitKeys: ["station"], difficulty: 2 })` or `new game.cantica.PoolDialog({ actor, skill: "notice" }).render({ force: true })`.

## Not in this version

Appeal (dropped from the design), NPC sheet, Gear items, a Tenure/Compline helper, compendiums.

## Development

There is no build step. The system lives in `foundry/` inside the `cantica` repo (the website is at the repo root). Symlink or copy `foundry/` into Foundry's `Data/systems/cantica`, or push a tag to build a release.

```
cd foundry && npm test   # unit tests for the dice rules, including the design doc's odds table
git tag v0.1.0 && git push --tags    # builds system.json + system.zip on GitHub
```

`module/rules.mjs` holds the dice rules as pure functions with no Foundry dependency, so they are tested in Node.
