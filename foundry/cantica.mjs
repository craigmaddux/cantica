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

  // Handy for macros: game.cantica.rollPool(actor, { skill: "hullcraft" }) or new game.cantica.PoolDialog({ actor }).
  game.cantica = { rules, notices, rollPool, PoolDialog, showScrutiny, getScrutiny, gainScrutiny, activeCard, detectCard, setActiveCard };

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
    `systems/${SYSTEM_ID}/templates/chat/amend.hbs`
  ]);
});

Hooks.once("ready", () => {
  listenForScrutiny();
  listenForCards();
  if (game.settings.get(SYSTEM_ID, "showScrutiny")) showScrutiny();
});

// Dice So Nice is optional; its hook simply never fires without it.
Hooks.once("diceSoNiceReady", dice3d => registerDiceColors(dice3d));

Hooks.on("renderChatMessageHTML", onRenderChatMessage);
