import { SYSTEM_ID } from "./config.mjs";
import { HUM_BANDS, HUM_MAX, bandFor, changeHum } from "./hum.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * The Hum: how much the Bound are stirring. It is the GM's alone. The value is a world setting
 * that is never put on a player's screen; only the GM gets a window for it, and players feel it
 * through the world (and, from the Refrain, through violet dice causing Dissonance on a 2). There is
 * deliberately no setting for it that players could see; the GM's window opens by itself, and the
 * GM can reopen it from a button in the Actors directory.
 * Players' Dissonance is relayed to the active GM over the socket, like Scrutiny.
 */

const SOCKET = `system.${SYSTEM_ID}`;
let tracker = null;

export const getHum = () => game.settings.get(SYSTEM_ID, "hum");

/** GM: change the Hum, and tell the GM when it enters a new band or reaches 20. */
async function applyHum(delta) {
  const result = changeHum(getHum(), delta);
  if (result.value === result.before) return result;
  await game.settings.set(SYSTEM_ID, "hum", result.value);
  if (result.crossed || result.gives) await whisperCrossing(result);
  return result;
}

/** A private note in the chat log: only the GM sees it. */
async function whisperCrossing(result) {
  const i18n = game.i18n;
  const band = i18n.localize(`CANTICA.Hum.Band.${result.band}.name`);
  const text = result.gives
    ? `${i18n.localize("CANTICA.Hum.Gives")} ${i18n.localize("CANTICA.Hum.GivesBody")}`
    : `${i18n.format("CANTICA.Hum.Crossed", { band })} ${i18n.localize(`CANTICA.Hum.Band.${result.band}.text`)}`;
  const ChatMessage = CONFIG.ChatMessage.documentClass;
  await ChatMessage.create({
    whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id),
    speaker: { alias: i18n.localize("CANTICA.Hum.Label") },
    content: `<p>${text}</p>`
  });
}

export function registerHum() {
  game.settings.register(SYSTEM_ID, "hum", {
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: () => tracker?.render()
  });
}

/** Players can't write world settings: their Dissonance reaches the active GM over the socket. */
export function listenForHum() {
  game.socket.on(SOCKET, data => {
    if (data?.action !== "hum" || !game.user.isActiveGM) return;
    // The most a single roll can add is seven dice, each worth 2.
    const delta = Math.trunc(Number(data.delta));
    if (delta >= 1 && delta <= 14) applyHum(delta);
  });
}

/** Add Hum for Dissonance (from any client). */
export async function addHum(delta) {
  if (!(delta > 0)) return;
  if (game.user.isGM) return applyHum(delta);
  game.socket.emit(SOCKET, { action: "hum", delta });
}

/** GM only: the window is never built for anyone else. */
export function showHum() {
  if (!game.user.isGM) return;
  tracker ??= new HumTracker();
  return tracker.render({ force: true });
}

class HumTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "cantica-hum",
    classes: ["cantica", "hum"],
    position: { width: 260, top: 120, left: 340 },
    window: { title: "CANTICA.Hum.Label", icon: "fa-solid fa-wave-square", minimizable: true, resizable: false },
    actions: {
      adjust: HumTracker.#onAdjust,
      dissonance: HumTracker.#onDissonance,
      reset: HumTracker.#onReset
    }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/app/hum.hbs` }
  };

  async _prepareContext() {
    const i18n = game.i18n;
    const value = getHum();
    const band = bandFor(value);
    return {
      value,
      max: HUM_MAX,
      bandName: i18n.localize(`CANTICA.Hum.Band.${band.key}.name`),
      bandText: i18n.localize(`CANTICA.Hum.Band.${band.key}.text`),
      band: band.key,
      gives: band.key === "gives",
      refrain: value >= 10,
      // One pip per point of Hum, grouped by band.
      bands: HUM_BANDS.filter(b => b.key !== "gives").map(b => ({
        key: b.key,
        name: i18n.localize(`CANTICA.Hum.Band.${b.key}.name`),
        range: `${b.min}–${b.max}`,
        pips: Array.from({ length: b.max - b.min + 1 }, (_, i) => ({ filled: value > b.min + i }))
      }))
    };
  }

  static async #onAdjust(event, target) {
    if (game.user.isGM) await applyHum(Number(target.dataset.delta));
  }

  /** The GM triggers a Dissonance (spending Scrutiny, in the spec): +1 Hum. */
  static async #onDissonance() {
    if (game.user.isGM) await applyHum(1);
  }

  /** The event has played out: the ship goes quiet and the slow climb begins again. */
  static async #onReset() {
    if (game.user.isGM) await game.settings.set(SYSTEM_ID, "hum", 0);
  }
}
