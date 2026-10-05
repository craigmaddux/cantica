# Cantica (Foundry VTT system)

A native system for **Cantica**, a generational ark ship run by a tired AI that is also an angel of Order. Experimental: the table plays Savage Worlds, and this is for prototyping the rules in Foundry.

Implements spec **v0.6**, plus Scene Cards, Register With Gloss and the Ledger. Targets Foundry **v14** (minimum v13). Optional: the **Dice So Nice** module for amber, white and violet dice.

## Install

Setup → Game Systems → Install System → paste the manifest URL:

```
https://github.com/craigmaddux/cantica/releases/latest/download/system.json
```

New releases appear as in-app updates. On Molten, the same URL works; no CloudCommander upload is needed.

## The rules in short

- **Pool** = the Margin (1 amber die, always) + Skill (0–2) + one Trait (its rank) + one scene Trait (+1). **Cap 7.** After the roll, Stamps add dice from the chat card (see below).
- **White dice succeed on 7+.** **Violet (Bound) dice succeed on 6+.** Violet dice replace white dice; they never add to the count. At most **two** dice are violet: one from the Gift and one from **Bound gear** (a checkbox in the roll dialog). A violet 1 is **Dissonance**.
- **Gear** is permission, not a bonus: it never adds dice: the right tools let you roll at all.
- **The Margin** succeeds on 7+ at Grades I–III, 6+ at IV–VI, 5+ at VII–IX, 4+ at X. Its 1 is always an Error and its 10 always Grace.
- **Difficulty = successes needed to succeed at all.** Below it is *Denied*; meeting it is *Approved, With Conditions*; one more is *Approved*; two or more is *Commended*. D0 Easy never Denies.
- **Traits:** Station plus three open Traits (buy up to six, 4 Tenure each). Every Trait has a **rank**, 1 or 2 (two pips on the sheet; rank 2 costs 6 Tenure and needs Grade III). On a roll you pick **one**, and it adds dice equal to its rank. **Stretch** (a checkbox beside it, anyone can tick it) makes it count as 1 die whatever its rank.
- **Hindrances:** two (Personal, Circumstantial), plus a Touched character's Drawback. Any one in play is **Greater Bound**: the Margin of Error *and* Dissonance widen to 1–2, and an Error earns a Stamp. They never add dice.
- **Gift** (Touched): adds no die. It turns one white die violet, or, if the pool is only the Margin, adds one violet die. If there is no white die to turn, it does nothing extra.
- **Every Margin of Error** gives the GM **+1 Scrutiny**.
- **The Hum** (GM only): every Dissonance adds 1 to a hidden counter (2 under Greater Bound, which is what any Hindrance in play brings). Bands: Still 0–4, Murmur 5–9, Refrain 10–14, Swell 15–19, and at 20 *something gives*. From the Refrain, every violet die causes Dissonance on 1–2. Only the GM gets a window for it (it opens by itself, and there is a **The Hum** button in the Actors directory), and the GM gets a private chat note when it enters a new band. At 20, write the event, then reset it. Players are never shown the Hum or told it exists in the UI; the Ledger doesn't mention it.
- **Stamps:** **Expedite** is a checkbox in the roll dialog (+1 die before you roll, once per roll); **Refile** and Countersign are buttons on a roll's chat card; Cite a Clause has a button on the sheet. You start each session with 2, +1 at Grades III, VI and IX.
- **Notices:** one track of two Minor boxes, two Major boxes and a Final box. Each Notice is named, typed **B** (Body) or **S** (Standing), and has a *clears by* line.
- **Grade** follows lifetime Tenure earned (every 6). **Skills** run 0–2 and cost 1, then 3 more. **Commendations** arrive at Grades II, V and VIII; one of the rule-breaks is *a second Trait also applies*.

Appeal and Precedent are deliberately not in the system.

## The character sheet

Four tabs:

- **Record:** Grade, Stamps and Tenure up top; Station and open Traits; the two Hindrances; Notices; Commendations; and skills. Click a skill's name to roll it; click its pips to set a rating. At first a character is in **creation**: a 15 Tenure budget, maximum rating 2. *Finish creation* when done; after that, skills are bought with Tenure.
- **Gift:** Gift, Drawback and Registered. Only when the character is **Touched**.
- **Notes:** free text.
- **History:** the Tenure log. Anyone who can edit the sheet can award Tenure, run **Compline** (three questions, 1 Tenure per yes) or award an **arc milestone** (+3). A Grade-up is highlighted in the log and announced in chat.

## Rolling

The pool builder asks you to pick one Trait (Station or an open Trait, with a Stretch checkbox), and offers the Gift, one checkbox per Hindrance (and the Drawback), your Commendations, the Scene you're in (and one scene Trait), and Bound gear. A **Penalty** row (None, −1, −2, −3) says "I have a −2 to this roll": each point costs a die, down to the Margin alone. There is no box for bonuses: anything that helps is a scene Trait, or the table's call. Difficulty is D0–D3, or the Rating of an NPC you've targeted. When you target an NPC, its **Tags** appear as checkboxes: tick one when it applies to what they are doing (a *Sharpshooter* when you defend against their shot) and you lose a die for each, never below the Margin alone. A Commendation that ignores one obstacle can ignore one Tag.

## Register With Gloss

