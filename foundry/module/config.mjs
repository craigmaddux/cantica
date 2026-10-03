/** Static Cantica configuration: skills, groups, Traits and tiers. */

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

/** Standard starting spread: three skills at 2, three at 1, the other seven at 0 (12 Tenure). */
export const STARTING_SPREAD = { 2: 3, 1: 3, 0: 7 };

/** Station is required; the open Traits are free text. A character starts with three and can buy up to six. */
export const OPEN_TRAITS = ["trait1", "trait2", "trait3", "trait4", "trait5", "trait6"];

/** The two Encumbrances every character has. Neither ever adds a die. */
export const ENCUMBRANCES = ["personal", "circumstantial"];

/** NPC tiers: how much of the Notice track they have. */
export const NPC_TIERS = ["background", "minor", "major"];

export const TIERS = ["denied", "conditions", "approved", "commended"];

/** Kinds of History log entry. */
export const HISTORY_KINDS = ["earned", "spent", "compline", "note"];
