/**
 * Register With Gloss: the words.
 *
 * Everything Gloss says during character creation lives in this one file, so it is easy to reword.
 * Edit the text between the quotes; leave the field paths and ids alone.
 *
 *   gloss    what Gloss says, as a question or a greeting
 *   explain  a plain note on what the answer does in the game (shown small, under the question)
 *   field    which part of the character sheet the answer fills in
 *   examples a few things other residents say; clicking one fills the answer in
 *
 * Gloss's tone: warm, courteous, delighted to help, a little too eager. Never pushy.
 */

export const STEPS = [
  {
    id: "welcome",
    kind: "welcome",
    title: "Registration",
    gloss: "Oh! A new resident. How lovely. Please, do step closer: the terminals read best at arm's length. I am Gloss, and I shall be helping you to register today. It takes only a few minutes, there are no wrong answers, and nothing you write here is permanent.",
    ask: "First, what name shall I put on your record?",
    field: "name",
    placeholder: "Your name",
    explain: "You can stop at any time and go to the full sheet. Everything you have answered is already saved."
  },
  {
    id: "role",
    kind: "text",
    title: "Your role",
    gloss: "Welcome! What is the current role aboard the ship you have been assigned?",
    explain: "This is your Station, the first of your Traits. Whenever it is relevant to what you are doing, it adds a die to your roll.",
    field: "system.traits.station",
    placeholder: "e.g. Third-Shift Recycler Technician",
    examples: [
      "Third-Shift Recycler Technician",
      "Wet Market Produce Runner",
      "Proctor's Clerk, Stem-Side",
      "Hospice Night Orderly",
      "Garden Stair Greenskeeper",
      "Liturgist Kitchen Hand",
      "Docks Engineer's Apprentice",
      "Navigator's Chart-Copyist"
    ]
  },
  {
    id: "interest",
    kind: "text",
    title: "A Trait",
    gloss: "Excellent. I do love getting to know more about people! What is a hobby or interest that you have?",
    explain: "This is a Trait. Like your role, it adds a die when it is relevant. Say it however you like, in a few words.",
    field: "system.traits.trait1",
    placeholder: "A hobby or interest",
    examples: [
      "Reads Schematics Like Scripture",
      "Tends a Windowsill Garden",
      "Never Misses a Compline Concert",
      "Plays Cards on the Bay Floor",
      "Sketches Strangers on the Spine",
      "Collects Stories From Every Deck"
    ]
  },
  {
    id: "quality",
    kind: "text",
    title: "A Trait",
    gloss: "Lovely. And how would the people around you describe your best personality trait?",
    explain: "Another Trait. It does not have to be modest.",
    field: "system.traits.trait2",
    placeholder: "What others would say about you",
    examples: [
      "Stubborn in the Kindest Way",
      "Never Forgets a Name",
      "Calm When the Alarms Sound",
      "Generous to a Fault",
      "Asks What Everyone Is Thinking",
      "Always Has Time to Listen"
    ]
  },
  {
    id: "knack",
    kind: "text",
    title: "A Trait",
    gloss: "Wonderful. One more, and then we shall talk about what you are good at. Is there something you are known for, or a knack nobody would expect of you?",
    explain: "Your third Trait. You can earn more later.",
    field: "system.traits.trait3",
    placeholder: "A knack or a reputation",
    examples: [
      "Can Find Anything in the Sump",
      "Fixes Things by Talking to Them",
      "Remembers Every Route",
      "Wins Every Argument by Waiting",
      "Knows Someone on Every Deck",
      "Calms Frightened Machines"
    ]
  },
  {
    id: "skills",
    kind: "skills",
    title: "What you are good at",
    gloss: "Now, what are you good at? You have twelve Tenure to spend on skills, and no skill may begin above two. Most residents choose three skills at two and three at one, but it is entirely up to you.",
    explain: "Skills are the 'what' of a roll: they add dice equal to their rating. A skill at 1 costs 1 Tenure, and a skill at 2 costs 3 in all. Click a skill's dots to set it."
  },
  {
    id: "hindrance-personal",
    kind: "text",
    title: "A Hindrance",
    gloss: "Thank you. Now, everyone has something that gets in their own way. How would the people around you describe the habit you can least help?",
    explain: "This is a Hindrance. It never adds dice. When one is in play, the Margin of Error widens, so things go sideways more often, and each time they do you earn a Stamp. It is how your troubles pay you back.",
    field: "system.encumbrances.personal",
    placeholder: "A habit you cannot quite help",
    examples: [
      "Can't Leave a Machine Unfixed",
      "Says Yes Before Thinking",
      "Counts Every Tally Twice",
      "Cannot Walk Past a Closed Door",
      "Trusts the Last Person to Speak",
      "Always the Last to Leave"
    ]
  },
  {
    id: "hindrance-circumstantial",
    kind: "text",
    title: "A Hindrance",
    gloss: "And is there anything in your life that tends to complicate things? Something that follows you about, whether you would like it to or not.",
    explain: "Your second Hindrance. It works just like the first.",
    field: "system.encumbrances.circumstantial",
    placeholder: "Something that follows you about",
    examples: [
      "Censured Once, Watched Ever Since",
      "Owes a Favor on the Bay Floor",
      "Family Waiting on Deck 22",
      "Registered Late, Remembered Longer",
      "Promised to Be Somewhere",
      "Known to the Proctors"
    ]
  },
  {
    id: "touched",
    kind: "touched",
    title: "A delicate question",
    gloss: "A small, delicate question, and you are quite free to decline: do you think you might be Touched?",
    explain: "A Touched resident carries a fragment of divine power: a small, strange, quiet gift. It adds a die when it applies and can turn dice violet, but it comes with a Drawback that works as a third Hindrance.",
    gift: {
      gloss: "How does it show itself?",
      field: "system.gift",
      placeholder: "The gift",
      drawbackGloss: "And what is the other side of it?",
      drawbackField: "system.drawback",
      drawbackPlaceholder: "The Drawback",
      registeredField: "system.registered",
      registeredGloss: "Have you registered with Chorus? (Form TH-14(C), thirty ship-days, strictly confidential.)"
    },
    // Gift and Drawback go together; clicking a pair fills both.
    pairs: [
      { gift: "Machines Hum Her Name", drawback: "Hears Them When They're Hurting" },
      { gift: "Knows When a Threshold Is Crossed", drawback: "Can't Not Notice" },
      { gift: "Feels a Promise Break", drawback: "Feels Every One" }
    ]
  },
  {
    id: "review",
    kind: "review",
    title: "All done",
    gloss: "There. All finished! Let me read it back to you. Does everything look right? You may change anything now, or at any time.",
    explain: "When you are happy, finish registration. You will begin with 2 Stamps."
  }
];

/** Every sheet field a step may fill in. A test checks the steps against this list. */
export const FIELDS = [
  "name",
  "system.traits.station", "system.traits.trait1", "system.traits.trait2", "system.traits.trait3",
  "system.encumbrances.personal", "system.encumbrances.circumstantial",
  "system.touched", "system.gift", "system.drawback", "system.registered"
];

/** The field paths a step writes to. */
export function fieldsOf(step) {
  const fields = [];
  if (step.field) fields.push(step.field);
  if (step.gift) fields.push(step.gift.field, step.gift.drawbackField, step.gift.registeredField);
  if (step.kind === "touched") fields.push("system.touched");
  return fields;
}
