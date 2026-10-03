import { SYSTEM_ID } from "./config.mjs";
import { buildIndex, entryText } from "./lore-text.mjs";

/**
 * The lore: the Ledger's entries (window.LEDGER, loaded from lore/ledger-data.js, the same file the
 * website uses) and the actors and Scene Cards made from them.
 *
 * People become NPC actors; places become Scene Cards. Each is tagged with the entry it came from,
 * so the Ledger window can link to it, drag it onto the tabletop, and show its picture to players.
 */

export const LORE_ART = `systems/${SYSTEM_ID}/lore/assets/`;
const FALLBACK_NPC_ART = "icons/svg/mystery-man.svg";
const FALLBACK_CARD_ART = `systems/${SYSTEM_ID}/assets/emblem.svg`;

/**
 * Stat blocks the design spec itself gives for named people. Everyone else arrives as an ordinary,
 * untagged Minor NPC (Rating 1): Rating, Tags and Tier are the GM's call.
 */
const SPEC_STATS = {
  "sister-aiwen": { rating: 2, tag1: "Compline Voice", tag2: "Sees Through Flattery", tier: "major" }
};

const byId = {};

/** Index the entries once at startup. A world without the lore bundle simply has none. */
export function initLore() {
  const entries = loreEntries();
  entries.forEach(e => { byId[e.id] = e; });
  buildIndex(entries, byId);
}

export const loreEntries = () => window.LEDGER ?? [];
export const loreKinds = () => window.LEDGER_KINDS ?? [];
export const loreById = () => byId;
export const loreAvailable = () => loreEntries().length > 0;

/** The picture for an entry, as a path inside the system. Art is bundled flat under lore/assets/. */
export const loreImage = entry => (entry.img ? LORE_ART + entry.img.split("/").pop() : null);

/** Map of entry id to the world actor made from it. */
export function loreActors() {
  const map = new Map();
  for (const actor of game.actors) {
    const id = actor.getFlag(SYSTEM_ID, "loreId");
    if (id) map.set(id, actor);
  }
  return map;
}

/** Find a folder we made earlier, or make it. */
async function folder(name, mark, parent = null) {
  const found = game.folders.find(f => f.type === "Actor" && f.getFlag(SYSTEM_ID, "lore") === mark);
  if (found) return found;
  return CONFIG.Folder.documentClass.create({
    name, type: "Actor", folder: parent?.id ?? null, flags: { [SYSTEM_ID]: { lore: mark } }
  });
}

/**
 * One click, GM only: make an NPC for every person and a Scene Card for every place. Safe to run
 * again: anything already imported is left exactly as you edited it, and only new entries are added.
 * @returns {Promise<{created: number, existing: number}>}
 */
export async function importLore() {
  const i18n = game.i18n;
  if (!game.user.isGM) { ui.notifications.warn(i18n.localize("CANTICA.Lore.GMOnly")); return null; }
  if (!loreAvailable()) { ui.notifications.error(i18n.localize("CANTICA.Lore.Missing")); return null; }

  const existing = loreActors();
  const root = await folder("Cantica", "root");
  const peopleFolder = await folder(i18n.localize("CANTICA.Lore.People"), "people", root);
  const placesFolder = await folder(i18n.localize("CANTICA.Lore.Places"), "places", root);

  const data = [];
  for (const entry of loreEntries()) {
    if (existing.has(entry.id)) continue;
    const art = loreImage(entry);
    const flags = { [SYSTEM_ID]: { loreId: entry.id } };
    const text = [entry.tag, entryText(entry, byId)].filter(Boolean).join("\n\n");

    if (entry.kind === "people") {
      // Rating, Tags and Tier are the GM's call, except where the spec gives a stat block.
      data.push({
        name: entry.name, type: "npc", folder: peopleFolder.id, flags,
        img: art ?? FALLBACK_NPC_ART,
        system: { rating: 1, tier: "minor", notes: text, ...SPEC_STATS[entry.id] },
        prototypeToken: { name: entry.name, texture: { src: art ?? FALLBACK_NPC_ART } }
      });
    } else if (entry.kind === "places") {
      data.push({
        name: entry.name, type: "card", folder: placesFolder.id, flags,
        img: art ?? FALLBACK_CARD_ART,
        system: { description: text }
      });
    }
  }

  if (data.length) await CONFIG.Actor.documentClass.createDocuments(data);
  const result = { created: data.length, existing: existing.size };
  ui.notifications.info(i18n.format("CANTICA.Lore.Imported", result));
  return result;
}
