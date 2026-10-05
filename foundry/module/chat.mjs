import { SYSTEM_ID } from "./config.mjs";
import { getScrutiny, spendScrutiny } from "./scrutiny.mjs";
import { renderRollCard, rollExtraDie } from "./dice/roll.mjs";
import { escapeHtml } from "./lore-text.mjs";
import { canRefile, canRaise, refile, raiseRating } from "./card-actions.mjs";
import { shownOutcome } from "./roll-card.mjs";
import { countRoll } from "./docket.mjs";

const { DialogV2 } = foundry.applications.api;

const SOCKET = `system.${SYSTEM_ID}`;

/**
 * Wire up the buttons on Cantica roll cards. Cards are saved HTML plus a saved roll state, so each
 * button's visibility is worked out from the message flags and who is looking, on every render.
 *
 * After the roll, players spend Stamps (Refile, Negate) and the GM spends Scrutiny
 * (Complicate, Raise the Rating). See card-actions.mjs for the rules.
 */
export function onRenderChatMessage(message, html) {
  const flags = message.flags?.[SYSTEM_ID];
  if (!flags) return;
  const actor = game.actors.get(flags.actorId);

  claimStamp(message, html, flags, actor);
  refileDie(message, html, flags, actor);
  negate(message, html, flags, actor);
  complicate(message, html, flags);
  raise(message, html, flags);
  docketCount(message, html, flags);

  // Hide the whole row if none of its buttons is for this person.
  const bar = html.querySelector(".card-actions");
  if (bar && ![...bar.querySelectorAll("button")].some(button => !button.hidden)) bar.hidden = true;
}

/** Margin of Grace: take a Stamp. */
function claimStamp(message, html, flags, actor) {
  const button = html.querySelector('[data-action="claim-stamp"]');
  if (!button) return;

  if (flags.stampClaimed) {
    button.disabled = true;
    button.textContent = game.i18n.localize("CANTICA.Roll.StampClaimed");
  } else if (!actor?.isOwner) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async event => {
    event.preventDefault();
    if (!actor?.isOwner || message.flags[SYSTEM_ID]?.stampClaimed) return;
    // Mark the card first so a double click can't award two Stamps.
    await message.update({ [`flags.${SYSTEM_ID}.stampClaimed`]: true });
    await actor.adjustStamps(1);
  });
}

/** The roller: spend a Stamp to reroll one failed white die, once per roll. */
function refileDie(message, html, flags, actor) {
  const button = html.querySelector('[data-action="refile"]');
  if (!button) return;
  const state = flags.state;

  if (!actor?.isOwner || !state || !canRefile(state) || actor.system.stamps < 1) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async event => {
    event.preventDefault();
    button.disabled = true;
    const current = message.flags[SYSTEM_ID]?.state;
    if (!current || !canRefile(current) || actor.system.stamps < 1) return;
    await actor.adjustStamps(-1);
    const value = await rollExtraDie();
    await redraw(message, refile(current, { value, who: actor.name }));
  });
}

/**
 * GM: spend 1 Scrutiny on one of the scene's Traits to take a success off this roll.
 * The player can negate it with a Stamp; the Scrutiny is spent either way.
 */
function complicate(message, html, flags) {
  const button = html.querySelector('[data-action="complicate"]');
  if (!button) return;
  const state = flags.state;
  const card = game.actors.get(state?.sceneId);

  // Only the GM sees it, only once, and only while there is Scrutiny to spend and a Trait to use.
  if (!game.user.isGM || state?.complication || !card?.system.traits.some(trait => trait.name) || getScrutiny() < 1) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async event => {
    event.preventDefault();
    const i18n = game.i18n;
    const traits = card.system.traits.filter(trait => trait.name);
    const chosen = await DialogV2.prompt({
      window: { title: i18n.localize("CANTICA.Complication.Title") },
      content: `<p class="hint">${i18n.format("CANTICA.Complication.Prompt", { scene: card.name })}</p>
        <div class="form-group"><label>${i18n.localize("CANTICA.Complication.Which")}</label>
          <select name="trait">${traits.map(trait => `<option value="${escapeHtml(trait.name)}">${escapeHtml(trait.name)}</option>`).join("")}</select></div>`,
      ok: {
        label: i18n.localize("CANTICA.Complication.Confirm"),
        callback: (ev, btn) => btn.form.elements.trait.value
      },
      rejectClose: false
    });
    if (!chosen) return;

    if (!(await spendScrutiny(1))) return ui.notifications.warn(i18n.localize("CANTICA.Complication.NoScrutiny"));
    const current = message.flags[SYSTEM_ID]?.state ?? state;
    await redraw(message, { ...current, complication: { trait: chosen, negated: false } });
  });
}

