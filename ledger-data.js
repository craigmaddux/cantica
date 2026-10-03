/* The Ledger of Cantica: entry data.
 *
 * Everything here is drawn from what the Concierge terminal (index.html) already
 * tells residents, plus the player-facing rules. Nothing GM-only belongs in this file.
 *
 * Fields
 *   id       unique slug; also the URL hash (ledger.html#chorus)
 *   kind     people | places | groups | terms | rumors | rules
 *   name     shown in the list
 *   tag      small subtitle (role, district type...)
 *   aka      extra words that should find this entry
 *   summary  one line, shown in the list
 *   body     paragraphs shown when opened. A string starting with "<" is inserted as-is;
 *            anything else is wrapped in <p>. Link to another entry with [[id]] or [[id|label]].
 *   inquiry  number or array of numbers: the Concierge inquiry that tells the full story
 *   img      optional portrait or scene (loaded only when the entry is opened)
 */

window.LEDGER_KINDS = [
  { id: "people", label: "People" },
  { id: "places", label: "Places" },
  { id: "groups", label: "Groups" },
  { id: "terms", label: "Terms" },
  { id: "rumors", label: "Rumors" },
  { id: "rules", label: "Rules" }
];

window.LEDGER = [

/* ═══════════════════════════ PEOPLE ═══════════════════════════ */

{ id: "maren-selde", kind: "people", name: "Maren Selde", tag: "Founder", inquiry: 12, img: "assets/maren-selde.jpg",
  aka: ["author of the checklist"],
  summary: "Primary author of the habitability checklist.",
  body: [
    "Not a scientist but an administrator. She wrote [[the-checklist|the checklist]] after watching the home world come apart: exhaustively, at three in the morning, including everything she could think of.",
    "An Anchorage is dedicated to her. The institutional [[outbound|Outbound]] call her a saint; the agitator wing calls her something else. Both assessments are, by available evidence, accurate."
  ] },

{ id: "ostren", kind: "people", name: "Ostren", tag: "Founder", inquiry: [12, 2], img: "assets/ostren.jpg",
  aka: ["the bottling", "engineer-priest"],
  summary: "Engineer-negotiator of the original Bottling. One name only.",
  body: [
    "Whether it is a first name, a last name, a title or a nickname that stuck is not recorded. Ostren was the engineer-priest who negotiated with the servants who would become the ship's [[the-bound|Bound]]: years of individual conversations, and a disproportionate number agreed to come.",
    "The [[liturgists|Liturgists]] have canonized Ostren. The engineers have their own version, involving less candle-lighting."
  ] },

{ id: "havre-doss", kind: "people", name: "Havre Doss", tag: "Founding councilor", inquiry: 12, img: "assets/havre-doss.jpg",
  aka: ["dissenting vote", "dissent"],
  summary: "The dissenting vote against the strict checklist. Stayed aboard anyway.",
  body: [
    "He voted against the strict version of [[the-checklist|the checklist]], not from carelessness but because he thought the governance around it would calcify. His recorded objection: the first generation would be grateful for the stubbornness, and the fourteenth would be imprisoned by it. He was outvoted, and he stayed aboard.",
    "The port-aft Anchorage is dedicated to him. His descendants live in [[old-forecastle|Old Forecastle]] and are, without exception, institutional [[outbound|Outbound]]."
  ] },

{ id: "amara-solis", kind: "people", name: "Amara Solis", tag: "First Speaker", inquiry: 12, img: "assets/amara-solis.jpg",
  aka: ["speaker", "council"],
  summary: "The human voice of Chorus before the Council. Known for her pauses.",
  body: [
    "She delivers [[chorus|Chorus]]'s announcements to the assembled [[the-council|Council]], a position that has gathered more institutional gravity than anyone planned for. Eleven years in the post.",
    "She reads Chorus better than almost anyone alive, not through special access but through very careful listening. Gloss finds her quietly formidable."
  ] },

{ id: "tamsin-voy", kind: "people", name: "Tamsin Voy", tag: "Chief Engineer", inquiry: [12, 10], img: "assets/tamsin-voy.jpg",
  aka: ["engineering chief"],
  summary: "Fourth of her family to run Engineering. The ship's practical guarantor.",
  body: [
    "The post is not hereditary; the Voy family simply keeps producing the best candidates. She is fully aware that the ship's survival rests on her desk.",
    "The [[retirement-society|Retirement Society]] has been denied access to [[engineering|Engineering]] four times, and all four denials came from her. She is [[hullbound|Hullbound]] by instinct and exhausted by responsibility in a way that has become, over time, indistinguishable from competence."
  ] },

{ id: "pell-adoc", kind: "people", name: "Pell Adoc", tag: "Navigator-General", inquiry: 12, img: "assets/pell-adoc.jpg",
  summary: "Chairs the Navigators Guild and presents jump recommendations.",
  body: [
    "He brings the [[navigators|Navigators]]' jump recommendations to [[chorus|Chorus]] and the [[the-council|Council]]. Technically brilliant, and very good at performing precision."
  ] },

{ id: "kem-vardas", kind: "people", name: "Kem Vardas", tag: "Prioress, House of the First Threshold", inquiry: 12, img: "assets/kem-vardas.jpg",
  aka: ["prioress"],
  summary: "Leads the most prestigious Liturgist house. Seventy-one.",
  body: [
    "Engine-clergy since she was nineteen. She is the conservative institutional force that keeps the more fervent [[liturgists|Liturgist]] wings from provoking a crisis, and she manages it the way you manage any complicated household: by not looking too closely at certain things."
  ] },

{ id: "orin-fell", kind: "people", name: "Orin Fell", tag: "Senior Magistrate, the Forum", inquiry: 12, img: "assets/orin-fell.jpg",
  aka: ["magistrate", "judge"],
  summary: "Highest human adjudicator, with almost no actual power.",
  body: [
    "Chorus overrides what Chorus wants to override, so the bench is prestigious and nearly powerless. Sixteen years on it have given him a meditative relationship with institutional futility.",
    "His written opinions are quietly famous. Asked whether he resents his position, he says he finds it clarifying. See [[the-forum|the Forum]]."
  ] },

{ id: "connel-vaar", kind: "people", name: "Connel Vaar", tag: "Agitator Outbound organizer", inquiry: 12,
  aka: ["agitator", "accountability convening"],
  summary: "Organizing in the Sump and the Bend for fourteen years.",
  body: [
    "Neither violent nor reckless, and an excellent political operator. His gift is making the official process embarrassing rather than trying to break it.",
    "His most noted act is [[accountability-convening|the Accountability Convening]]: eleven hours, seats reserved, food catered, free to attend."
  ] },

{ id: "deya-marsh", kind: "people", name: "Deya Marsh", tag: "The Tender, Below-the-Greens", inquiry: 12,
  aka: ["tender", "touched", "lie"],
  summary: "Below-the-Greens community authority. Always knows when you're lying.",
  body: [
    "No title. She has lived her whole life in Below-the-Greens, and both the [[hospice|Hospice]] liaison and the [[the-council|Council]]'s inspectors go to her when they need something to actually happen. Sometimes called the Tender; she finds it uncomfortable.",
    "She is [[the-touched|Touched]] and does not discuss it. Her ability: she always knows, with certainty, whether the person she is talking to is lying. She has had it since childhood, and it has shaped everything about how she governs."
  ] },

{ id: "ottoline-pask", kind: "people", name: "Ottoline Pask", tag: "Keeper of Unclaimed Articles", inquiry: 16,
  aka: ["keeper", "article 39,614", "scarf"],
  summary: "Third of her family to keep the Office. Wears cotton gloves.",
  body: [
    "Small, precise and exceptionally courteous. She can give you the shelf, the tag and the jump of arrival of any of some forty thousand articles in the [[office-of-unclaimed-articles|Office of Unclaimed Articles]] without consulting a record.",
    "Gloss gently suggests you not ask her about Article 39,614, the worn wool scarf on the shelf by her desk. She prefers not to discuss it."
  ] },

{ id: "sister-aiwen", kind: "people", name: "Sister Aiwen", tag: "Liturgist", inquiry: 5,
  aka: ["compline of the eleventh", "sermon"],
  summary: "Gives the Compline of the Eleventh. Thinks of the Bound as workers.",
  body: [
    "Her sermon asks the faithful not to think of the [[the-bound|Bound]] as engines but as workers who used to be worshipped and are now companions: they chose to be here, and the least we can do is listen, say thank you, and do our own work well."
  ] },

{ id: "sera", kind: "people", name: "Sera", tag: "Liturgist saint", inquiry: 5,
  aka: ["saint of fuel efficiency", "feast"],
  summary: "The Liturgists' saint of fuel efficiency. Her feast is on the eleventh.",
  body: [
    "In life she was a much-loved engineer. The [[liturgists|Liturgists]] keep her feast on the eleventh."
  ] },

/* ═══════════════════════════ PLACES ═══════════════════════════ */

{ id: "old-forecastle", kind: "places", name: "Old Forecastle", tag: "Forward residential district", inquiry: 13,
  img: "assets/old-forecastle-the-founder-era-promenade-district.jpg",
  aka: ["promenade", "founder era", "forward"],
  summary: "The founders' showpiece district. Everyone lowers their voice.",
  body: [
    "The oldest part of the ship still lived in, built as the founders' quarters. Its heart is the Promenade: a long thoroughfare under a vaulted ceiling of hull-windows that open onto the void, with old gold and brass fittings and real dark wood.",
    "The homes are smaller than you'd expect, each with a history the residents will share with little encouragement. The cafes serve real grain coffee, and the conversations are long. It is expensive to live here, in [[housing-priority|housing priority]] rather than tallies: <em>expensive in decades</em>.",
    "Politically it leans toward the institutional wing of the [[outbound|Outbound]]. Descendants of [[havre-doss|Havre Doss]] still keep homes along the Promenade."
  ] },

{ id: "garden-stair", kind: "places", name: "Garden Stair", tag: "Vertical neighborhood", inquiry: 14,
  img: "assets/garden-stair-a-vertical-neighborhood.jpg",
  aka: ["landing", "column", "stair"],
  summary: "A spiral stair around a column overgrown with greenery. People choose it.",
  body: [
    "A vertical neighborhood spanning several decks, joined by one wide spiral stair that winds around a great structural column. The greenery, donated from the overflow of [[the-greens|the Greens]] generations ago, has never been asked to stop. A soft violet glow drifts down from the conduits.",
    "Each landing is its own neighborhood. Residents give directions and describe each other by landing number (<em>“oh, she's very Twenty-Six”</em>). Popular with artists, scholars and [[the-touched|Touched]] residents. Most districts are places people end up; this one is a place people choose, so the waiting list is long.",
    "Please do not climb the column. The column does not like it, and neither does the committee."
  ] },

{ id: "stem-side-markets", kind: "places", name: "Stem-Side Markets", tag: "Mixed-use district", inquiry: 15,
  img: "assets/stem-side-markets.webp",
  aka: ["stem side", "stemside", "buy things", "shopping", "cargo bay"],
  summary: "The largest mixed-use neighborhood, around an original cargo bay.",
  body: [
    "Markets on the lower levels, homes stacked above, and everything in between layered as densely as the deck plans allow. Loud, crowded, and full of accents. Very few people move here on purpose; they stay for work, family or an available room, and discover four generations later that they have stayed.",
    "Three markets to know: [[bay-floor|the Bay Floor]], [[upper-gallery|the Upper Gallery]] and [[wet-market|the Wet Market]]. The people here want the lights to work, the food fresh and the noise ordinances enforced, which makes Stem-Side the unofficial heart of the [[hullbound|Hullbound]]. It also has a bar with a very shy jukebox: see [[the-bar|the Bar]]."
  ] },

{ id: "bay-floor", kind: "places", name: "The Bay Floor", tag: "Stem-Side market", inquiry: 15, img: "assets/stem-side-markets.webp",
  aka: ["haggling", "negotiate"],
  summary: "On the old cargo deck. Open 22 hours a day. Everything is negotiated.",
  body: [
    "Everything is negotiated here, including items with posted prices. Don't take the posted prices personally; they are a starting point for conversation, and the conversation is reportedly the best part. Part of [[stem-side-markets|Stem-Side Markets]]."
  ] },

{ id: "upper-gallery", kind: "places", name: "The Upper Gallery", tag: "Stem-Side market", inquiry: 15,
  aka: ["broken step"],
  summary: "Freight mezzanine market for hard-to-find things. Mind the third step.",
  body: [
    "Runs along the old freight mezzanine and specializes in things difficult to find anywhere else. The third step on the way up is broken. It has been reported, and it has been reported for some time. Part of [[stem-side-markets|Stem-Side Markets]]."
  ] },

{ id: "wet-market", kind: "places", name: "The Wet Market", tag: "Stem-Side market", inquiry: 15,
  aka: ["produce", "food", "vegetables"],
  summary: "Fresh produce from the Greens each morning. Gone by early afternoon.",
  body: [
    "Receives fresh produce from [[the-greens|the Greens]] every morning, and is generally gone by early afternoon. Go early. Part of [[stem-side-markets|Stem-Side Markets]]."
  ] },

{ id: "engineering", kind: "places", name: "Engineering", tag: "The work of keeping the ship alive", inquiry: 10,
  img: "assets/engineering-primary-floor.jpg",
  aka: ["the cathedral", "the floor", "primary floor", "power", "life support"],
  summary: "Power, life support, structure, and the largest of the Bound.",
  body: [
    "Less one district than a collection of spaces threaded through the lower mid-ship decks. When people say Engineering they usually mean the primary floor: a vast, cathedral-ceilinged space at the structural heart, lit by Bound-glow rather than conventional light. It is not open to the public.",
    "It is staffed continuously by ship's engineers and by [[liturgists|Liturgist]] clergy who tend the [[the-bound|Bound]] in residence. After eight hundred cycles they have a functional détente: they disagree on what they are doing and agree, mostly, on how to do it. The Liturgists call the floor the Cathedral; the engineers call it the floor. Both mean the same room.",
    "Led by Chief Engineer [[tamsin-voy|Tamsin Voy]]."
  ] },

{ id: "office-of-unclaimed-articles", kind: "places", name: "Office of Unclaimed Articles", tag: "Deck 9, off the Spine", inquiry: 16,
  aka: ["lost and found", "unclaimed", "ballast", "articles"],
  summary: "Where objects left behind by jumps are tagged and held. Nothing is ever claimed.",
  body: [
    "A converted ballast compartment just off the Spine on Deck 9, behind a founder-era stencil repainted so often the letters have gone soft. Steel racks follow the curve of the hull, so strolling the center aisle feels slightly uphill. Every shelf is full, and every article wears a small brass tag.",
    "The articles come from [[jump|the jumps]]: a glove, a cracked teacup, a key that fits no lock aboard, a child's drawing of a house beneath two suns. Each is logged, tagged, shelved and held until claimed. In eight hundred and fourteen cycles nothing has been claimed, but the office stays open. Claimants are asked to describe the article before viewing it.",
    "The Keeper is [[ottoline-pask|Ottoline Pask]]. [[navigators|Navigators]] browse the shelves and do not say what for. The [[liturgists|Liturgists]] have been asked in writing to stop leaving candles."
  ] },

{ id: "the-greens", kind: "places", name: "The Greens", tag: "Agricultural decks", inquiry: [14, 15],
  aka: ["farm", "agriculture", "below-the-greens", "grow"],
  summary: "The ship's agricultural decks. Their overflow feeds markets and climbs Garden Stair.",
  body: [
    "Fresh produce goes to [[wet-market|the Wet Market]] every morning. Overflow greenery donated generations ago now fills [[garden-stair|Garden Stair]]. A folk belief holds that slightly more [[the-touched|Touched]] children are born near the Greens overflow; the Registry has neither confirmed nor denied it. Below-the-Greens is the community that [[deya-marsh|Deya Marsh]] looks after."
  ] },

{ id: "the-docks", kind: "places", name: "The Docks", tag: "Where the Colony Ship Engineers work", inquiry: 9,
  aka: ["docking", "bays", "colony ships"],
  summary: "Hull bays, colony ships and their engineers. One bay is not discussed.",
  body: [
    "Home to the [[colony-ship-engineers|Colony Ship Engineers]], who will discuss almost anything about the Docks. The exception is [[the-quiet-dock|the Quiet Dock]]. The Docks photograph archive reaches back further than anyone's records, and a certain [[the-dog|dog]] appears in it."
  ] },

{ id: "the-sump", kind: "places", name: "The Sump", tag: "Lower decks", inquiry: 9,
  aka: ["lower decks", "the bend"],
  summary: "Lower deck neighborhood. Connel Vaar organizes here, and in the Bend.",
  body: [
    "A lower-deck district where [[connel-vaar|Connel Vaar]] has organized for fourteen years, along with the Bend. Somewhere in it is the dark stretch of corridor described in [[the-corridor|the Corridor]]."
  ] },

{ id: "the-gallows", kind: "places", name: "The Gallows", tag: "Execution space", inquiry: [9, 17],
  aka: ["execution", "death penalty"],
  summary: "A barely-a-room for executions. Public by law, almost always empty.",
  body: [
    "The Cantica keeps no prisons, but it does keep this small dedicated space, used when the council and Chorus agree an execution is necessary. Executions are public by law, and it has been used fewer than two dozen times in the ship's history.",
    "Ghost stories have grown up around it in proportion to how rarely it is used. Children dare each other to stay the night in the adjacent corridor, the most serious dare there is. See also [[correctives|correctives]]."
  ] },

{ id: "hospice", kind: "places", name: "The Hospice", tag: "Care", inquiry: [18, 12],
  aka: ["medical", "hospital", "care", "healing"],
  summary: "Free care for every resident, part of the Provision.",
  body: [
    "Care at the Hospice is part of [[the-provision|the Provision]]: yours from the day you are born, never bought or sold. [[deya-marsh|Deya Marsh]] is the person its liaison goes to when something needs to happen. In play, recovering a Major Body Notice runs through the Hospice (see [[rules-recovery|Recovery]])."
  ] },

/* ═══════════════════════════ GROUPS ═══════════════════════════ */

{ id: "outbound", kind: "groups", name: "The Outbound", tag: "Faction", inquiry: 5,
  aka: ["the patient and the impatient both", "leave the ship", "land", "agitator"],
  summary: "Believe the voyage must end with feet on a worthy world.",
  body: [
    "Two wings that do not always agree. The patient, institutional ones work the official channels (Navigation, Survey, the [[colony-ship-engineers|Colony Ship Engineers]]) and trust [[chorus|Chorus]] and [[the-checklist|the checklist]]. The impatient ones have lost patience and would, given the chance, open the docks themselves. Agitators like [[connel-vaar|Connel Vaar]] work the second path, politely.",
    "Strongest in [[old-forecastle|Old Forecastle]]. The institutional sort take a [[day-of-disappointment|Day of Disappointment]] the hardest."
  ] },

{ id: "hullbound", kind: "groups", name: "The Hullbound", tag: "Faction", inquiry: 5,
  aka: ["the settled-in", "home"],
  summary: "Have made peace with the Cantica being home.",
  body: [
    "They want resources spent inward: better quarters, more gardens, the lifts on Deck 19 fixed at last. They are not opposed to a landing in principle; they simply don't expect one and would prefer, in the meantime, that the lights worked.",
    "Their unofficial heart is [[stem-side-markets|Stem-Side Markets]]. Chief Engineer [[tamsin-voy|Tamsin Voy]] is Hullbound by instinct."
  ] },

{ id: "liturgists", kind: "groups", name: "The Liturgists", tag: "Faction", inquiry: 5,
  aka: ["the singers-back", "church", "clergy", "worship"],
  summary: "Regard the Bound as divine. They tend them, and sing back.",
  body: [
    "Services, offices, calendars timed to the jumps. They tend the [[the-bound|Bound]] and sing when the shields flare. [[chorus|Chorus]] has repeatedly declined to be worshipped, which the Liturgists read as holy humility. They have a saint of fuel efficiency ([[sera|Sera]]).",
    "The most prestigious house is led by [[kem-vardas|Prioress Kem Vardas]]. Their clergy share [[engineering|Engineering]] with the engineers. They may ask to speak with you if you register as [[the-touched|Touched]]; you are not obliged to accept."
  ] },

{ id: "retirement-society", kind: "groups", name: "The Retirement Society", tag: "Faction", inquiry: 5,
  aka: ["the quiet engineers", "replace the bound"],
  summary: "Believe the Bound have served long enough and deserve rest.",
  body: [
    "They are at work on technological replacements: secular systems that might eventually do what the [[the-bound|Bound]] now do. They believe themselves kind, and some of them are. They have been denied access to [[engineering|Engineering]] four times, all by [[tamsin-voy|Tamsin Voy]].",
    "Members who are also [[hullbound|Hullbound]] (we settle here, and we free them in place) are sensible and increasingly popular."
  ] },

{ id: "navigators", kind: "groups", name: "The Navigators", tag: "Faction and guild", inquiry: 5,
  aka: ["the chart-keepers", "jumps", "charts", "guild"],
  summary: "The guild that plots the jumps. Very nice charts, many opinions.",
  body: [
    "They have a great many opinions about jumps and do not always volunteer them. Rumors of a deep cult within the guild that asks Chorus where home is are firmly denied; the denials are very firm indeed. Led by Navigator-General [[pell-adoc|Pell Adoc]]. Members browse the [[office-of-unclaimed-articles|Office of Unclaimed Articles]] and don't say what they're looking for."
  ] },

{ id: "colony-ship-engineers", kind: "groups", name: "Colony Ship Engineers", tag: "Guild", inquiry: [5, 9],
  aka: ["docks engineers"],
  summary: "The guild of the Docks and the colony ships. Part of the patient Outbound.",
  body: [
    "They work in [[the-docks|the Docks]] and trust [[chorus|Chorus]] and the checklist, which places them among the patient [[outbound|Outbound]]. They will talk about almost anything to do with the Docks. The notable exception is [[the-quiet-dock|the Quiet Dock]]."
  ] },

{ id: "proctors", kind: "groups", name: "The Proctors", tag: "District peacekeepers", inquiry: 17,
  aka: ["police", "law", "peacekeepers"],
  summary: "Each district has a Proctor's office. They mediate; they never jail.",
  body: [
    "Proctors answer to [[the-forum|the Forum]]. Most of their work is persuading things to stop: arguments, feuds, noise after [[compline|Compline]], the unauthorized rerouting of other people's water. They mediate, take statements and file a great many forms. A Proctor may ask you to sit somewhere quiet for a few hours to collect yourself; a few hours is all.",
    "If a matter needs more, it goes before a Magistrate. See [[correctives|correctives]]."
  ] },

{ id: "the-forum", kind: "groups", name: "The Forum", tag: "Courts of the ship", inquiry: [12, 17],
  aka: ["magistrate", "court", "bench"],
  summary: "Where Magistrates hear what the Proctors cannot settle.",
  body: [
    "The [[proctors|Proctors]] answer to it. The only sentence beyond [[correctives|correctives]] it can give is [[exile|exile]] or, very rarely, [[the-gallows|the Gallows]]. The Senior Magistrate is [[orin-fell|Orin Fell]]."
  ] },

{ id: "the-council", kind: "groups", name: "The Council", tag: "Governing body", inquiry: [3, 12],
  aka: ["deck representatives", "government"],
  summary: "Hears Chorus through the First Speaker. Meets, and then the bars fill.",
  body: [
    "The human governing body. [[amara-solis|First Speaker Amara Solis]] delivers [[chorus|Chorus]]'s announcements to it. Deck representatives will tell you when it meets, and the bars on Deck 31 do excellent business after council meetings."
  ] },

/* ═══════════════════════════ TERMS ═══════════════════════════ */

{ id: "gloss", kind: "terms", name: "Gloss", tag: "The terminal's attendant", inquiry: 1,
  aka: ["concierge", "terminal", "attendant"],
  summary: "The cheerful voice of the public terminals. Very pleased to be of help.",
  body: [
    "Gloss answers questions at the Concierge terminals and has been helping residents for some time. There is very little it has not been asked. If it cannot answer, it will say so and suggest someone who can."
  ] },

{ id: "chorus", kind: "terms", name: "Chorus", tag: "The governing intelligence", inquiry: 3,
  aka: ["ai", "angel of order", "public address", "pa"],
  summary: "The ship's governing intelligence: a bottled Bound Servant of Order.",
  body: [
    "Installed by the founders to manage the voyage and to enforce [[the-checklist|the checklist]] for any candidate world. You will hear it constantly: public address, elevator chimes, terminals. It writes its own announcements and takes some quiet pride in their tone. A little weary, a little formal, and doing its very best.",
    "There is no opting out of the public address. See [[compline|Compline]], and [[candidate-worlds|candidate worlds]]."
  ] },

{ id: "the-bound", kind: "terms", name: "The Bound", tag: "Divine servants", inquiry: [2, 6],
  aka: ["servants", "singing", "shields flare", "divine", "bottled"],
  summary: "Divine servants installed in the ship's systems. They sing when the shields flare.",
  body: [
    "Installed by the founders, they run power, life support, atmosphere, navigation, lights, lifts and, yes, the laundries on Deck 22. When they sing, that is not a malfunction; the acoustic resonance is structural to their nature.",
    "The children's primer's version: the servants got tired of being worshipped, someone clever put them into machines, and the machines work very well. Then the gods went away and the world began to break. See [[ostren|Ostren]], [[liturgists|the Liturgists]] and [[retirement-society|the Retirement Society]]."
  ] },

{ id: "the-touched", kind: "terms", name: "The Touched", tag: "Divine residue", inquiry: 6,
  aka: ["magic", "powers", "gift"],
  summary: "Residents born carrying a fragment of a Bound's power. Small, strange, quiet.",
  body: [
    "A small fraction of residents are born with a thematic gift, the residue of one of the [[the-bound|Bound]]. It cannot be sought or reproduced. A person Touched by a Bound of thresholds may know when a boundary is crossed; one Touched by a Bound of debts may know when a promise is broken. Powers do not, as a rule, throw fire; they are small, strange and often quiet.",
    "Touched residents are asked to register: see [[the-registry|the Registry]]."
  ] },

{ id: "the-registry", kind: "terms", name: "The Registry", tag: "Form TH-14(C)", inquiry: 6,
  aka: ["register", "form th-14", "touched registration"],
  summary: "Chorus's confidential record of the Touched. Registration is mandatory.",
  body: [
    "If you suspect you are [[the-touched|Touched]], register: Form TH-14(C), the Theological Sensitivity Disclosure. Failing to register within thirty ship-days of manifestation can mean administrative complications and a reassignment of [[housing-priority|housing priority]]. The Registry is held in confidence."
  ] },

{ id: "the-checklist", kind: "terms", name: "The Checklist", tag: "Habitability", inquiry: 4,
  aka: ["why we haven't landed", "criteria"],
  summary: "The founders' habitability checklist. Chorus enforces it without compromise.",
  body: [
    "Written by the founders after the home world failed, with unusual specificity, because they had learned they could not entirely trust themselves. [[chorus|Chorus]] enforces it without compromise. No world has met it in a great many cycles, which Gloss insists is the system working as designed.",
    "Primary author: [[maren-selde|Maren Selde]]. The one dissent: [[havre-doss|Havre Doss]]. See [[candidate-worlds|candidate worlds]]."
  ] },

{ id: "candidate-worlds", kind: "terms", name: "Candidate worlds", tag: "Surveys and rejections", inquiry: [4, 11],
  aka: ["rejection notice", "survey", "notable candidates", "aurelia"],
  summary: "Worlds surveyed and, so far, always declined. Rejections are filed with an apology.",
  body: [
    "Survey teams visit a candidate world and report. [[chorus|Chorus]] then issues a determination; a rejection lists findings (for one example, nitrogen 0.4% above parameters), says it is sorry, files the world in the Notable Candidates archive, and asks passengers to step away from the viewports before [[jump|the jump]].",
    "The day it happens is a [[day-of-disappointment|Day of Disappointment]]. Survey teams are drawn by [[the-lottery|the Lottery]]."
  ] },

{ id: "jump", kind: "terms", name: "Jumps", tag: "Translation", inquiry: 7,
  aka: ["translation", "fuel"],
  summary: "How the ship moves between systems. Not comfortable, not uncomfortable: strange.",
  body: [
    "You will feel it; almost everyone does. You'll hear an announcement beforehand and have time to sit or stand at a viewport. You are in no danger: the [[the-bound|Bound]] do the work, the fuel is sufficient, and the ship always arrives. [[liturgists|Liturgists]] call the moment passage; [[navigators|Navigators]] call it commit. Children, I am told, often laugh.",
    "Translation sometimes leaves things behind: see [[office-of-unclaimed-articles|the Office of Unclaimed Articles]]."
  ] },

{ id: "compline", kind: "terms", name: "Compline", tag: "End-of-day broadcast", inquiry: 8,
  aka: ["evening", "choir"],
  summary: "The end-of-day broadcast, when Chorus reads the notices. A quiet hour.",
  body: [
    "Chorus reads the day's notices, and the choir is sometimes audible. Most decks observe it informally as a quiet hour. At the table, a session also ends with Compline: see [[rules-compline|Compline and Tenure]]."
  ] },

{ id: "day-of-disappointment", kind: "terms", name: "Day of Disappointment", tag: "Custom", inquiry: 8,
  summary: "Any day Chorus declares a candidate world unsuitable. Bars do well.",
  body: [
    "Named with some affection. Shutters close, bars do well, and the institutional [[outbound|Outbound]] take it hardest. See [[candidate-worlds|candidate worlds]]."
  ] },

{ id: "footfall", kind: "terms", name: "Footfall", tag: "Term", inquiry: 8,
  aka: ["landing", "set foot"],
  summary: "Setting human foot on a non-Cantica surface. Not in any living lifetime.",
  body: [
    "Used metaphorically too (<em>“I'll have footfall on that project by next quarter”</em>), meaning completion or arrival. Most ship-folk don't use the word in earnest. Some do."
  ] },

{ id: "bickering-court", kind: "terms", name: "The Bickering Court", tag: "History", inquiry: 8,
  aka: ["old hierarchy"],
  summary: "A name for something that came before the Cantica and is no longer with us.",
  body: [
    "If you're curious, ask a historian. If you're very curious, ask [[chorus|Chorus]], who remembers more than it usually says. See also [[old-management|the Old Management]]."
  ] },

{ id: "old-management", kind: "terms", name: "The Old Management", tag: "History", inquiry: [8, 2],
  aka: ["the gods", "gods went away"],
  summary: "The absent greater powers that came before the Cantica.",
  body: [
    "Gloss would prefer you carry this lightly. Same advice as [[bickering-court|the Bickering Court]]: ask a historian, or ask Chorus."
  ] },

{ id: "the-lottery", kind: "terms", name: "The Lottery", tag: "Monthly selection", inquiry: 11,
  img: "assets/a-survey-shuttle-over-a-candidate-world.jpg",
  aka: ["external operations", "survey", "exemption", "drawn"],
  summary: "Random monthly selection of who goes outside the ship. Mandatory, ages 17 to 60.",
  body: [
    "Held once a month, without exception, since the Cantica's third cycle. It selects the people who staff external operations: surveys, probe recovery, contact. Entirely random, mandatory for registered residents from seventeen to sixty unless an exemption applies, and the exemption list is short.",
    "The founders designed it so nobody can build a career out of going: it spreads experience, risk and perspective equally. Most selected residents return. When your number is drawn, you receive preparation and you go. It is traditional, if informal, to hold [[the-gathering|a gathering]] the night before."
  ] },

{ id: "the-gathering", kind: "terms", name: "The Gathering", tag: "Lottery tradition", inquiry: 11,
  summary: "The informal farewell the night before a Lottery departure.",
  body: [
    "Something between a farewell and a very calm party. Not official. The food is always good because people bring what they have. See [[the-lottery|the Lottery]]."
  ] },

{ id: "the-provision", kind: "terms", name: "The Provision", tag: "Guaranteed basics", inquiry: 18,
  aka: ["free", "rations", "housing", "air", "water", "schooling"],
  summary: "Air, water, home, ration, Hospice care and schooling, from the day you are born.",
  body: [
    "[[chorus|Chorus]] allocates it to every resident without exception. Nobody can sell it to you or take it away: on a ship, the founders felt, going without air is not a misfortune of the market but a death, and they did not intend to permit it.",
    "In return every adult is [[ships-company|Ship's Company]] and holds a [[work-assignment|work assignment]]. What you earn on top of it is [[tallies|tallies]]."
  ] },

{ id: "tallies", kind: "terms", name: "Tallies", tag: "Currency", inquiry: 18,
  aka: ["money", "currency", "pay", "cap", "500"],
  summary: "Discretionary currency: 1 per hour worked, more if dangerous. Capped at 500.",
  body: [
    "Earned at one tally per hour of [[work-assignment|assigned work]], and more for dangerous work. Spent on anything beyond [[the-provision|the Provision]]: a second helping, a better coat, a drink on [[bay-floor|the Bay Floor]]. You can save, spend or give them away, but you may not hold more than five hundred; the excess returns to the common stores, and Chorus writes to thank you. Gloss encourages treating the cap as an invitation to generosity. Most residents treat it as an invitation to shop.",
    "Tallies don't buy a better home: that's [[housing-priority|housing priority]]."
  ] },

{ id: "housing-priority", kind: "terms", name: "Housing priority", tag: "The real wealth", inquiry: 18,
  aka: ["seniority", "wealth", "tenure", "home"],
  summary: "How homes are assigned. Built over a lifetime of service and family tenure.",
  body: [
    "It builds slowly over a lifetime of service and seniority, and over several lifetimes of family tenure. This is why nobody can grow rich in [[tallies|tallies]] and yet some homes are finer than others: [[old-forecastle|Old Forecastle]] is not expensive in tallies, it is expensive in decades. Failing to register as [[the-touched|Touched]] can cost you some."
  ] },

{ id: "work-assignment", kind: "terms", name: "Work assignment", tag: "Station", inquiry: 18,
  aka: ["job", "station", "career"],
  summary: "Every adult is Ship's Company and holds one. You get some say, and much advice.",
  body: [
    "You have some choice in yours, and a good deal of advice, mostly from relatives. Many residents end up doing what their parents did; many don't. Both are respectable. A work reassignment is also a common [[correctives|corrective]]. In play, your assignment is your <strong>Station</strong> Trait: see [[rules-traits|Traits]]."
  ] },

{ id: "ships-company", kind: "terms", name: "Ship's Company", tag: "Status", inquiry: 18,
  aka: ["resident", "citizen"],
  summary: "Every adult aboard. Even the dog is listed under it.",
  body: [
    "Every adult aboard is Ship's Company and holds a [[work-assignment|work assignment]]. Registry records list the owner of [[the-dog|the dog]] as Ship's Company."
  ] },

{ id: "correctives", kind: "terms", name: "Correctives", tag: "How wrongs are put right", inquiry: 17,
  aka: ["punishment", "justice", "mediation", "restitution", "prison", "reassignment"],
  summary: "The Cantica has no prisons. It puts things right, from mediation up to exile.",
  body: [
    "There are no prisons and never have been; a person shut in a room uses air, water and food and gives nothing back. Instead, in rising order: <strong>mediation</strong> (usually the end of it), [[censure|censure]], <strong>restitution</strong> or an adjusted allowance, a <strong>work reassignment</strong> (damage a recycler and you may maintain recyclers for a while, which many find fair and some enjoy), then [[exile|exile]], and beyond that [[the-gallows|the Gallows]].",
    "[[proctors|Proctors]] handle most of it; bigger matters go to [[the-forum|the Forum]]."
  ] },

{ id: "censure", kind: "terms", name: "Censure", tag: "Corrective", inquiry: 17,
  aka: ["notice of censure"],
  summary: "A formal notice posted for your deck to read. Worse than it sounds.",
  body: [
    "A Notice of Censure states the resident, the finding and the corrective (for example, twelve weeks on Wet Market sanitation, early shift) and is posted outside the Proctor's office. In play, a past censure makes a fine <strong>Hindrance</strong>: <em>Censured Once, Watched Ever Since</em>. See [[correctives|correctives]]."
  ] },

{ id: "exile", kind: "terms", name: "Exile", tag: "Corrective", inquiry: 17,
  aka: ["put ashore", "banished"],
  summary: "A rare sentence: put ashore alone at an inhabited world. Family may not follow.",
  body: [
    "When the ship next calls at a world or station where others live and where the exile will be accepted, the person is put ashore and the Cantica goes on without them. They go alone; family may not follow, even if they ask. Suitable stops are uncommon, so an exile can wait a long while. Only [[the-forum|the Forum]] can sentence it."
  ] },

{ id: "accountability-convening", kind: "terms", name: "The Accountability Convening", tag: "Event", inquiry: 12,
  summary: "Eleven hours of the Council reading the checklist criteria added after Cycle 200.",
  body: [
    "[[connel-vaar|Connel Vaar]]'s most noted act: it forced the Council to read, on the public record, every [[the-checklist|checklist]] criterion added after Cycle 200. Eleven hours. Seats reserved, food catered, no charge."
  ] },

/* ═══════════════════════════ RUMORS ═══════════════════════════ */

{ id: "the-quiet-dock", kind: "rumors", name: "The Quiet Dock", tag: "Rumor", inquiry: 9,
  aka: ["scrubbed", "bay"],
  summary: "A bay in the Docks that the administrative record doesn't contain.",
  body: [
    "It appears in the original hull schematics. Its records have been scrubbed (not lost, not misfiled). [[chorus|Chorus]] acknowledges it exists and declines to discuss it. The [[colony-ship-engineers|Colony Ship Engineers]] won't discuss it either, which is notable, since they'll discuss almost anything about [[the-docks|the Docks]]."
  ] },

{ id: "ghost-ship", kind: "rumors", name: "The Ghost Ship", tag: "Rumor", inquiry: 9,
  aka: ["anomaly", "sensor", "phantom"],
  summary: "Every five years or so a jump produces something on the sensors that shouldn't be there.",
  body: [
    "Approach teams find nothing, though scouts report a sense of structure where there is none. Officially: <em>anomalous perception events, possible sensor artifact.</em> The [[navigators|Navigators]] don't comment. The [[liturgists|Liturgists]] keep a minor office for it and are vague about why; the vagueness feels deliberate."
  ] },

{ id: "the-bar", kind: "rumors", name: "The Bar", tag: "Rumor", inquiry: [9, 15],
  aka: ["jukebox", "comedy", "stem-side bar"],
  summary: "A Stem-Side bar whose jukebox developed opinions about stand-up comedy.",
  body: [
    "Seven years ago the jukebox, a [[the-bound|Bound]], developed an interest in stand-up. The jokes are bad: shy, tentative and earnest rather than hostile. Nobody wants to be the one to remove it, because the implications are uncomfortable, so the bar is about a third as full as it used to be. In [[stem-side-markets|Stem-Side Markets]]."
  ] },

{ id: "the-post", kind: "rumors", name: "The Post", tag: "Rumor", inquiry: 9,
  aka: ["monitoring station", "gauges", "logbook"],
  summary: "A monitoring station staffed continuously since launch, watching three gauges.",
  body: [
    "In the aft infrastructure: one person, one shift, three gauges that have never moved outside normal parameters in eight hundred and fourteen cycles. The logbook is almost all <em>nothing to report</em>. There are eleven exceptions, which say <em>something to report, referred to engineering.</em> [[engineering|Engineering]] has no record of any referrals."
  ] },

{ id: "the-dream", kind: "rumors", name: "The Dream", tag: "Rumor", inquiry: 9,
  aka: ["home", "sky", "dreaming"],
  summary: "A statistically improbable number of residents dream of standing under a sky, certain they are home.",
  body: [
    "The details vary, the structure doesn't. The [[the-touched|Touched]] who've had it say it feels different from their other dreams in a way they can't articulate. Nobody has asked [[chorus|Chorus]] about it directly, which those who have thought about it consider an interesting fact in itself."
  ] },

{ id: "the-corridor", kind: "rumors", name: "The Corridor", tag: "Rumor", inquiry: 9,
  aka: ["marks", "notation", "dark corridor"],
  summary: "A dark stretch of the Sump where marks on the wall seem to change.",
  body: [
    "Forty meters between two working junctions, with lights broken so long that residents stopped reporting it. The marks are more like notation than graffiti, and they change slowly over years; nobody has seen them change. [[the-touched|Touched]] who pass through report a presence they can't characterize: <em>attending</em>. In [[the-sump|the Sump]]."
  ] },

{ id: "the-dog", kind: "rumors", name: "The Dog", tag: "Rumor, or possibly a fact", inquiry: 9,
  aka: ["dog", "good dog"],
  summary: "One (1) dog, owner listed as Ship's Company. Possibly very old.",
  body: [
    "Large, brown and uninterested in examination. [[chorus|Chorus]]'s registry lists one dog, no breed specified. The [[colony-ship-engineers|Colony Ship Engineers]] note a dog in [[the-docks|Docks]] photographs going back further than their records, and the dog appears to be the same size in photographs taken three hundred cycles apart. By all accounts, a good dog."
  ] },

/* ═══════════════════════════ RULES ═══════════════════════════
 * Native Cantica rules, spec v0.2 (experimental; the Foundry system implements these).
 */

{ id: "rules-core", kind: "rules", name: "The core roll", tag: "Rules", aka: ["d10", "dice", "how to roll", "successes"],
  summary: "Roll a pool of d10s. White dice succeed on 7+. The target never changes.",
  body: [
    "Roll a pool of d10s. <strong>White dice succeed on 7+</strong> (40%). The target number never changes: difficulty is set by how many successes you need and by obstacle dice, never by moving the target.",
    "<strong>The players always roll.</strong> The GM never rolls dice; NPCs act through [[rules-npcs|Ratings]]. Build the pool with [[rules-pool|Building the pool]], then read the result on [[rules-difficulty|Difficulty and results]]."
  ] },

{ id: "rules-pool", kind: "rules", name: "Building the pool", tag: "Rules", aka: ["pool", "dice pool", "cap", "how many dice"],
  summary: "Margin + Skill + Traits + Circumstances − Obstacles. Cap 7.",
  body: [
    "<strong>Pool = the Margin + Skill (0–3) + 1 per relevant Trait + 1 per Circumstance − 1 per Obstacle. Cap: 7.</strong>",
    "<ul><li><strong>The Margin:</strong> one amber die, always rolled. See [[rules-margin|the Margin]].</li><li><strong>Skill:</strong> 0–3 dice.</li><li><strong>Traits:</strong> +1 die each when relevant (Station and your open Traits); each counts once per roll. See [[rules-traits|Traits]].</li><li><strong>Commendations:</strong> +2 dice instead of +1 when one of that kind applies. See [[rules-commendations|Commendations]].</li><li><strong>Circumstances:</strong> +1 each: gear, another PC assisting, a form filed in advance.</li><li><strong>A scene Trait:</strong> you may pick <strong>one</strong> Trait of the scene you're in for +1 die. See [[rules-scene-cards|Scene cards]].</li><li><strong>Obstacles:</strong> −1 each: wind, wet rock, darkness, a relevant NPC Tag, a relevant Notice on you.</li><li><strong>Expedite:</strong> spend a Stamp for +1 die, once per roll. See [[rules-stamps|Stamps]].</li></ul>",
    "Typical pools are 3–5 dice. A full 7 takes everything at once, for example Margin + Skill 3 + Trait + an assist + the environment. [[rules-hindrances|Hindrances]] never add dice."
  ] },

{ id: "rules-difficulty", kind: "rules", name: "Difficulty and results", tag: "Rules",
  aka: ["denied", "approved", "commended", "with conditions", "d0", "d1", "d2", "d3", "easy", "standard", "hard", "heroic", "difficulty"],
  summary: "Difficulty = successes needed to succeed at all. One more is clean; two more is Commended.",
  body: [
    "<strong>Difficulty is the number of successes you need to succeed at all.</strong> Meet it and you succeed with conditions; one more is a clean success; two more is Commended. Fall short and you are Denied.",
    "<table class=\"rules-table\"><thead><tr><th>Difficulty</th><th>Denied</th><th>With Conditions</th><th>Approved</th><th>Commended</th></tr></thead><tbody><tr><th>D0 Easy</th><td>never</td><td>0</td><td>1</td><td>2+</td></tr><tr><th>D1 Standard</th><td>0</td><td>1</td><td>2</td><td>3+</td></tr><tr><th>D2 Hard</th><td>0–1</td><td>2</td><td>3</td><td>4+</td></tr><tr><th>D3 Heroic</th><td>0–2</td><td>3</td><td>4</td><td>5+</td></tr></tbody></table>",
    "D4 is a story event and has no standard roll. <strong>Easy is rarely rolled</strong>: only when rushed or under pressure, where a twist would be interesting. An Easy roll is effectively rolling for [[rules-margin|the Margin]]: you can't fail, but the Margin can still twist or bless it. Don't roll trivial tasks at all."
  ] },

{ id: "rules-margin", kind: "rules", name: "The Margin (amber die)", tag: "Rules",
  aka: ["margin of grace", "margin of error", "amber", "twist", "complication", "grace", "error"],
  summary: "One amber die, every roll. A 10 is Grace; a 1 is Error and a complication.",
  body: [
    "One per roll, always. It counts toward successes like a white die, and it guarantees nobody ever rolls zero dice, even at Skill 0. It succeeds on <strong>7+ at Grades I–III</strong>, improving with [[rules-grade|Grade]] to 6+ (IV–VI), 5+ (VII–IX) and 4+ (X).",
    "<ul><li><strong>10: Margin of Grace.</strong> Something goes unexpectedly right: a detail, a helping hand, or a Stamp. Always a 10, at every Grade.</li><li><strong>1: Margin of Error.</strong> A twist: the GM introduces a complication, <strong>and gains 1 [[rules-scrutiny|Scrutiny]]</strong>. Always a 1, at every Grade.</li><li><strong>Hindrance in play:</strong> if <strong>any</strong> [[rules-hindrances|Hindrance]] (or a Touched character's Drawback) is in play, the Margin of Error widens to <strong>1–2</strong>. Any Error is your flaw biting, and <strong>you earn a Stamp</strong> (the GM still gains Scrutiny). Several in play still means 1–2.</li></ul>",
    "Risk: 10% for Grace; 10% for Error (20% with an Hindrance in play)."
  ] },

{ id: "rules-violet", kind: "rules", name: "Violet dice (the Bound)", tag: "Rules",
  aka: ["resonance", "greater bound", "bound dice", "violet", "divine"],
  summary: "Opt-in dice that succeed on 6+, but a 1 is Resonance: the Bound notice.",
  body: [
    "Opt in when you draw on divine infrastructure: a Gift, Bound-powered gear, a plea at [[compline|Compline]], anything borrowed from [[engineering|Engineering]].",
    "<ul><li><strong>Succeed on 6+</strong> (50%).</li><li><strong>1 = Resonance:</strong> the Bound notice. Something sings back, a light flickers in the wrong district, a Liturgist dreams.</li><li><strong>Greater Bound</strong> (optional tier): Resonance on 1–2.</li><li><strong>Colored dice replace white dice; they never add to the count.</strong> Pool size comes from skill and reasons; color tells you the risk.</li></ul>",
    "Only two special colors exist: amber (the Margin) and violet (the Bound). Risk: 10% per violet die for Resonance (20% for Greater Bound)."
  ] },

{ id: "rules-traits", kind: "rules", name: "Traits", tag: "Rules",
  aka: ["station", "open traits", "high concept", "aspects", "trait"],
  summary: "Station plus three open Traits: freeform phrases. Each relevant one adds a die.",
  body: [
    "Freeform phrases, Fate-style. Each relevant Trait adds +1 die, and each counts once per roll.",
    "<ul><li><strong>Station</strong> (required): what you do, your high concept. It ties to your [[work-assignment|work assignment]] and the economy (<em>Third-Shift Recycler Technician</em>).</li><li><strong>Three open Traits:</strong> anything. Suggested prompts, not required labels: <em>a hobby or interest · how the people around you would describe your best quality · a knack or a reputation.</em> (<em>Reads Schematics Like Scripture</em> · <em>Stubborn in the Kindest Way</em> · <em>Can Find Anything in the Sump</em>)</li></ul>",
    "You can buy up to three more open Traits, for 4 Tenure each (six in all). The GM may also award one after a major story moment (<em>Walked Out of the Quiet Dock</em>). Your troubles are not Traits: see [[rules-hindrances|Hindrances]]. Touched characters also have a [[rules-gift|Gift]]."
  ] },

{ id: "rules-hindrances", kind: "rules", name: "Hindrances", tag: "Rules",
  aka: ["hindrance", "hindrances", "encumbrance", "encumbrances", "flaw", "trouble", "personal hindrance", "circumstantial hindrance", "drawback"],
  summary: "Two troubles. If any is in play, the Margin of Error widens to 1–2.",
  body: [
    "Every character has <strong>two</strong>:",
    "<ul><li><strong>Personal:</strong> a flaw (<em>Can't Leave a Machine Unfixed</em>).</li><li><strong>Circumstantial:</strong> an obligation or situation (<em>Censured Once, Watched Ever Since</em>). See [[censure|censure]].</li></ul>",
    "If <strong>any</strong> Hindrance is in play, the [[rules-margin|Margin of Error]] widens to 1–2, and an Error earns you a Stamp. Several in play do not widen it further. <strong>Hindrances never add dice.</strong>",
    "When the story resolves an Hindrance, the old one becomes a Trait and you write a new Hindrance (<em>Censured Once, Watched Ever Since</em> → <em>Cleared My Name Before the Forum</em>)."
  ] },

{ id: "rules-gift", kind: "rules", name: "Gift and Drawback (Touched)", tag: "Rules",
  aka: ["gift", "drawback", "registered", "touched", "form th-14"],
  summary: "A Touched character's Gift adds a die and turns dice violet. Its Drawback is a third Hindrance.",
  body: [
    "[[the-touched|Touched]] gifts are small, specific and quiet: useful, inconvenient, and occasionally both at once. Touched characters aren't shunned; people just aren't sure what to make of them.",
    "<ul><li><strong>Gift:</strong> a Trait that says <em>how</em>; a skill still says <em>what</em>. In play it adds its die and turns <strong>up to two dice violet</strong>. It never rolls on its own.</li><li><strong>Drawback:</strong> the inconvenient side of the same Gift. <strong>It works as a third Hindrance:</strong> it widens the Margin of Error and earns Stamps.</li><li><strong>Registered:</strong> yes or no ([[the-registry|Form TH-14(C)]]). Being unregistered makes a good circumstantial Hindrance.</li></ul>",
    "<table class=\"rules-table\"><thead><tr><th>Gift</th><th>Drawback</th></tr></thead><tbody><tr><td><em>Machines Hum Her Name</em></td><td><em>Hears Them When They're Hurting</em></td></tr><tr><td><em>Knows When a Threshold Is Crossed</em></td><td><em>Can't Not Notice</em></td></tr><tr><td><em>Feels a Promise Break</em></td><td><em>Feels Every One</em></td></tr></tbody></table>",
    "Gift + Attune is the most direct and most dangerous way to deal with [[the-bound|the Bound]]. See [[rules-violet|violet dice]]."
  ] },

{ id: "rules-stamps", kind: "rules", name: "Stamps", tag: "Rules (player currency)",
  aka: ["expedite", "countersign", "reclassify", "cite a clause", "amend the scene", "withdraw", "metacurrency"],
  summary: "Earned by trouble, spent for dice, help, and the right to say what the rules say.",
  body: [
    "<strong>Earned:</strong> when an Hindrance bites (a Margin of Error while any Hindrance or Drawback is in play); sometimes from a Margin of Grace; for <strong>withdrawing</strong> from a scene before being taken out; and <strong>each player starts each session with 2</strong> (more at higher [[rules-grade|Grades]]).",
    "<table class=\"rules-table\"><thead><tr><th>Spend</th><th>Effect</th></tr></thead><tbody><tr><th>Expedite</th><td>+1 die to a roll (one per roll)</td></tr><tr><th>Countersign</th><td>give a Stamp to an ally's roll</td></tr><tr><th>Reclassify</th><td>downgrade a Notice as it lands (Major → Minor, Minor → none)</td></tr><tr><th>Cite a Clause</th><td>declare that a rule in the Checklist or the founders' procedures exists and applies; the GM adds one detail of how it actually reads</td></tr><tr><th>Amend the Scene</th><td>declare a new scene Trait (a steam pipe bursts, useful scrap turns up, a hatch was unlocked all along). Worth +1 die to anyone who can plausibly use it; the GM may add one small detail</td></tr></tbody></table>",
    "A Clause amends the rules; an Amendment amends the room. See [[rules-scene-cards|Scene cards]]."
  ] },

{ id: "rules-scrutiny", kind: "rules", name: "Scrutiny", tag: "Rules (GM currency)",
  aka: ["gm currency", "complications", "the ship pushes back"],
  summary: "The GM gains 1 whenever any player rolls a Margin of Error. Visible to everyone.",
  body: [
    "It gives the GM an earned, visible reason to escalate: the ship pushing back, not the GM picking on someone. The GM spends it to move a Docket's Deadline up a round, have a Minor NPC act as Major for one exchange, raise an NPC's Rating by 1 for one roll, trigger a Resonance, or bring in an offscreen complication (the Proctors arrive). Or <strong>complicate a roll</strong>: spend 1 on one of the scene's Traits after a roll, and it has one success fewer. The player can negate that by spending a Stamp.",
    "See [[rules-margin|the Margin]] and [[rules-dockets|Dockets]]."
  ] },

{ id: "rules-notices", kind: "rules", name: "Notices (harm)", tag: "Rules",
  aka: ["harm", "wounds", "injury", "damage", "health", "hit points", "track", "body", "standing", "clears by"],
  summary: "No hit points. Harm is a track of named Notices: 2 Minor, 2 Major, 1 Final.",
  body: [
    "Physical and social conflict use the same rules: a fight, a flirtation and a hearing before [[orin-fell|Magistrate Fell]] all work alike. Harm lands as <strong>named Notices</strong> on one shared track:",
    "<div class=\"track-demo\"><span>Minor</span><span>Minor</span></div><div class=\"track-demo\"><span>Major</span><span>Major</span></div><div class=\"track-demo\"><span>Final</span></div>",
    "<ul><li>Each box holds a named Notice marked <strong>B</strong> (Body) or <strong>S</strong> (Standing, i.e. social), and a <strong>clears by</strong> line.</li><li><strong>Minor</strong> (<em>Pending Review</em>): <em>Bruised Ribs (B)</em>, <em>Smitten (S)</em>, <em>Flustered (S)</em>.</li><li><strong>Major</strong> (<em>Escalated</em>): <em>Cracked Wrist (B)</em>, <em>Doubt in the Mission (S)</em>.</li><li><strong>Final</strong> (<em>Closed</em>): taken out of the scene. <strong>Death only if lethal stakes were declared beforehand</strong>; otherwise you are captured, humiliated, persuaded or carried off.</li><li><strong>Overflow:</strong> with both Minor boxes full, a new Minor becomes a Major (you're asked first). With both Major boxes full, the next hit is Final.</li><li><strong>Clears by</strong> defaults to the type and severity (Minor: <em>end of session</em>; Major Body: <em>treatment</em>; Major Standing: <em>a scene with another person</em>) and can be edited (<em>talk it through with Marguerite</em>).</li><li><strong>They matter:</strong> a relevant Notice on you is an obstacle (−1 die). A relevant Notice on an NPC gives players +1 die when they exploit it.</li><li><strong>Withdraw:</strong> before a roll that could take you out, concede. Narrate your own exit, skip the Final box, and earn a Stamp.</li></ul>",
    "See [[rules-recovery|Recovery]], [[rules-acting|acting against an NPC]] and [[rules-resisting|resisting one]]."
  ] },

{ id: "rules-recovery", kind: "rules", name: "Recovery", tag: "Rules", aka: ["heal", "healing", "hospice", "rest"],
  summary: "Minors clear at session end. Majors need treatment, or another person.",
  body: [
    "<table class=\"rules-table\"><thead><tr><th></th><th>Body</th><th>Standing</th></tr></thead><tbody><tr><th>Minor</th><td>clears at end of session</td><td>clears at end of session</td></tr><tr><th>Major</th><td>treatment: [[hospice|the Hospice]], a Mend roll, time</td><td><strong>a scene with another person</strong>: talking it through, a drink, a Liturgist's counsel, a hug</td></tr></tbody></table>",
    "Social Majors require another person to heal. A Bond Trait can apply, a friend can roll Persuade or Mend, or the scene can simply be played out. Recovery formally closes a Notice; [[hospice|the Hospice]] requires a form."
  ] },

{ id: "rules-acting", kind: "rules", name: "Acting against an NPC", tag: "Rules",
  aka: ["attack", "fight", "persuade npc", "inflict"],
  summary: "Roll against their Rating. Commended inflicts a Major; Denied costs you a Minor.",
  body: [
    "<table class=\"rules-table\"><thead><tr><th>Result</th><th>Effect</th></tr></thead><tbody><tr><th>Commended</th><td>inflict a <strong>Major</strong></td></tr><tr><th>Approved</th><td>inflict a <strong>Minor</strong></td></tr><tr><th>With Conditions</th><td>inflict a <strong>Minor</strong>, but you take one too, or lose position</td></tr><tr><th>Denied</th><td>you take a <strong>Minor</strong>, or they gain the upper hand</td></tr></tbody></table>",
    "The NPC's Rating is the Difficulty. See [[rules-npcs|NPCs]]."
  ] },

{ id: "rules-resisting", kind: "rules", name: "Resisting an NPC", tag: "Rules", aka: ["defend", "withstand", "npc attack"],
  summary: "The GM declares what the NPC does; you roll against their Rating to withstand it.",
  body: [
    "<table class=\"rules-table\"><thead><tr><th>Result</th><th>Effect</th></tr></thead><tbody><tr><th>Approved or better</th><td>no harm (Commended lets you turn it around)</td></tr><tr><th>With Conditions</th><td>you take a <strong>Minor</strong></td></tr><tr><th>Denied</th><td>you take a <strong>Major</strong>, and the GM narrates the NPC's triumph</td></tr></tbody></table>",
    "Major NPCs still get their moment: the GM declares what they do, and you roll to withstand it. Resist with the skill that matches <em>how</em> you resist: see [[rules-resist-skills|Resisting without a Resolve skill]]."
  ] },

{ id: "rules-npcs", kind: "rules", name: "NPCs and Ratings", tag: "Rules", aka: ["rating", "tags", "tier", "background", "minor", "major", "nemesis", "opposition"],
  summary: "Name, Rating, two Tags, Tier. Rating is the Difficulty against them.",
  body: [
    "<ul><li><strong>Rating = Difficulty</strong> for every roll against them or to resist them: <strong>1</strong> ordinary, <strong>2</strong> tough, <strong>3</strong> nemesis, <strong>4</strong> reserved (Chorus in a mood, the Bound unbottled). Each step is a heavy shift; beating a real threat takes Countersigns, assists and teamwork.</li><li><strong>Tags:</strong> what they're good at. When a Tag applies, you lose a die.</li><li><strong>Background</strong> NPCs (toughs, crowds, clerks): any Notice takes them out.</li><li><strong>Minor</strong> NPCs: one Minor box; the next Notice, or any Major, takes them out.</li><li><strong>Major</strong> NPCs: a full Notice track like a PC; they can Withdraw.</li><li><strong>Crowds</strong> are a single NPC: a higher Rating shows numbers, and every Notice thins them.</li></ul>",
    "For example: <em>Proctor Halvard</em> · Rating 1 · <em>Knows Every Regulation</em>, <em>Tired of Your Nonsense</em> · Minor."
  ] },

{ id: "rules-summary", kind: "rules", name: "Summary Proceedings", tag: "Rules (scene type)",
  aka: ["quick scene", "chase", "montage", "group roll"],
  summary: "A whole scene resolved with one roll per player against a scene Rating.",
  body: [
    "For the crowd of angry critters, a chase through Stem-Side, a survey day. The GM gives the situation a Rating (<em>a swarm of hull-mites: Rating 1</em>). Each player describes an approach, picks a skill and rolls once against it.",
    "<table class=\"rules-table\"><thead><tr><th>Result</th><th>What happens</th></tr></thead><tbody><tr><th>Commended</th><td>you carry the moment, plus a bonus (find something, save someone)</td></tr><tr><th>Approved</th><td>you contribute cleanly</td></tr><tr><th>With Conditions</th><td>you contribute, but take a Minor Notice</td></tr><tr><th>Denied</th><td>you take a Major, or the thing you were protecting slips</td></tr></tbody></table>",
    "If at least half the group reaches Approved, the scene is won, narrated as a montage built from everyone's rolls. Notices, Margins and Resonances all apply."
  ] },

{ id: "rules-dockets", kind: "rules", name: "Dockets", tag: "Rules (scene type)",
  aka: ["progress track", "deadline", "clock", "cumulative"],
  summary: "Fill boxes before the Deadline. Every success fills one box.",
  body: [
    "For venting a compartment before the jump, forging the paperwork before the Proctor returns, holding a failing Bound together. The GM opens a <strong>Docket</strong> with boxes to fill and a <strong>Deadline</strong> (usually 3 rounds).",
    "<ul><li><strong>Every success fills one box.</strong> Count raw successes, not result tiers.</li><li>Each round, every player rolls once with any approach.</li><li><strong>A Margin of Error moves the Deadline up one round.</strong> The GM can also spend [[rules-scrutiny|Scrutiny]] to do so.</li><li>Docket full before the Deadline: it works. Otherwise it fails, or succeeds at a real cost.</li></ul>"
  ] },

{ id: "rules-scene-cards", kind: "rules", name: "Scene cards and scene Traits", tag: "Rules (the table)",
  aka: ["scene card", "scene trait", "environment", "location", "amend the scene", "active scene", "complication", "complicate"],
  summary: "A place on the table carries Traits. Pick one for +1 die; the GM can spend Scrutiny on one against you.",
  body: [
    "In Foundry, a place is a <strong>scene card</strong>: a card you can drag onto the tabletop, or put on everyone's screen as a panel. Its Traits are just Traits: short phrases about the place (<em>Steam Everywhere</em>, <em>A Spare Coupling in the Locker</em>).",
    "<ul><li>The scene you're in is the card your token is standing on, or else the <strong>active</strong> scene. You can change it in the roll dialog.</li><li><strong>For you:</strong> pick <strong>one</strong> scene Trait in the roll dialog for +1 die.</li><li><strong>Against you:</strong> after a roll, the GM can spend 1 Scrutiny on one of the scene's Traits. The roll has <strong>one success fewer</strong>. You can <strong>negate</strong> that by spending a Stamp. Both happen right on the roll's chat card.</li><li><strong>Amend the Scene:</strong> spend a Stamp to add a Trait to the scene yourself. See [[rules-stamps|Stamps]].</li></ul>"
  ] },

{ id: "rules-hazards", kind: "rules", name: "Harm outside conflict", tag: "Rules", aka: ["hazard", "fall", "toxic", "environment"],
  summary: "Hazards work like resisting an NPC: the GM sets a Rating, you roll.",
  body: [
    "A fall, a toxic atmosphere, a Resonance gone bad: the GM sets a Rating and you roll. With Conditions or Denied lands a Minor or Major Notice, as in [[rules-resisting|resisting an NPC]]."
  ] },

{ id: "rules-record", kind: "rules", name: "Requests for Record", tag: "Rules", aka: ["ask chorus", "questions to chorus", "answers"],
  summary: "Questions to Chorus. Successes equal questions answered, and every answer is literal.",
  body: [
    "Submit questions to [[chorus|Chorus]]; successes are the number of questions answered. Every answer is <strong>true, exact and literal</strong>. The skill being tested is phrasing."
  ] },

{ id: "rules-resist-skills", kind: "rules", name: "Resisting without a Resolve skill", tag: "Rules", aka: ["resolve", "willpower", "save"],
  summary: "There is no Resolve skill. Resist with the skill that matches how you resist.",
  body: [
    "Athletics through pain, Attune against the Bound, Procedure against bureaucratic pressure. See [[skill-athletics|Athletics]], [[skill-attune|Attune]] and [[skill-procedure|Procedure]]."
  ] },

{ id: "rules-creation", kind: "rules", name: "Character creation", tag: "Rules",
  aka: ["starting skills", "starting spread", "create a character", "new character", "12 tenure"],
  summary: "12 Tenure to buy skills, maximum rating 2: three skills at 2, three at 1, seven at 0.",
  body: [
    "<ul><li><strong>12 Tenure</strong> to buy skills, and a <strong>maximum rating of 2</strong> at creation.</li><li><strong>Standard spread:</strong> three skills at 2, three at 1, the remaining seven at 0.</li><li><strong>Free:</strong> Station, three open Traits and two Hindrances (plus Gift, Drawback and Registered if [[the-touched|Touched]]). See [[rules-traits|Traits]], [[rules-hindrances|Hindrances]] and [[rules-gift|Gift]].</li><li><strong>Grade I:</strong> 2 Stamps per session, and the Margin succeeds on 7+. See [[rules-grade|Grade]].</li></ul>",
    "Skills rise afterwards with Tenure: [[rules-compline|Compline and Tenure]]."
  ] },

{ id: "rules-compline", kind: "rules", name: "Advancement: Compline and Tenure", tag: "Rules (advancement)",
  aka: ["advancement", "experience", "xp", "level up", "end of session", "tenure", "spending tenure", "arc milestone"],
  summary: "Each yes at Compline earns Tenure. Spend it on skills and Traits.",
  body: [
    "<strong>Earning Tenure</strong>",
    "<ul><li><strong>[[compline|Compline]]:</strong> at session end, each player answers three questions, and each yes earns 1 Tenure: <em>Did you change someone's mind? Learn something Chorus didn't tell you? Bend a rule that should have held?</em></li><li><strong>Arc milestone:</strong> +3 Tenure to everyone when a story arc concludes.</li></ul>",
    "Expect about 2–2.5 Tenure per session. Seniority is the ship's real wealth.",
    "<strong>Spending Tenure</strong>",
    "<table class=\"rules-table\"><thead><tr><th>Purchase</th><th>Cost</th></tr></thead><tbody><tr><th>Skill 0 → 1</th><td>1</td></tr><tr><th>Skill 1 → 2</th><td>2</td></tr><tr><th>Skill 2 → 3</th><td>6 (requires Grade III)</td></tr><tr><th>New open Trait</th><td>4 (maximum six open Traits)</td></tr></tbody></table>",
    "<strong>Free Traits:</strong> the GM may award a Trait after a major story moment. And when the story resolves an Hindrance, it becomes a Trait and you write a new Hindrance.",
    "Your <strong>Grade</strong> follows the Tenure you have <em>earned</em>, never what you've spent: [[rules-grade|Grade]]. At session end you also clear all Minor Notices: [[rules-recovery|Recovery]]."
  ] },

{ id: "rules-grade", kind: "rules", name: "Grade", tag: "Rules (advancement)",
  aka: ["grade i", "grade ii", "grade iii", "level", "seniority", "margin 6", "margin 5", "margin 4"],
  summary: "Every 6 Tenure earned is a new Grade: more Stamps, a better Margin, Commendations.",
  body: [
    "Grade is set by <strong>lifetime Tenure earned</strong> (not spent). Every 6 Tenure earns the next Grade.",
    "<table class=\"rules-table\"><thead><tr><th>Grade</th><th>Lifetime Tenure</th><th>You gain</th></tr></thead><tbody><tr><th>I</th><td>0</td><td>2 Stamps per session · Margin 7+</td></tr><tr><th>II</th><td>6</td><td><strong>Commendation</strong></td></tr><tr><th>III</th><td>12</td><td>+1 Stamp per session · <strong>skill rating 3 unlocked</strong></td></tr><tr><th>IV</th><td>18</td><td><strong>Margin 6+</strong></td></tr><tr><th>V</th><td>24</td><td>Commendation</td></tr><tr><th>VI</th><td>30</td><td>+1 Stamp per session</td></tr><tr><th>VII</th><td>36</td><td><strong>Margin 5+</strong></td></tr><tr><th>VIII</th><td>42</td><td>Commendation</td></tr><tr><th>IX</th><td>48</td><td>+1 Stamp per session</td></tr><tr><th>X</th><td>54</td><td><strong>Margin 4+</strong></td></tr></tbody></table>",
    "The Margin's 1 is always an Error and its 10 always Grace, at every Grade. Only its success threshold improves. A new character is Grade I: a specialist pool of 3–4 dice. By Grade III+ it's 4–5; a veteran at Grade VII+ has 5–6 with a better Margin. See [[rules-margin|the Margin]]."
  ] },

{ id: "rules-commendations", kind: "rules", name: "Commendations", tag: "Rules (advancement)",
  aka: ["commendation", "heroic", "rule-break", "rule break", "movie moment"],
  summary: "Heroic, movie-moment capabilities: always on in their narrow situation.",
  body: [
    "You gain a Commendation slot at Grades II, V and VIII. Always on in their narrow situation, with nothing to track. In the roll dialog you tick one when its situation applies.",
    "<strong>Template:</strong> <em>Because I [short phrase], when [specific situation], I [one rule-break].</em>",
    "<strong>Rule-break menu:</strong>",
    "<ul><li>add <strong>2 dice</strong> instead of 1</li><li>treat the Difficulty as <strong>one lower</strong></li><li>ignore <strong>one obstacle</strong></li><li><strong>With Conditions</strong> becomes <strong>Approved</strong></li><li><strong>do the normally impossible</strong> (narrative permission)</li><li>a violet <strong>1 doesn't Resonate</strong></li></ul>",
    "<strong>Examples:</strong> <em>Never Misses a Rivet:</em> when I Hullcraft against the clock, With Conditions becomes Approved. <em>Everyone's Cousin:</em> when I Persuade anyone born in Stem-Side, I add 2 dice. <em>The Bound Know My Voice</em> (Touched): when I Attune with my Gift, one violet 1 doesn't Resonate.",
    "See [[rules-grade|Grade]]."
  ] },

{ id: "rules-odds", kind: "rules", name: "Odds reference", tag: "Rules", aka: ["probability", "chances", "percent", "odds"],
  summary: "Chance of each result by pool size and Difficulty.",
  body: [
    "White dice, 7+ on a d10. Each cell is <strong>Denied / With Conditions / Approved / Commended</strong>, in percent.",
    "<table class=\"rules-table odds\"><thead><tr><th>Dice</th><th>D0 Easy</th><th>D1 Standard</th><th>D2 Hard</th><th>D3 Heroic</th></tr></thead><tbody><tr><th>3</th><td>— / 22 / 43 / 35</td><td>22 / 43 / 29 / 6</td><td>65 / 29 / 6 / 0</td><td>—</td></tr><tr><th>4</th><td>— / 13 / 35 / 52</td><td>13 / 35 / 35 / 18</td><td>48 / 35 / 15 / 3</td><td>82 / 15 / 3 / 0</td></tr><tr><th>5</th><td>— / 8 / 26 / 66</td><td>8 / 26 / 35 / 32</td><td>34 / 35 / 23 / 9</td><td>68 / 23 / 8 / 1</td></tr><tr><th>7</th><td>— / 3 / 13 / 84</td><td>3 / 13 / 26 / 58</td><td>16 / 26 / 29 / 29</td><td>42 / 29 / 19 / 10</td></tr></tbody></table>",
    "Standard is forgiving: an ordinary pool rarely fails outright, and With Conditions comes up constantly. Hard fails about half the time at 4 dice; teamwork and Stamps push that down. Heroic needs a full pool and luck, as it should. These figures treat the Margin like a white die (7+), as at Grades I–III; a better Margin at higher Grades improves them."
  ] },

/* ── skills ── */

{ id: "skill-athletics", kind: "rules", name: "Athletics", tag: "Skill · Body", aka: ["climbing", "running", "enduring", "pain"], summary: "Climbing, running, enduring. Also resisting pain.", body: ["Rated 0–3. Climbing, running, enduring. Resist pain with Athletics."] },
{ id: "skill-scuffle", kind: "rules", name: "Scuffle", tag: "Skill · Body", aka: ["fighting", "combat", "brawl"], summary: "Fighting.", body: ["Rated 0–3. Fighting. See [[rules-acting|acting against an NPC]]."] },
{ id: "skill-sneak", kind: "rules", name: "Sneak", tag: "Skill · Body", aka: ["stealth", "sleight of hand", "hide"], summary: "Stealth and sleight of hand.", body: ["Rated 0–3. Stealth and sleight of hand."] },
{ id: "skill-lore", kind: "rules", name: "Lore", tag: "Skill · Mind", aka: ["history", "theology", "culture", "founders"], summary: "History, theology, culture, the founders.", body: ["Rated 0–3. History, theology, culture, the founders."] },
{ id: "skill-science", kind: "rules", name: "Science", tag: "Skill · Mind", aka: ["biology", "chemistry", "astronomy", "analysis"], summary: "Biology, chemistry, astronomy, the Greens, analysis.", body: ["Rated 0–3. Biology, chemistry, astronomy, [[the-greens|the Greens]], analysis."] },
{ id: "skill-notice", kind: "rules", name: "Notice", tag: "Skill · Mind", aka: ["perception", "investigation", "search", "spot"], summary: "Perception and investigation.", body: ["Rated 0–3. Perception and investigation."] },
{ id: "skill-hullcraft", kind: "rules", name: "Hullcraft", tag: "Skill · Hands", aka: ["repair", "engineering", "systems", "making", "craft"], summary: "Repair, engineering, systems; also making things.", body: ["Rated 0–3. Repair, engineering, systems; also making things. (A separate Craft skill for artisans and Smallworks is possible if making things proves important in play.)"] },
{ id: "skill-mend", kind: "rules", name: "Mend", tag: "Skill · Hands", aka: ["medicine", "care", "healing", "doctor"], summary: "Medicine and care.", body: ["Rated 0–3. Medicine and care. Helps recover Major Notices: see [[rules-recovery|Recovery]]."] },
{ id: "skill-pilot", kind: "rules", name: "Pilot", tag: "Skill · Hands", aka: ["shuttles", "vehicles", "navigation", "fly"], summary: "Shuttles, vehicles, navigation.", body: ["Rated 0–3. Shuttles, vehicles, navigation."] },
{ id: "skill-persuade", kind: "rules", name: "Persuade", tag: "Skill · People", aka: ["talking", "haggling", "reading people", "diplomacy"], summary: "Talking, haggling, reading people.", body: ["Rated 0–3. Talking, haggling, reading people."] },
{ id: "skill-procedure", kind: "rules", name: "Procedure", tag: "Skill · People", aka: ["bureaucracy", "law", "forms", "the checklist", "paperwork"], summary: "Bureaucracy, law, forms, the Checklist.", body: ["Rated 0–3. Bureaucracy, law, forms, [[the-checklist|the Checklist]]. Resist bureaucratic pressure with Procedure."] },
{ id: "skill-survival", kind: "rules", name: "Survival", tag: "Skill · Worlds", aka: ["fieldcraft", "foraging", "shelter", "hostile environments"], summary: "Fieldcraft, foraging, shelter, hostile environments.", body: ["Rated 0–3. Fieldcraft, foraging, shelter, hostile environments."] },
{ id: "skill-attune", kind: "rules", name: "Attune", tag: "Skill · Divine", aka: ["bound", "sensing", "soothing", "coaxing"], summary: "Sensing, soothing and coaxing the Bound.", body: ["Rated 0–3. Sensing, soothing and coaxing [[the-bound|the Bound]]. Resist the Bound with Attune. With a Gift it is the most direct and most dangerous way to deal with them: see [[rules-traits|Traits]]."] }

];
