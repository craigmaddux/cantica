/* Station Briefs: player-facing primers for people who want help building a character with a class-like feel.
 * One source for the website (briefs.html) and for Register With Gloss in the Foundry system, which bundles
 * this file. Briefs are starting points, not classes: take one as written, change any part, or ignore them all.
 *
 * Every Brief's skills use the standard spread (three at 2, three at 1), which costs exactly the 15 starting
 * Tenure. Traits, Hindrances and the Gift are examples. The Commendation is a suggestion for Grade II;
 * ruleBreak is one of the Commendation rule-breaks (trait2, difficulty, obstacle, conditions, impossible, dissonance).
 */
window.STATION_BRIEFS = [
  {
    "id": "engineering",
    "name": "Engineering",
    "greeting": "So you've been assigned to Engineering. Congratulations, and please wear the boots.",
    "tagline": "You keep the ship alive.",
    "blurb": "You fix what breaks, you work closer to the Bound than almost anyone, and you know which systems are older than they should be.",
    "skills": {
      "athletics": 1,
      "scuffle": 0,
      "sneak": 0,
      "lore": 0,
      "science": 1,
      "notice": 2,
      "hullcraft": 2,
      "mend": 0,
      "pilot": 0,
      "persuade": 0,
      "procedure": 1,
      "survival": 0,
      "attune": 2
    },
    "traits": [
      "Reads Schematics Like Scripture",
      "Knows Every Crawlway on My Deck",
      "Never Met a Machine I Couldn't Talk Down"
    ],
    "hindrances": [
      "Can't Leave a Machine Unfixed",
      "Owes the Night Shift a Favor"
    ],
    "gift": "Machines Hum My Name",
    "drawback": "Hears Them When They're Hurting",
    "shine": "something is failing, the Bound are uneasy, or the answer is inside the walls",
    "commendation": {
      "name": "Never Misses a Rivet",
      "situation": "when I Hullcraft against the clock",
      "effect": "With Conditions becomes Approved",
      "ruleBreak": "conditions"
    }
  },
  {
    "id": "proctors-office",
    "name": "The Proctor's Office",
    "greeting": "So you've been assigned to the Proctors. Most of the job is asking people to stop. You'll be surprised how often it works.",
    "tagline": "You keep the peace.",
    "blurb": "There are no prisons aboard, so your tools are patience, mediation, and a great many forms. You know your district, and your district knows you.",
    "skills": {
      "athletics": 1,
      "scuffle": 1,
      "sneak": 0,
      "lore": 1,
      "science": 0,
      "notice": 2,
      "hullcraft": 0,
      "mend": 0,
      "pilot": 0,
      "persuade": 2,
      "procedure": 2,
      "survival": 0,
      "attune": 0
    },
    "traits": [
      "Has Heard Every Excuse Twice",
      "Knows Everyone on My Deck by Name",
      "Calm in a Shouting Room"
    ],
    "hindrances": [
      "Can't Let a Small Wrong Go",
      "My Cousin Is in the Sump"
    ],
    "gift": "Feels a Promise Break",
    "drawback": "Feels Every One",
    "shine": "tempers are high, someone is lying, or the rules matter more than anyone remembers",
    "commendation": {
      "name": "Heard It All Before",
      "situation": "when I Notice a lie told to my face",
      "effect": "the Difficulty is one lower",
      "ruleBreak": "difficulty"
    }
  },
  {
    "id": "lottery-survey",
    "name": "Lottery Survey",
    "greeting": "So your name came up in the Lottery. Please don't faint. You'll be issued a helmet.",
    "tagline": "You go out there.",
    "blurb": "When the ship stops at a candidate world, your crew is the first to set foot on it, test it against the Checklist, and come back with the truth. Or most of it.",
    "skills": {
      "athletics": 2,
      "scuffle": 0,
      "sneak": 0,
      "lore": 0,
      "science": 1,
      "notice": 1,
      "hullcraft": 0,
      "mend": 1,
      "pilot": 2,
      "persuade": 0,
      "procedure": 0,
      "survival": 2,
      "attune": 0
    },
    "traits": [
      "Has Walked on Three Worlds",
      "Lands Rough, Lands Safe",
      "Packs for Everything"
    ],
    "hindrances": [
      "Can't Stop Looking at the Sky",
      "Two Crewmates Didn't Come Back"
    ],
    "gift": "Knows Which Way Is Home",
    "drawback": "Can't Sleep Facing Away From It",
    "shine": "the ground is strange, the air is wrong, and the shuttle is a long walk away",
    "commendation": {
      "name": "First Boots Down",
      "situation": "when I'm the first onto a new world",
      "effect": "I ignore one obstacle",
      "ruleBreak": "obstacle"
    }
  },
  {
    "id": "hospice",
    "name": "The Hospice",
    "greeting": "So you've been assigned to the Hospice. You'll need steady hands and a good chair. Mostly the chair.",
    "tagline": "You heal people.",
    "blurb": "Bodies, mostly, but you've learned that half the cases on your rounds are about something else. Everyone on the ship passes through your doors eventually.",
    "skills": {
      "athletics": 0,
      "scuffle": 0,
      "sneak": 0,
      "lore": 0,
      "science": 2,
      "notice": 1,
      "hullcraft": 0,
      "mend": 2,
      "pilot": 0,
      "persuade": 2,
      "procedure": 1,
      "survival": 0,
      "attune": 1
    },
    "traits": [
      "Steady When It Matters",
      "Remembers Every Patient",
      "Gentle With the Frightened"
    ],
    "hindrances": [
      "Can't Walk Past Someone Hurting",
      "Working Doubles Since Spring"
    ],
    "gift": "Knows Where It Hurts",
    "drawback": "Feels It a Little, Too",
    "shine": "someone is bleeding, someone is grieving, or the cause of an illness doesn't add up",
    "commendation": {
      "name": "Steady Hands",
      "situation": "when I Mend someone under pressure",
      "effect": "With Conditions becomes Approved",
      "ruleBreak": "conditions"
    }
  },
  {
    "id": "compline-walk",
    "name": "The Compline Walk",
    "greeting": "So you've joined the Liturgists. Chorus will still decline to be worshipped. Please don't take it personally. We try not to.",
    "tagline": "You tend the ship's faith.",
    "blurb": "You lead Compline, keep the kitchens, sit with the dying, and believe something about Chorus and the Bound that most of the ship only half believes.",
    "skills": {
      "athletics": 0,
      "scuffle": 0,
      "sneak": 0,
      "lore": 2,
      "science": 0,
      "notice": 1,
      "hullcraft": 0,
      "mend": 1,
      "pilot": 0,
      "persuade": 2,
      "procedure": 1,
      "survival": 0,
      "attune": 2
    },
    "traits": [
      "A Voice That Carries at Compline",
      "Knows the Old Hymns by Heart",
      "People Tell Me Things"
    ],
    "hindrances": [
      "Sees Meaning in Everything",
      "The Elders Are Watching My Progress"
    ],
    "gift": "Hears the Ship Sing Words",
    "drawback": "Can't Always Tell Them From Mine",
    "shine": "people need comforting, the Bound are restless, or the old texts hold an answer",
    "commendation": {
      "name": "Sung Them Quiet",
      "situation": "when I Attune during Compline",
      "effect": "a violet 1 doesn't cause Dissonance",
      "ruleBreak": "dissonance"
    }
  },
  {
    "id": "greens",
    "name": "The Greens",
    "greeting": "So you've been assigned to the Greens. It smells wonderful. You'll stop noticing in a week, and miss it on your day off.",
    "tagline": "You grow the ship's food.",
    "blurb": "You know soil, light, rot, and patience. The Greens feed a quarter of a million people, and you know exactly how close to the edge that is.",
    "skills": {
      "athletics": 0,
      "scuffle": 0,
      "sneak": 0,
      "lore": 0,
      "science": 2,
      "notice": 2,
      "hullcraft": 1,
      "mend": 1,
      "pilot": 0,
      "persuade": 0,
      "procedure": 0,
      "survival": 2,
      "attune": 1
    },
    "traits": [
      "Can Grow Anything Given Time",
      "Knows the Greens Like My Own Hands",
      "Up Before the Lights"
    ],
    "hindrances": [
      "Won't Let Anything Go to Waste",
      "The Harvest Quota Is Behind"
    ],
    "gift": "Living Things Lean Toward Me",
    "drawback": "So Do Pests",
    "shine": "something is growing wrong, the food is at stake, or a new world's soil needs reading",
    "commendation": {
      "name": "Green Thumb",
      "situation": "when I coax something living to grow",
      "effect": "I can do the normally impossible",
      "ruleBreak": "impossible"
    }
  },
  {
    "id": "bay-floor",
    "name": "The Bay Floor",
    "greeting": "So you've taken a pitch on the Bay Floor. The posted price is a starting point. So is everything else.",
    "tagline": "You trade.",
    "blurb": "You know what everyone wants, what it's worth today, and who owes whom. Your pitch might have been in your family for six generations.",
    "skills": {
      "athletics": 0,
      "scuffle": 1,
      "sneak": 2,
      "lore": 1,
      "science": 0,
      "notice": 2,
      "hullcraft": 0,
      "mend": 0,
      "pilot": 0,
      "persuade": 2,
      "procedure": 1,
      "survival": 0,
      "attune": 0
    },
    "traits": [
      "Everyone's Cousin",
      "Never Forgets a Face or a Debt",
      "Can Find a Buyer for Anything"
    ],
    "hindrances": [
      "Can't Resist a Bargain",
      "Feuding With the Next Pitch Over"
    ],
    "gift": "Knows What Something Is Worth",
    "drawback": "Knows What Everyone Is Worth",
    "shine": "there's a deal to strike, a rumor to chase, or something needs finding quietly",
    "commendation": {
      "name": "Everyone's Cousin",
      "situation": "when I Persuade anyone born in Stem-Side",
      "effect": "a second Trait also applies",
      "ruleBreak": "trait2"
    }
  },
  {
    "id": "sump",
    "name": "The Sump",
    "greeting": "So you've ended up in the Sump. That's all right. People do. Please mind the standing water.",
    "tagline": "You get by.",
    "blurb": "You fell off the formal economy, or were born outside it, and you've learned to fix, trade, and slip through where the rules don't reach.",
    "skills": {
      "athletics": 0,
      "scuffle": 2,
      "sneak": 2,
      "lore": 0,
      "science": 0,
      "notice": 1,
      "hullcraft": 2,
      "mend": 0,
      "pilot": 0,
      "persuade": 1,
      "procedure": 0,
      "survival": 1,
      "attune": 0
    },
    "traits": [
      "Can Find Anything in the Sump",
      "Fixes It With Whatever's Lying Around",
      "Hard to Pin Down"
    ],
    "hindrances": [
      "Doesn't Trust Anyone in a Uniform",
      "Owes the Wrong People"
    ],
    "gift": "Knows When I'm Being Watched",
    "drawback": "Always Feels Watched",
    "shine": "the official way is closed, something needs moving quietly, or the job is ugly",
    "commendation": {
      "name": "Knows the Back Way",
      "situation": "when I Sneak through the lower decks",
      "effect": "I ignore one obstacle",
      "ruleBreak": "obstacle"
    }
  },
  {
    "id": "navigators-hall",
    "name": "Navigators' Hall",
    "greeting": "So you've been accepted by the Navigators. You'll be told a great many things in confidence. Please keep them that way.",
    "tagline": "You plot the jumps.",
    "blurb": "Officially, the Navigators know where the ship is going. Unofficially, you've begun to suspect how much of it is guesswork, and how much of the guesswork works anyway.",
    "skills": {
      "athletics": 0,
      "scuffle": 0,
      "sneak": 0,
      "lore": 2,
      "science": 2,
      "notice": 1,
      "hullcraft": 0,
      "mend": 0,
      "pilot": 2,
      "persuade": 0,
      "procedure": 1,
      "survival": 0,
      "attune": 1
    },
    "traits": [
      "Sees Patterns in the Stars",
      "Knows the Jump Logs Back Two Centuries",
      "Calm When the Ship Shudders"
    ],
    "hindrances": [
      "Keeps Secrets Even When I Shouldn't",
      "The Guild Wants Results"
    ],
    "gift": "Always Knows Where the Ship Is",
    "drawback": "Feels Every Jump in My Teeth",
    "shine": "the ship is lost, the numbers don't agree, or something in the stars isn't where it should be",
    "commendation": {
      "name": "Read the Jump",
      "situation": "when I Pilot through a jump's aftermath",
      "effect": "the Difficulty is one lower",
      "ruleBreak": "difficulty"
    }
  },
  {
    "id": "registry",
    "name": "The Registry",
    "greeting": "So you've been posted to the Registry. Every record on the ship passes through here eventually. Some of them pass through twice.",
    "tagline": "You keep the records.",
    "blurb": "Births, deaths, assignments, housing, and the confidential files of every Touched resident aboard. You know where the ship's paper trail leads, and where it stops.",
    "skills": {
      "athletics": 0,
      "scuffle": 0,
      "sneak": 1,
      "lore": 2,
      "science": 1,
      "notice": 2,
      "hullcraft": 0,
      "mend": 0,
      "pilot": 0,
      "persuade": 1,
      "procedure": 2,
      "survival": 0,
      "attune": 0
    },
    "traits": [
      "Can Find Any File in an Hour",
      "Knows Which Forms Really Matter",
      "Remembers What Others Filed and Forgot"
    ],
    "hindrances": [
      "Can't Leave a Discrepancy Alone",
      "Sworn to Confidentiality"
    ],
    "gift": "Knows When a Record Is False",
    "drawback": "Can't Unknow It",
    "shine": "the answer is in the paperwork, a name needs tracing, or someone has been erased",
    "commendation": {
      "name": "Found It in the Archive",
      "situation": "when I search the records",
      "effect": "a second Trait also applies",
      "ruleBreak": "trait2"
    }
  }
];