/** The roller (or anyone who owns the character): spend a Stamp to negate the GM's Complication. */
function negate(message, html, flags, actor) {
  const button = html.querySelector('[data-action="negate"]');
  if (!button) return;
  const state = flags.state;

  if (!actor?.isOwner || !state?.complication || state.complication.negated || actor.system.stamps < 1) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async event => {
    event.preventDefault();
    if (actor.system.stamps < 1) return;
    button.disabled = true;
    await actor.adjustStamps(-1);
    const current = message.flags[SYSTEM_ID]?.state ?? state;
    await redraw(message, { ...current, complication: { ...current.complication, negated: true } });
  });
}

/**
 * GM only: when the scene this roll was made in has an open Docket, count the roll into it. Every success fills
 * a box; a Margin of Error moves the Deadline up. A card is counted by what it shows now, so if it changes after
 * (a Refile, a Complication) the button offers to update the Docket by the difference.
 */
function docketCount(message, html, flags) {
  const button = html.querySelector('[data-action="docket"]');
  if (!button) return;
  const state = flags.state;
  const card = game.actors.get(state?.sceneId);
  const docket = card?.system?.docket;
  if (!game.user.isGM || !state || !docket?.open) return;

  const shown = shownOutcome(state).successes;
  const counted = flags.docket?.counted;
  if (counted === shown) return;

  const i18n = game.i18n;
  button.textContent = counted === undefined
    ? i18n.format("CANTICA.Docket.Count", { n: shown })
    : i18n.format("CANTICA.Docket.Update", { n: shown - counted > 0 ? `+${shown - counted}` : shown - counted });
  button.title = i18n.localize("CANTICA.Docket.CountTitle");
  button.hidden = false;

  button.addEventListener("click", async event => {
    event.preventDefault();
    button.disabled = true;
    const live = game.actors.get(state.sceneId);
    const current = message.flags[SYSTEM_ID]?.state ?? state;
    const previous = message.flags[SYSTEM_ID]?.docket ?? {};
    const result = countRoll(live.toObject().system.docket, {
      shown: shownOutcome(current).successes, counted: previous.counted ?? 0,
      error: Boolean(current.outcome?.error), errorCounted: Boolean(previous.errorCounted)
    });
    await live.update({ "system.docket": result.docket });
    await message.update({ [`flags.${SYSTEM_ID}.docket`]: { counted: result.counted, errorCounted: result.errorCounted } });
    if (result.pushed) ui.notifications.info(i18n.localize("CANTICA.Docket.Pushed"));
  });
}

/** GM: spend 1 Scrutiny to raise the Rating of the NPC being rolled against by 1, for this roll. */
function raise(message, html, flags) {
  const button = html.querySelector('[data-action="raise"]');
  if (!button) return;
  const state = flags.state;

  if (!game.user.isGM || !state || !canRaise(state) || getScrutiny() < 1) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async event => {
    event.preventDefault();
    button.disabled = true;
    const current = message.flags[SYSTEM_ID]?.state ?? state;
    if (!canRaise(current)) return;
    if (!(await spendScrutiny(1))) return ui.notifications.warn(game.i18n.localize("CANTICA.CardAction.raise.NoScrutiny"));
    await redraw(message, raiseRating(current));
  });
}

/**
 * Save a new roll state on the message and redraw its card. A player can only change their own
 * messages, so a change to anyone else's (a Countersign, or any action on a roll the GM made) is
 * handed to the GM's client, which makes it.
 */
async function redraw(message, state) {
  if (message.canUserModify(game.user, "update")) return write(message, state);
  game.socket.emit(SOCKET, { action: "redraw-roll", messageId: message.id, state });
}

async function write(message, state) {
  await message.update({
    content: await renderRollCard(state),
    [`flags.${SYSTEM_ID}.state`]: state
  });
}

/** The active GM redraws a card on a player's behalf, and hands a Countersign's Stamp to its new owner. */
export function listenForRollChanges() {
  game.socket.on(SOCKET, data => {
    // A Countersign: one Stamp, given to another character. The giver has already spent theirs.
    if (data?.action === "give-stamp" && game.user.isActiveGM) {
      const to = game.actors.get(data.toId);
      if (to?.type === "character") to.adjustStamps(1);
      return;
    }
    if (data?.action !== "redraw-roll" || !game.user.isActiveGM) return;
    const message = game.messages.get(data.messageId);
    if (!message?.flags?.[SYSTEM_ID]?.state || !data.state || typeof data.state !== "object") return;
    write(message, data.state);
  });
}
