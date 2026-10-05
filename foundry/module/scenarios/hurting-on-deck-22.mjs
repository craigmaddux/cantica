/**
 * Hurting on Deck 22: the one-shot from the GM Primer (Grade I, about four hours). The data for the importer:
 * its people (NPCs with Rating, Tier and Tags), its places (Scene Cards with their scene Traits), and a journal of
 * GM notes. Pure data, no Foundry dependency; a test checks it against the GM Primer's rules.
 *
 * This is GM material: it contains the scenario's secrets. It is imported with the people hidden from players.
 */

export const SCENARIO = {
  id: "hurting-on-deck-22",
  name: "Hurting on Deck 22",

  /** Rating, Tier (background, minor, major) and up to three Tags. `action` is which Tag is the Action Tag (1-3). */
  npcs: [
    {
      key: "tamsin-voy", name: "Tamsin Voy, Chief Engineer", match: "Tamsin Voy", rating: 2, tier: "minor",
      tags: ["Knows Every Bound by Name", "Has No Time"],
      notes: "Appears once, in a hurry. If the players earn her attention, she gives them one real piece of help."
    },
    {
      key: "pim-okafor", name: "Pim Okafor, junior engineer", rating: 1, tier: "minor", tags: ["Eager", "Out of His Depth"],
      notes: "Filed the ticket. Will follow the players anywhere. Might be quietly Touched."
    },
    {
      key: "odette-brannagh", name: "Odette Brannagh, Retirement Society", rating: 2, tier: "major",
      tags: ["Has the Permit", "Means Well", "Believes Every Word"], action: 1,
      notes: "The heart of Beat 3. Kind, certain, and not entirely wrong. She believes the Bound are owed rest, and she may be right. She'll Withdraw before she'll be humiliated."
    },
    {
      key: "hollis-teague", name: "Hollis Teague, residents' spokesman", rating: 1, tier: "minor", tags: ["Loud", "Has a Petition"],
      notes: "Wants someone blamed. Good for raising the stakes."
    },
    {
      key: "residents-22c", name: "Residents of 22-C (crowd)", rating: 1, tier: "background", tags: ["Numbers", "Frightened"],
      notes: "For Summary Proceedings, or a confrontation in the stairwell. A crowd is one NPC: raise the Rating for numbers or anger; the first Notice scatters them."
    },
    {
      key: "ibbet-lune", name: "Nurse Ibbet Lune, Hospice", rating: 1, tier: "minor", tags: ["Sees Patterns", "Overworked"],
      notes: "Has noticed the symptoms are worst on the east side. A clue if the players stall."
    },
    {
      key: "brother-caddo", name: "Brother Caddo, Liturgist", rating: 1, tier: "minor", tags: ["Compline Voice", "Sees Signs"],
      notes: "Holding a vigil, convinced the Bound is grieving. Almost right. Can help with Attune, and is the choir the clause needs."
    },
    {
      key: "proctor-halvard", name: "Proctor Halvard", match: "Proctor Halvard", rating: 1, tier: "minor", tags: ["Knows Every Regulation", "Tired of Your Nonsense"],
      notes: "Arrives when the crowd gets loud. Obstacle or ally."
    },
    {
      key: "wen", name: "Wen, nine years old", rating: 1, tier: "background", tags: [],
      notes: "Not rolled against. Lives next door. Says the recycler cries at night. Nobody believed her."
    }
  ],

  /** Scene Cards: a place and its scene Traits (two or three each). */
  places: [
    { key: "stairwell", name: "Block 22-C stairwell", traits: ["Thin Air", "Doors Propped Open"],
      description: "Someone has propped every stairwell door open with whatever came to hand: a boot, a folding chair, a stack of last cycle's ration notices." },
    { key: "recycler-room", name: "Recycler Room 22-C-4", traits: ["Old Hush Is Listening", "Cramped Pipework", "Warm to the Touch"],
      description: "Recycler 22-C-4 has kept Block 22-C breathing for two hundred cycles. Its Bound, Old Hush, is named for the soft sound it makes." },
    { key: "crawlway", name: "The crawlway behind the bulkhead", traits: ["Dark and Tight", "You Can Hear It Breathing"],
      description: "A close, dark way behind the recycler's wall. Old Hush's attention keeps drifting this way." },
    { key: "maintenance-bay", name: "Maintenance Bay 22-E (Unit 7)", traits: ["Too Quiet", "Permit Taped to the Door"],
      description: "Behind the recycler's wall: a silent test scrubber, Unit 7, installed under Permit RS-0047. It works perfectly and makes no sound at all." },
    { key: "dispatch", name: "Engineering dispatch office", traits: ["Understaffed", "Every Ticket Is Urgent"],
      description: "Ticket 22-C-4 landed here, marked Routine. The tea is an acquired taste." },
    { key: "landing", name: "The landing common", traits: ["Packed and Angry", "Petition Circulating"],
      description: "Neighbors share tea and a clipboard goes round. Everyone is polite and everyone is tired, and the crowd is getting louder." },
    { key: "hospice-overflow", name: "Hospice overflow station", traits: ["Cots in the Corridor", "Oxygen Rationed"],
      description: "Three patients from 22-C tonight, all short of breath. The overflow cots are full." }
  ],

  /** The GM's journal, one page each. */
  journal: [
    {
      name: "The setup",
      html: `<p><strong>Grade I, about four hours.</strong> Recycler 22-C-4 has kept Block 22-C breathing for two hundred cycles. The residents call its Bound Old Hush, for the soft sound it makes. This week the air has been getting thinner. Engineering found nothing wrong, logged it as low priority, and moved on.</p>
<h3>What's really happening</h3>
<p>Three weeks ago a well-meaning Retirement Society volunteer installed a silent test scrubber, Unit 7, in the maintenance bay on the other side of the recycler's wall. Her permit is in order. Unit 7 works perfectly, and makes no sound at all. Old Hush can feel it there, and believes it is being replaced. A frightened Bound doesn't breathe well.</p>
<h3>The clock</h3>
<p>The next jump is in about six hours. Jumps strain every Bound aboard. A frightened one might fail in the middle of translation.</p>
<h3>Before you start</h3>
<ul><li>Start the Hum at <strong>0</strong>, and Scrutiny at <strong>one per player</strong> (the Scrutiny window's Start session button).</li>
<li>Suggested characters, from the Station Briefs: Engineering, the Hospice, the Proctor's Office, the Compline Walk and the Registry (the one who can make sense of the permit).</li>
<li>Playtest focus: violet dice and Dissonance, the Hum climbing quietly, a Gift and Drawback if anyone is Touched, a social conflict with a Major NPC, a Docket against the jump.</li></ul>`
    },
    {
      name: "Opening the session",
      html: `<p>Let the table feel the ship for a few minutes. <em>Read aloud, or say it your own way:</em></p>
<blockquote><p>The lights on Deck 22 are the color of weak tea, the way they always are by second shift. Somewhere above you, the ship is singing: the low, patient chord you stopped hearing years ago. Tonight it sounds thin. So does the air.</p>
<p>In Block 22-C, someone has propped every stairwell door open with whatever came to hand. A girl is sitting on the landing with her ear pressed to the wall. And from every speaker on the deck, in a voice of perfect courtesy, Chorus reads the evening notices. "The next jump will occur in six hours. Residents of Block 22-C are reminded that air quality remains within tolerance."</p></blockquote>
<h3>Bringing the characters in</h3>
<ul><li><strong>Engineering:</strong> Ticket 22-C-4 has finally landed on your desk, marked Routine.</li>
<li><strong>Hospice:</strong> three patients from 22-C tonight, all short of breath. Your overflow cots are full.</li>
<li><strong>Proctor:</strong> the petition has become a crowd. Someone called your office.</li>
<li><strong>Compline Walk:</strong> a resident asked you to sit with the recycler. She says it sounds sad.</li>
<li><strong>Registry:</strong> a query on Permit RS-0047 is in your tray, flagged by a clerk who has since gone home.</li></ul>
<p>Ask each player for one line: who are you, and what are you doing when the notice comes over the speakers?</p>
<h3>Your first twenty minutes</h3>
<ul><li>Let them feel the thin air. Give every character a reason to care.</li><li>Make sure everyone has heard the jump is coming.</li><li>Include one small kindness: a neighbor's tea, a borrowed fan.</li><li>Have everyone make one easy roll, so the table sees the Margin in action. Then move to Beat 2.</li></ul>`
    },
    {
      name: "Four beats",
      html: `<h3>1. The air goes thin</h3>
<p>Bring each character in through their own door, and show the problem: headaches, a fainted neighbor, doors propped open for any breeze, a petition circulating. Announce the jump early. <em>Tests: basic rolls, the Margin. Summary Proceedings if the crowd needs calming.</em></p>
<h3>2. Nothing is broken</h3>
<p>At the recycler, Hullcraft comes back Approved: nothing is mechanically wrong. That's the turn. Someone has to try Attune, use a Gift, or find someone who listens to Bound. Old Hush is afraid, and its attention keeps drifting to the east wall. Every violet die here is a risk. <em>Tests: violet dice, Dissonance, the Hum, Gift and Drawback, Bound gear.</em></p>
<h3>3. The silent one</h3>
<p>Behind the wall: Unit 7, its permit taped to the door, and Odette Brannagh, quietly proud of how well it works. She isn't a villain. The players can argue with her, dig into the paperwork, or find a rule that applies. <em>Tests: social conflict against a Rating 2 Major NPC, Standing Notices, Procedure, Requests for Record.</em></p>
<h3>4. Before the jump</h3>
<p>The finale is a <strong>Docket</strong>: deal with Unit 7, steady the recycler, and calm Old Hush before the jump. Everyone contributes their own way: a repair, a song, an argument, a form. Margins of Error move the Deadline closer. <em>Tests: the Docket, Scrutiny, Stamps under pressure.</em></p>
<p><strong>Sizing:</strong> Standard is 4 boxes per player, 3 rounds. If the players dealt with Unit 7 cleanly in Beat 3, drop it to 3 per player. Open the Docket on a Scene Card (the Docket panel on its sheet is yours alone; the table sees only the running tally of successes on the card's token).</p>`
    },
    {
      name: "The Clause, and how it ends",
      html: `<h3>The Clause</h3>
<p>Somewhere in the founders' procedures is a rule that no device shall be installed within earshot of Bound infrastructure. A Procedure roll in the Registry or the permit office (D1) finds it. On Approved, they also find the fine print: "...without a choir present." Brother Caddo is suddenly very important.</p>
<h3>How it ends</h3>
<ul><li><strong>Docket full:</strong> Old Hush hums again. Odette may become an unexpected ally, and ask to sit with the Bound she nearly replaced.</li>
<li><strong>Not full:</strong> the air holds through the jump, but the block is evacuated, the Hum rises by 2, and Old Hush remembers.</li></ul>
<p>Either way, the Retirement Society's pilot program is a thread for another night.</p>
<h3>After the jump</h3>
<p>If anyone listens closely to Old Hush once the jump is over, it is humming about something new: the two days. The calendar moved forward, as it often does. Nobody lived those days. Old Hush seems to have noticed. Leave it there.</p>`
    },
    {
      name: "Chorus, asked literally",
      html: `<p>Requests for Record: the player rolls Procedure, and each success is one question answered, true, exact and literal. The skill is in the phrasing.</p>
<ul><li>"Air quality in Block 22-C is 91% of standard."</li>
<li>"No fault has been recorded in Recycler 22-C-4."</li>
<li>"A device was installed adjacent to Recycler 22-C-4 under Permit RS-0047. The permit is in order."</li></ul>`
    },
    {
      name: "Playtest notes",
      html: `<ul><li><strong>Bound gear:</strong> Engineering's diagnostic scanner is Bound gear. Anyone who uses it gets a violet die, Touched or not (tick Bound gear in the roll builder).</li>
<li><strong>Body Notices:</strong> Lightheaded from the thin air; Burned Hand from the warm pipework.</li>
<li><strong>The Hum:</strong> if it reaches Murmur, the stairwell lights take on the wrong color. Say nothing else about it.</li>
<li><strong>Compline:</strong> end the night with Compline. Read out one or two of the day's notices, and ask each player the three questions.</li></ul>`
    }
  ]
};
