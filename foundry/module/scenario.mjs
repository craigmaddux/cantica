import { SYSTEM_ID } from "./config.mjs";
import { SCENARIO as HURTING_ON_DECK_22 } from "./scenarios/hurting-on-deck-22.mjs";

/**
 * Scenarios: a one-shot's people, places and notes, imported in one click (GM only). The people arrive hidden from
 * players; the places arrive as Scene Cards (which players can see, like every card); the notes are a GM-only journal.
 * Safe to run again: anything already imported is left exactly as you edited it, and only what's missing is added.
 */

export const SCENARIOS = { [HURTING_ON_DECK_22.id]: HURTING_ON_DECK_22 };

const FALLBACK_NPC_ART = "icons/svg/mystery-man.svg";
const FALLBACK_CARD_ART = `systems/${SYSTEM_ID}/assets/emblem.svg`;

/** Find a folder we made for a scenario, or make it. */
async function folder(type, name, scenarioId) {
  const found = game.folders.find(f => f.type === type && f.getFlag(SYSTEM_ID, "scenario") === scenarioId);
  if (found) return found;
  return CONFIG.Folder.documentClass.create({ name, type, flags: { [SYSTEM_ID]: { scenario: scenarioId } } });
}

/** Everything in the world already made for this scenario, by key. */
function madeFor(scenarioId) {
  const map = new Map();
  for (const actor of game.actors) {
    const flag = actor.getFlag(SYSTEM_ID, "scenarioKey");
    if (flag?.startsWith(`${scenarioId}:`)) map.set(flag, actor);
  }
  return map;
}

/**
 * Import a scenario. An NPC that already exists in the world under the same name (from the lore import, say) is not
 * duplicated: if it has no Tags yet, the scenario's stat block is filled in; otherwise it is left alone.
 * @param {string} [id]
 * @returns {Promise<{npcs: number, places: number, filled: number, journal: boolean}|null>}
 */
export async function importScenario(id = HURTING_ON_DECK_22.id) {
  const i18n = game.i18n;
  const scenario = SCENARIOS[id];
  if (!scenario) return null;
  if (!game.user.isGM) { ui.notifications.warn(i18n.localize("CANTICA.Scenario.GMOnly")); return null; }

  const made = madeFor(id);
  const actorFolder = await folder("Actor", scenario.name, id);
  const Actor = CONFIG.Actor.documentClass;
  const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;
  const data = [];
  let filled = 0;
  let npcs = 0;
  let places = 0;

  for (const npc of scenario.npcs) {
    const key = `${id}:${npc.key}`;
    if (made.has(key)) continue;
    const stat = { rating: npc.rating, tier: npc.tier, actionTag: npc.action ?? 1, tag1: npc.tags[0] ?? "", tag2: npc.tags[1] ?? "", tag3: npc.tags[2] ?? "" };

    // Someone with this name is already here (the lore import makes Tamsin Voy and Proctor Halvard).
    const existing = npc.match ? game.actors.find(a => a.type === "npc" && a.name === npc.match) : null;
    if (existing) {
      if (!existing.system.tag1 && !existing.system.tag2) { await existing.update({ system: stat }); filled++; }
      await existing.setFlag(SYSTEM_ID, "scenarioKey", key);
      continue;
    }

    npcs++;
    data.push({
      name: npc.name, type: "npc", folder: actorFolder.id, img: FALLBACK_NPC_ART,
      flags: { [SYSTEM_ID]: { scenarioKey: key } },
      ownership: { default: DOCUMENT_OWNERSHIP_LEVELS.NONE },
      system: { ...stat, notes: npc.notes },
      prototypeToken: { name: npc.name, texture: { src: FALLBACK_NPC_ART } }
    });
  }

  for (const place of scenario.places) {
    const key = `${id}:${place.key}`;
    if (made.has(key)) continue;
    places++;
    data.push({
      name: place.name, type: "card", folder: actorFolder.id, img: FALLBACK_CARD_ART,
      flags: { [SYSTEM_ID]: { scenarioKey: key } },
      system: {
        description: place.description,
        traits: place.traits.map(name => ({ id: foundry.utils.randomID(), name, note: "" }))
      }
    });
  }

  if (data.length) await Actor.createDocuments(data);

  // The GM's notes: a journal nobody else can see.
  let journal = false;
  const journalFolder = await folder("JournalEntry", scenario.name, id);
  const hasJournal = game.journal.some(j => j.getFlag(SYSTEM_ID, "scenario") === id);
  if (!hasJournal) {
    await CONFIG.JournalEntry.documentClass.create({
      name: `${scenario.name}: GM notes`,
      folder: journalFolder.id,
      flags: { [SYSTEM_ID]: { scenario: id } },
      ownership: { default: DOCUMENT_OWNERSHIP_LEVELS.NONE },
      pages: scenario.journal.map(page => ({ name: page.name, type: "text", text: { content: page.html, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML } }))
    });
    journal = true;
  }

  const result = { npcs, places, filled, journal };
  ui.notifications.info(i18n.format("CANTICA.Scenario.Imported", { name: scenario.name, ...result, journal: journal ? 1 : 0 }));
  return result;
}
