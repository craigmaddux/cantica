/**
 * Cantica: a native game system for the generational ark ship.
 * Entry point: registers the document classes, sheets and hooks.
 */
import { SYSTEM_ID } from "./module/config.mjs";
import * as rules from "./module/rules.mjs";
import CanticaActor from "./module/documents/actor.mjs";
import CharacterData from "./module/data/character.mjs";
import CharacterSheet from "./module/apps/character-sheet.mjs";
import PoolDialog from "./module/apps/pool-dialog.mjs";
import { rollPool } from "./module/dice/roll.mjs";
import { registerDiceColors } from "./module/dice/dsn.mjs";
import { onRenderChatMessage } from "./module/chat.mjs";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing the Cantica system`);

  CONFIG.Actor.documentClass = CanticaActor;
  CONFIG.Actor.dataModels.character = CharacterData;

  // Popcorn initiative: no roll. Combatants all start equal and the table passes the turn.
  CONFIG.Combat.initiative = { formula: "0", decimals: 0 };

  foundry.applications.apps.DocumentSheetConfig.registerSheet(CONFIG.Actor.documentClass, SYSTEM_ID, CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "CANTICA.SheetLabel"
  });

  // Handy for macros: game.cantica.rollPool(actor, { skill: "hullcraft" }) or new game.cantica.PoolDialog({ actor }).
  game.cantica = { rules, rollPool, PoolDialog };

  return foundry.applications.handlebars.loadTemplates([
    `systems/${SYSTEM_ID}/templates/actor/character.hbs`,
    `systems/${SYSTEM_ID}/templates/dialog/pool.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/roll.hbs`,
    `systems/${SYSTEM_ID}/templates/chat/clause.hbs`
  ]);
});

// Dice So Nice is optional; its hook simply never fires without it.
Hooks.once("diceSoNiceReady", dice3d => registerDiceColors(dice3d));

Hooks.on("renderChatMessageHTML", onRenderChatMessage);
