/** Static Cantica configuration: skills, groups, Traits and Notice statuses. */

export const SYSTEM_ID = "cantica";

/** The 13 skills, grouped. Labels and hints live in lang/en.json under CANTICA.Skill.<key>. */
export const SKILL_GROUPS = {
  body: ["athletics", "scuffle", "sneak"],
  mind: ["lore", "science", "notice"],
  hands: ["hullcraft", "mend", "pilot"],
  people: ["persuade", "procedure"],
  worlds: ["survival"],
  divine: ["attune"]
};

export const SKILLS = Object.values(SKILL_GROUPS).flat();

export const SKILL_MAX = 3;

/** Starting spread: one skill at 3, two at 2, three at 1, the other seven at 0. */
export const STARTING_SPREAD = { 3: 1, 2: 2, 1: 3, 0: 7 };

/** The four Traits every character has. The Gift is handled separately. */
export const TRAITS = ["station", "deck", "bond", "encumbrance"];

/**
 * Traits that add a die when relevant. Encumbrance is the character's trouble:
 * it never adds a die, it widens the Margin of Error and earns Stamps.
 */
export const DICE_TRAITS = ["station", "deck", "bond"];

/** Notice statuses, mildest to worst, then Closed (recovery formally closes a Notice). */
export const NOTICE_STATUSES = ["pending", "observation", "escalated", "closed"];

export const TIERS = ["denied", "conditions", "approved", "commended"];
