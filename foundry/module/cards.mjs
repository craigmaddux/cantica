import { SYSTEM_ID } from "./config.mjs";
import { pickCard, newTrait } from "./scene.mjs";
import { refreshScrutinyTracker } from "./scrutiny.mjs";

const { DialogV2 } = foundry.applications.api;
const SOCKET = `system.${SYSTEM_ID}`;

/* -------------------------------------------- */
/*  Where is a character?                       */
/* -------------------------------------------- */

/** The card the GM has marked as the active scene, if any. */
export const activeCard = () => game.actors.find(a => a.type === "card" && a.system.active) ?? null;

/** Card tokens on a scene. */
const cardTokens = scene => scene.tokens.filter(token => token.actor?.type === "card");

const rectOf = (token, scene) => {
  const size = scene.grid.size;
  return { x: token.x, y: token.y, w: token.width * size, h: token.height * size, sort: token.sort };
};

/** The token to judge an actor's position by: a selected one, else any of theirs on the viewed scene. */
function tokenFor(actor) {
  const selected = canvas.tokens?.controlled.find(token => token.actor === actor);
  return (selected ?? actor.getActiveTokens()[0])?.document ?? null;
}

/** The card an actor's token is standing on, or null. */
export function detectCard(actor) {
  const scene = canvas?.scene;
  const token = scene && tokenFor(actor);
  if (!token) return null;

  const size = scene.grid.size;
  const center = { x: token.x + (token.width * size) / 2, y: token.y + (token.height * size) / 2 };
  const cards = cardTokens(scene).map(t => ({ id: t.actor.id, ...rectOf(t, scene) }));
  const id = pickCard(center, cards);
  return id ? game.actors.get(id) : null;
}

/**
 * What the roll dialog should offer for an actor: every card on the viewed scene plus
 * the active one, with the best guess preselected (token on a card, else the active card).
 */
export function sceneChoices(actor) {
  const detected = detectCard(actor);
  const active = activeCard();

  const cards = new Map();
  if (canvas?.scene) cardTokens(canvas.scene).forEach(t => cards.set(t.actor.id, t.actor));
  if (active) cards.set(active.id, active);
  if (detected) cards.set(detected.id, detected);

  const chosen = detected ?? active;
  return {
    selectedId: chosen?.id ?? "",
    source: detected ? "token" : active ? "active" : "none",
    cards: [...cards.values()].sort((a, b) => a.name.localeCompare(b.name))
  };
}

/* -------------------------------------------- */
/*  Editing                                     */
/* -------------------------------------------- */

/** Add a Trait to a card. Needs permission to update the card (the GM). */
export async function addTrait(card, fields) {
  const trait = newTrait({ id: foundry.utils.randomID(), ...fields });
  await card.update({ "system.traits": [...card.toObject().system.traits, trait] });
  return trait;
}

/** Mark one card as the active scene; every other card stops being active. GM only. */
export async function setActiveCard(card) {
  const updates = game.actors
    .filter(a => a.type === "card" && (a.id === card.id ? !a.system.active : a.system.active))
    .map(a => ({ _id: a.id, "system.active": a.id === card.id }));
  if (updates.length) await CONFIG.Actor.documentClass.updateDocuments(updates);
}

/* -------------------------------------------- */
/*  Amend the Scene (a Stamp spend)             */
/* -------------------------------------------- */

/** The character a player is acting as: their assigned one, a selected token's, or their only one. */
function playerActor() {
  const candidates = [game.user.character, canvas.tokens?.controlled[0]?.actor];
  return candidates.find(a => a?.type === "character" && a.isOwner)
    ?? game.actors.find(a => a.type === "character" && a.isOwner)
    ?? null;
}

/**
 * Spend a Stamp to declare a new scene Trait: worth +1 die to anyone who can plausibly use it.
 * Players can't edit a card, so the request goes to the GM's client, which checks the Stamp,
 * deducts it, and adds the Trait.
 */
export async function amendScene(card) {
  const i18n = game.i18n;
  const actor = playerActor();
  if (!actor) return ui.notifications.warn(i18n.localize("CANTICA.Card.NoCharacter"));
  if (actor.system.stamps < 1) return ui.notifications.warn(i18n.localize("CANTICA.Stamps.None"));
  if (!game.users.activeGM) return ui.notifications.warn(i18n.localize("CANTICA.Card.NoGM"));

  const trait = await DialogV2.prompt({
    window: { title: i18n.format("CANTICA.Card.AmendTitle", { card: card.name }) },
    content: `<p class="hint">${i18n.localize("CANTICA.Card.AmendHint")}</p>
      <div class="form-group"><label>${i18n.localize("CANTICA.Card.TraitName")}</label>
        <input type="text" name="name" autofocus></div>
      <div class="form-group"><label>${i18n.localize("CANTICA.Card.TraitNote")}</label>
        <input type="text" name="note"></div>`,
    ok: {
      label: i18n.localize("CANTICA.Card.AmendConfirm"),
      callback: (event, button) => ({
        name: button.form.elements.name.value.trim(),
        note: button.form.elements.note.value.trim()
      })
    },
    rejectClose: false
  });
  if (!trait?.name) return;

  game.socket.emit(SOCKET, {
    action: "addTrait",
    cardId: card.id,
    actorId: actor.id,
    userId: game.user.id,
    name: trait.name,
    note: trait.note
  });
  ui.notifications.info(i18n.format("CANTICA.Card.AmendSent", { name: trait.name }));
}

/** GM side of Amend the Scene: verify the request, spend the Stamp, add the Trait, announce it. */
async function onAddTraitRequest(data) {
  if (data?.action !== "addTrait" || !game.user.isActiveGM) return;

  const card = game.actors.get(data.cardId);
  const actor = game.actors.get(data.actorId);
  const user = game.users.get(data.userId);
  const name = String(data.name ?? "").trim().slice(0, 80);
  if (card?.type !== "card" || actor?.type !== "character" || !user || !name) return;
  if (!actor.testUserPermission(user, "OWNER") || actor.system.stamps < 1) return;

  await actor.adjustStamps(-1);
  // Amending the room adds a Trait: anyone who can plausibly use it may pick it for +1 die.
  await addTrait(card, { name, note: String(data.note ?? "").slice(0, 200) });

  const ChatMessage = CONFIG.ChatMessage.documentClass;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat/amend.hbs`, {
      actorName: actor.name,
      card: card.name,
      trait: name,
      note: data.note
    })
  });
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

export function registerCards() {
  // New art for a card: carry it to the tokens already on the tabletop. One GM client does it.
  Hooks.on("updateActor", async (actor, changes, options, userId) => {
    if (actor.type !== "card") return;
    refreshScrutinyTracker();
    if (!("img" in changes) || userId !== game.user.id || !game.user.isGM) return;

    for (const scene of game.scenes) {
      const updates = scene.tokens.filter(t => t.actorId === actor.id).map(t => ({ _id: t.id, "texture.src": actor.img }));
      if (updates.length) await scene.updateEmbeddedDocuments("Token", updates);
    }
  });

  Hooks.on("deleteActor", actor => { if (actor.type === "card") refreshScrutinyTracker(); });
}

/** Listen for players asking the GM to add a Trait (after spending a Stamp). */
export function listenForCards() {
  game.socket.on(SOCKET, onAddTraitRequest);
}
