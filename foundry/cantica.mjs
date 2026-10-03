/**
 * Cantica: a native game system for the generational ark ship.
 * Entry point: registers the document classes, sheets and hooks.
 */
import { SYSTEM_ID } from "./module/config.mjs";
import * as rules from "./module/rules.mjs";
import * as notices from "./module/notices.mjs";
import CanticaActor from "./module/documents/actor.mjs";
import CharacterData from "./module/data/character.mjs";
import NpcData from "./module/data/npc.mjs";
import CardData from "./module/data/card.mjs";
import CharacterSheet from "./module/apps/character-sheet.mjs";
import NpcSheet from "./module/apps/npc-sheet.mjs";
import CardSheet from "./module/apps/card-sheet.mjs";
import PoolDialog from "./module/apps/pool-dialog.mjs";
import { rollPool } from "./module/dice/roll.mjs";
import { registerDiceColors } from "./module/dice/dsn.mjs";
import { onRenderChatMessage } from "./module/chat.mjs";
import Ledger from "./module/apps/ledger.mjs";
import { registerCardArt, repaintCards } from "./module/card-art.mjs";
import { openRegistration, hold, release, holds } from "./module/apps/registration.mjs";
import { registerPanels, reconcilePanels, openPanel, setShown } from "./module/scene-panel.mjs";
import { initLore, importLore } from "./module/lore.mjs";
import { registerCards, listenForCards, activeCard, detectCard, setActiveCard } from "./module/cards.mjs";
import { registerScrutiny, listenForScrutiny, showScrutiny, getScrutiny, gainScrutiny } from "./module/scrutiny.mjs";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing the Cantica system`);

  CONFIG.Actor.documentClass = CanticaActor;
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Actor.dataModels.npc = NpcData;
  CONFIG.Actor.dataModels.card = CardData;

  // Popcorn initiative: no roll. Combatants all start equal and the table passes the turn.
  CONFIG.Combat.initiative = { formula: "0", decimals: 0 };

  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(CONFIG.Actor.documentClass, SYSTEM_ID, CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "CANTICA.SheetLabel"
  });
  DocumentSheetConfig.registerSheet(CONFIG.Actor.documentClass, SYSTEM_ID, NpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "CANTICA.NpcSheetLabel"
  });

  DocumentSheetConfig.registerSheet(CONFIG.Actor.documentClass, SYSTEM_ID, CardSheet, {
    types: ["card"],
    makeDefault: true,
    label: "CANTICA.CardSheetLabel"
  });

  registerScrutiny();
  registerCards();
  registerCardArt();
  registerPanels();

  // Register With Gloss opens by itself for a brand-new character, unless the player turns that off.
  game.settings.register(SYSTEM_ID, "autoRegister", {
    name: "CANTICA.Register.AutoSetting",
    hint: "CANTICA.Register.AutoHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
  initLore();

  // The Ledger: Gloss's entries, inside Foundry.
  let ledger = null;
  const openLedger = id => {
    ledger ??= new Ledger();
    return id ? ledger.openEntry(id) : ledger.render({ force: true });
  };
  game.keybindings.register(SYSTEM_ID, "openLedger", {
    name: "CANTICA.Ledger.Keybind",
    editable: [],
    onDown: () => { openLedger(); return true; }
  });

  // Handy for macros: game.cantica.rollPool(actor, { skill: "hullcraft" }) or new game.cantica.PoolDialog({ actor }).
  game.cantica = { rules, notices, rollPool, PoolDialog, showScrutiny, getScrutiny, gainScrutiny, activeCard, detectCard, setActiveCard, openLedger, importLore, openPanel, setShown, repaintCards, register: openRegistration };

  return foundry.applications.handlebars.loadTemplates([
    `systems/${SYSTEM_ID}/templates/actor/character.hbs`,
    `systems/${SYSTEM_ID}/templates/actor/npc.hbs`,
    `systems/${SYSTEM_ID}/templates/actor/card.hbs`,
    `systems/${SYSTEM_ID}/templates/parts/notices.hbs`,
    `systems/${SYSTEM_ID}/templates/dialog/pool.hbs`,
    `systems/${SYSTEM_ID}/templates/app/scrutiny.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/roll.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/clause.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/notice.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/amend.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/grade.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/lore.hbs`,
    `systems/${SYSTEM_ID}/templates/app/ledger.hbs`,
    `systems/${SYSTEM_ID}/templates/app/panel.hbs`
  ]);
});

Hooks.once("ready", () => {
  listenForScrutiny();
  listenForCards();
  reconcilePanels();
  if (game.settings.get(SYSTEM_ID, "showScrutiny")) showScrutiny();
});

// Dice So Nice is optional; its hook simply never fires without it.
Hooks.once("diceSoNiceReady", dice3d => registerDiceColors(dice3d));

Hooks.on("renderChatMessageHTML", onRenderChatMessage);

// A Ledger button in the Actors directory header.
Hooks.on("renderActorDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  const actions = root?.querySelector(".header-actions");
  if (!actions || actions.querySelector(".cantica-ledger-button")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cantica-ledger-button";
  button.innerHTML = `<i class="fa-solid fa-book-open"></i> ${game.i18n.localize("CANTICA.Ledger.Title")}`;
  button.addEventListener("click", () => game.cantica.openLedger());
  actions.append(button);
});

// A new character, made by this player, starts in creation: Register With Gloss opens, and the sheet
// waits behind it. The hold is placed before the sheet can open, so which window appears first no
// longer depends on timing.
Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if (userId !== game.user.id || actor.type !== "character" || !actor.system.creation) return;
  if (game.settings.get(SYSTEM_ID, "autoRegister")) hold(actor.id);
});

Hooks.on("createActor", async (actor, options, userId) => {
  if (userId !== game.user.id || actor.type !== "character" || !actor.system.creation) return;
  if (!holds(actor.id) && !game.settings.get(SYSTEM_ID, "autoRegister")) return;
  try {
    await openRegistration(actor);
  } catch (error) {
    console.error(error);
    release(actor.id);
    actor.sheet.render(true);
  }
});
