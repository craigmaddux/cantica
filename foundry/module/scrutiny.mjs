import { SYSTEM_ID } from "./config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Scrutiny: the GM's currency. It rises by 1 whenever any player's Margin comes
 * up as an Error, and is spent narratively. This module only keeps the counter:
 * a world setting visible to everyone on a small tracker.
 */

const SOCKET = `system.${SYSTEM_ID}`;
let tracker = null;

export const getScrutiny = () => game.settings.get(SYSTEM_ID, "scrutiny");

async function setScrutiny(value) {
  await game.settings.set(SYSTEM_ID, "scrutiny", Math.max(0, Math.trunc(value)));
}

export function registerScrutiny() {
  game.settings.register(SYSTEM_ID, "scrutiny", {
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: () => tracker?.render()
  });

  game.settings.register(SYSTEM_ID, "showScrutiny", {
    name: "CANTICA.Scrutiny.ShowSetting",
    hint: "CANTICA.Scrutiny.ShowHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: show => (show ? showScrutiny() : tracker?.close())
  });
}

/** Players can't write world settings, so their Errors are relayed to the active GM over the socket. */
export function listenForScrutiny() {
  game.socket.on(SOCKET, data => {
    // Only +1 is accepted from other clients: that is all an Error ever gives.
    if (data?.action === "scrutiny" && data.delta === 1 && game.user.isActiveGM) setScrutiny(getScrutiny() + 1);
  });
}

/** Add 1 Scrutiny (a Margin of Error). Works from any client. */
export async function gainScrutiny() {
  if (game.user.isGM) return setScrutiny(getScrutiny() + 1);
  game.socket.emit(SOCKET, { action: "scrutiny", delta: 1 });
}

export function showScrutiny() {
  tracker ??= new ScrutinyTracker();
  return tracker.render({ force: true });
}

/** Re-render the table window (the active scene's name appears on it). */
export function refreshScrutinyTracker() {
  if (tracker?.rendered) tracker.render();
}

class ScrutinyTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "cantica-scrutiny",
    classes: ["cantica", "scrutiny"],
    position: { width: 190, top: 120, left: 120 },
    window: { title: "CANTICA.Scrutiny.Label", icon: "fa-solid fa-eye", minimizable: true, resizable: false },
    actions: {
      adjust: ScrutinyTracker.#onAdjust,
      reset: ScrutinyTracker.#onReset,
      openLedger: () => game.cantica?.openLedger()
    }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/app/scrutiny.hbs` }
  };

  async _prepareContext() {
    const card = game.actors.find(a => a.type === "card" && a.system.active);
    return { value: getScrutiny(), isGM: game.user.isGM, activeCard: card?.name ?? "" };
  }

  static async #onAdjust(event, target) {
    if (game.user.isGM) await setScrutiny(getScrutiny() + Number(target.dataset.delta));
  }

  static async #onReset() {
    if (game.user.isGM) await setScrutiny(0);
  }
}
