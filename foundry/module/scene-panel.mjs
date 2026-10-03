import { SYSTEM_ID } from "./config.mjs";
import { amendScene } from "./cards.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * The scene panel: a Scene Card as a window on the screen, the way the card sheet looks, read-only.
 * Any number can be open at once. A GM can put a card on everyone's screen; each player can move,
 * resize and close their own copy. Panels redraw live as the card changes.
 */

const SHOWN = "shownPanels";       // world setting: card ids the GM has put on everyone's screen
const POSITIONS = "panelPositions"; // client setting: where this user last left each panel

const panels = new Map(); // card id -> open ScenePanel

export function registerPanels() {
  game.settings.register(SYSTEM_ID, SHOWN, {
    scope: "world", config: false, type: Array, default: [],
    onChange: () => reconcilePanels()
  });
  game.settings.register(SYSTEM_ID, POSITIONS, { scope: "client", config: false, type: Object, default: {} });

  // Panels redraw live as their card changes, and close if it is deleted.
  Hooks.on("updateActor", actor => { if (actor.type === "card") refreshPanel(actor.id); });
  Hooks.on("deleteActor", actor => { if (actor.type === "card") closePanel(actor.id); });
}

export const shownIds = () => game.settings.get(SYSTEM_ID, SHOWN) ?? [];
export const isShown = id => shownIds().includes(id);

/** GM: put a card on everyone's screen, or take it off. */
export async function setShown(id, on) {
  if (!game.user.isGM) return;
  const ids = new Set(shownIds());
  if (on) ids.add(id); else ids.delete(id);
  await game.settings.set(SYSTEM_ID, SHOWN, [...ids]);
}

/** Open (or bring to the front) a panel for a card, on this screen only. */
export function openPanel(cardId, { fromTable = false } = {}) {
  const card = game.actors.get(cardId);
  if (card?.type !== "card") return null;
  let panel = panels.get(cardId);
  if (!panel) { panel = new ScenePanel(card); panels.set(cardId, panel); }
  if (fromTable) panel.fromTable = true;
  panel.render({ force: true });
  return panel;
}

export const closePanel = cardId => panels.get(cardId)?.close();

/** Make this screen match the GM's list: open what's shown, close what the GM took away. */
export function reconcilePanels() {
  const shown = new Set(shownIds());
  for (const id of shown) {
    if (!panels.get(id)?.rendered) openPanel(id, { fromTable: true });
  }
  for (const [id, panel] of panels) {
    if (panel.fromTable && !shown.has(id)) panel.close();
  }
}

/** Redraw the panel for a card whose data changed. */
export const refreshPanel = cardId => { const panel = panels.get(cardId); if (panel?.rendered) panel.render(); };

class ScenePanel extends HandlebarsApplicationMixin(ApplicationV2) {
  /** Opened because the GM put it on everyone's screen (so the GM can also take it away). */
  fromTable = false;

  static DEFAULT_OPTIONS = {
    classes: ["cantica", "scene-panel"],
    position: { width: 360 },
    window: { icon: "fa-solid fa-map-location-dot", resizable: true, minimizable: true },
    actions: {
      openSheet: ScenePanel.#onOpenSheet,
      hideFromTable: ScenePanel.#onHide,
      amend: ScenePanel.#onAmend
    }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/app/panel.hbs`, scrollable: [".panel-body"] }
  };

  constructor(card) {
    const saved = game.settings.get(SYSTEM_ID, POSITIONS)?.[card.id];
    const n = panels.size;
    super({
      id: `cantica-panel-${card.id}`,
      position: saved ?? { width: 360, top: 90 + n * 30, left: 60 + n * 30 }
    });
    this.card = card;
  }

  get title() { return this.card.name; }

  async _prepareContext() {
    const card = this.card;
    return {
      name: card.name,
      img: card.img,
      description: card.system.description,
      active: card.system.active,
      isGM: game.user.isGM,
      shown: isShown(card.id),
      traits: card.system.traits.filter(t => t.name).map(t => ({ ...t, hasNote: Boolean(t.note) }))
    };
  }

  /** Remember where this user left the panel. */
  setPosition(position) {
    const result = super.setPosition(position);
    if (this.rendered && result) {
      const { top, left, width, height } = result;
      this.#remember({ top, left, width, height });
    }
    return result;
  }

  #timer = null;
  #remember(pos) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const all = foundry.utils.deepClone(game.settings.get(SYSTEM_ID, POSITIONS) ?? {});
      all[this.card.id] = pos;
      game.settings.set(SYSTEM_ID, POSITIONS, all);
    }, 400);
  }

  _onClose(options) {
    super._onClose?.(options);
    if (panels.get(this.card.id) === this) panels.delete(this.card.id);
  }

  static #onOpenSheet() { this.card.sheet.render(true); }
  static async #onHide() { await setShown(this.card.id, false); }
  static async #onAmend() { await amendScene(this.card); }
}