A new character is created by a short conversation with Gloss. The full sheet stays closed while you do it, and appears when you finish, skip or close the walkthrough. Each step asks one thing (your role, three Traits, your skills, two Hindrances, whether you're Touched), says what the answer does in the game, and offers a few examples you can click. Every answer is saved as you give it, so **Skip to the full sheet** is always there and loses nothing. It opens by itself for a brand-new character (there's a setting to turn that off), and a **Register With Gloss** button on the sheet reopens it during creation.

**Station Briefs** are offered at the role step: ten primers (Engineering, the Proctor's Office, Lottery Survey, the Hospice, the Compline Walk, the Greens, the Bay Floor, the Sump, Navigators' Hall, the Registry) for people who want help building a class-like character. Picking one fills in Station and the skills (the standard spread, exactly 15 Tenure) and offers its Traits, Hindrances and Gift as clickable suggestions at the steps that follow; "Something else" starts from nothing. The sheet remembers the Brief (History tab), and at Grade II offers its Commendation as a suggestion with a *Take it* button. The Briefs are the website's `station-briefs-data.js`, bundled into the release with the lore.

Gloss's words are all in `module/registration-steps.mjs`: edit the text between the quotes.

## Scene Cards

A Scene Card is a place. Its **Traits are just Traits**: short phrases (*Steam Everywhere*, *A Spare Coupling in the Locker*).

- **For the roller:** the scene is the card your token is standing on, or else the **active** card (*Make active*). The roll dialog's **Scene** dropdown shows that guess and you can change it. You may pick **one** of the scene's Traits for +1 die.
- **After the roll, on its chat card:** the card keeps buttons for what can still be done to it. The roller can **Refile** (spend a Stamp: reroll one failed white die, once per roll; the Margin and violet dice are never refiled). An ally can **Countersign** (spend one of their own Stamps: one more die on that roll, once per ally). The GM can **Raise the Rating** (1 Scrutiny, on a roll against a targeted NPC: its Rating is one higher for this roll) or **Complicate** (below). Countersign's added die is white, counts its success and is subject to the cap of 7; the tier is worked out again each time. Players' clicks on someone else's card go through the GM's client, so a GM has to be connected.
- **Against the roller:** after a roll in a scene, the GM can click **Complicate (1 Scrutiny)** on the roll's chat card and choose one of the scene's Traits: the roll has one success fewer. The player sees a **Negate (spend a Stamp)** button on the same card and can cancel it. The Scrutiny is spent either way.
- **Amend the Scene:** players can **Add Trait · spend a Stamp**. The request goes through the GM's client, so a GM has to be online.

Two ways to see a card at the table, and you can use both:

- **On the map:** drag the card onto the canvas. Cards are **12 × 9 grid squares** (three times as wide and as tall as before v0.8.1); cards already made at the old 4 × 3 are enlarged once, the first time a GM opens the world, and a size you set yourself is left alone (`game.cantica.resizeCards()` runs it again). To get rid of the grid, open the scene's configuration, Grid tab, and set Grid Type to Gridless. The token's picture is the whole card, painted into one image: your art **trimmed to the token's shape**, fading into a dark plate with the name, the place and the Traits. Resize the token and it repaints to match; edit the card and it repaints too. Because it's an ordinary token picture, characters stand on top of it. A GM's browser does the painting and saves the image in the world's `cantica-cards` folder (a GM has to be connected, and the folder writable). Double-click opens the sheet. `game.cantica.repaintCards()` repaints every card on the scene.
- **A panel on every screen:** the GM clicks **Show on everyone's screen** on the card. A panel with the banner, description and Traits opens for every player, updates live as the card changes, and can be moved and resized (each player's position is remembered). Open as many as you like; **Open panel** shows one on your own screen only, and **Hide from everyone's screen** takes it away.

## The Ledger and the lore

Gloss's searchable entries, inside Foundry: open it from the **Ledger** button in the Actors directory or on the Scrutiny window, or with `game.cantica.openLedger()`.

- **Search** and filter by People, Places, Groups, Terms, Rumors and Rules. Entries link to each other.
- **Share to chat** posts an entry to the table in Gloss's voice.
- **Import Cantica lore** (GM, one click) makes an **NPC** for every person and a **Scene Card** for every place, in a "Cantica" folder. Rating, Tags and Tier are left for you to set. Running it again only adds what's new; nothing you've edited is touched.
- Imported people and places show their picture in the Ledger. **Drag the picture onto the tabletop**, or use **Show to players** to put it on everyone's screen.

The entries come from the website's `ledger-data.js`, so there's one set to maintain. Releases bundle that file and its art into the system; for a local copy of the repo, run `node foundry/scripts/bundle-lore.mjs` first.

## Not in this version

Docket tracking (and cumulative challenges across several cards), Summary Proceedings helpers, dedicated buttons for the Countersign, Reclassify and Amend-the-Scene Stamp spends (Amend is on Scene Cards), Gear items, compendiums.

## Development

There is no build step. The system lives in `foundry/` inside the `cantica` repo (the website is at the repo root). Symlink or copy `foundry/` into Foundry's `Data/systems/cantica` (after `bundle-lore`), or push a tag to build a release.

```
cd foundry && npm test   # unit tests: dice rules, Grade table, odds table, Notice track, scenes, lore search
node foundry/scripts/bundle-lore.mjs   # copy the ledger data and its art into foundry/lore/
git tag v0.5.0 && git push --tags      # builds system.json + system.zip on GitHub
```

`module/rules.mjs`, `module/progression.mjs`, `module/notices.mjs`, `module/scene.mjs` and `module/lore-text.mjs` are pure functions with no Foundry dependency, so they are tested in Node.
