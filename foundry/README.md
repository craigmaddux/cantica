# Cantica (Foundry VTT system)

A native system for **Cantica**, a generational ark ship run by a tired AI that is also an angel of Order. Experimental: the table plays Savage Worlds, and this is for prototyping the rules in Foundry.

Implements spec **v0.2**. Targets Foundry **v14** (minimum v13). Optional: the **Dice So Nice** module for amber, white and violet dice.

## Install

Setup → Game Systems → Install System → paste the manifest URL:

```
https://github.com/craigmaddux/cantica/releases/latest/download/system.json
```

New releases appear as in-app updates. On Molten, the same URL works; no CloudCommander upload is needed.

## The rules in short

- **Pool** = the Margin (1 amber die, always) + Skill (0–3) + 1 per relevant Trait + 1 per Circumstance − 1 per Obstacle. **Cap 7.**
- **White dice and the Margin succeed on 7+.** **Violet (Bound) dice succeed on 6+.** Violet dice replace white dice; they never add to the count.
- **Difficulty = successes needed to succeed at all.** Below it is *Denied*; meeting it is *Approved, With Conditions*; one more is *Approved*; two or more is *Commended*. D0 Easy never Denies.
- **Margin of Grace** on a 10. **Margin of Error** on a 1 (1–2 with Encumbrance in play). Every Error gives the GM **+1 Scrutiny**; with Encumbrance in play it also earns the player a Stamp.
- **Resonance** on a violet 1 (1–2 for Greater Bound).
- **Stamps** are a counter. **Expedite** (a checkbox in the roll dialog) spends one for +1 die, once per roll. **Cite a Clause** has a button on the sheet. The other spends (Countersign, Reclassify, Amend the Scene) are manual for now.
- **Notices** are one shared track: 2 Minor boxes, 1 Major box, 1 Final box. Each Notice is named and typed **B** (Body) or **S** (Standing). A full track overflows upward; Final takes you out of the scene.
- **NPCs** have a **Rating** (1 ordinary, 2 tough, 3 nemesis, 4 reserved), two Tags and a Tier (Background, Minor, Major). Their Rating is the Difficulty of any roll against or to resist them. Target an NPC token and the roll dialog offers its Rating.
- **Scrutiny** is the GM's counter, shown in a small window to everyone. Use the Scrutiny setting to hide it, or `game.cantica.showScrutiny()` to bring it back.

## Using it

1. Create an Actor of type **Character** (or **NPC**). To start from the sample, use *Import Data* on an actor with `samples/ilse-varro.json`.
2. Click a **skill name** on the sheet to open the pool builder. Click the **pips** to set a rating.
3. In the pool builder, tick relevant Traits, set Circumstances, Obstacles and any extra Bound dice, pick a Difficulty (or a targeted NPC's Rating), and roll.
4. Use **Take a Minor / Take a Major** on the Notices panel; the track handles overflow and posts a card to chat. **Clear Minors** is the end-of-session button.
5. Macros: `game.cantica.rollPool(actor, { skill: "hullcraft", traitKeys: ["station"], difficulty: 1 })` or `new game.cantica.PoolDialog({ actor, skill: "notice" }).render({ force: true })`.

## Not in this version

Appeal and Precedent (deliberately left out), Docket and Summary Proceedings trackers, dedicated buttons for the Countersign, Reclassify and Amend the Scene spends, the result tables for acting against or resisting an NPC (read them from the spec; players and GM apply Notices by hand), Gear items, a Tenure/Compline helper, compendiums.

## Development

There is no build step. The system lives in `foundry/` inside the `cantica` repo (the website is at the repo root). Symlink or copy `foundry/` into Foundry's `Data/systems/cantica`, or push a tag to build a release.

```
cd foundry && npm test   # unit tests: the dice rules, the Notice track, and the spec's whole odds table
git tag v0.2.0 && git push --tags    # builds system.json + system.zip on GitHub
```

`module/rules.mjs` and `module/notices.mjs` hold the rules as pure functions with no Foundry dependency, so they are tested in Node.
