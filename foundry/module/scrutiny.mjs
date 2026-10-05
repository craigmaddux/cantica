import { SYSTEM_ID } from "./config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * Scrutiny: the GM's currency. It starts each session at one per player, and rises by 1 whenever any player's Margin comes
 * up as an Error, and is spent narratively. This module only keeps the counter:
 * a world setting visible to everyone on a small tracker.
 */

const SOCKET = `system.${SYSTEM_ID}`;
let tracker = null;

export const getScrutiny = () => game.settings.get(SYSTEM_ID, "scrutiny");

async function setScrutiny(value) {
  await game.settings.set(SYSTEM_ID, "scrutiny", Math.max(0, Math.trunc(value)));
}

/** GM: spend Scrutiny. Returns false (and spends nothing) if there is not enough. */
export async function spendScrutiny(n = 1) {
  if (!game.user.isGM || getScrutiny() < n) return false;
  await setScrutiny(getScrutiny() - n);
  return true;
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
      startSession: ScrutinyTracker.#onStartSession,
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

  /**
   * Start a session: Scrutiny becomes one per player (the GM can change the number), and every player's
   * character is topped up to the Stamps its Grade begins a session with.
   */
  static async #onStartSession() {
    if (!game.user.isGM) return;
    const i18n = game.i18n;
    const players = game.users.filter(user => !user.isGM && user.active).length || game.users.filter(user => !user.isGM).length || 1;
    const characters = game.actors.filter(actor => actor.type === "character" && actor.hasPlayerOwner);
    const answer = await DialogV2.prompt({
      window: { title: i18n.localize("CANTICA.Scrutiny.StartTitle") },
      content: `<p class="hint">${i18n.localize("CANTICA.Scrutiny.StartHint")}</p>
        <div class="form-group"><label>${i18n.localize("CANTICA.Scrutiny.StartPlayers")}</label>
          <input type="number" name="scrutiny" value="${players}" min="0" autofocus></div>
        <label class="check"><input type="checkbox" name="stamps" checked> <span>${i18n.format("CANTICA.Scrutiny.StartStamps", { n: characters.length })}</span></label>`,
      ok: {
        label: i18n.localize("CANTICA.Scrutiny.Start"),
        callback: (event, button) => ({ scrutiny: Number(button.form.elements.scrutiny.value), stamps: button.form.elements.stamps.checked })
      },
      rejectClose: false
    });
    if (!answer) return;
    await setScrutiny(answer.scrutiny);
    if (answer.stamps) for (const actor of characters) await actor.startSession();
    ui.notifications.info(i18n.format("CANTICA.Scrutiny.Started", { n: Math.max(0, Math.trunc(answer.scrutiny) || 0) }));
  }
}
