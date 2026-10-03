import { SYSTEM_ID } from "../config.mjs";
import { escapeHtml, linkify, paragraphs, unlink, search, norm } from "../lore-text.mjs";
import { loreEntries, loreKinds, loreById, loreActors, loreImage, loreAvailable, importLore } from "../lore.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Where the full Concierge answers live (the website). */
const CONCIERGE = "https://craigmaddux.github.io/cantica/index.html";

/**
 * The Ledger: Gloss's searchable entries, inside Foundry. People and places that have been imported
 * show their picture, which can be dragged onto the tabletop, shown to the players, or posted to chat.
 */
export default class Ledger extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "cantica-ledger",
    classes: ["cantica", "ledger-window"],
    position: { width: 640, height: 780 },
    window: { title: "CANTICA.Ledger.Title", icon: "fa-solid fa-book-open", resizable: true },
    actions: { importLore: Ledger.#onImport }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/app/ledger.hbs`, scrollable: [".ledger-results"] }
  };

  #state = { q: "", kind: "all" };
  #open = new Set();
  #actors = new Map();

  async _prepareContext() {
    const imported = loreActors();
    const missing = loreEntries().filter(e => (e.kind === "people" || e.kind === "places") && !imported.has(e.id)).length;
    return {
      available: loreAvailable(),
      isGM: game.user.isGM,
      canImport: game.user.isGM && missing > 0,
      missing
    };
  }

  /** Open the Ledger on an entry (used by links and macros). */
  openEntry(id) {
    this.#state = { q: "", kind: "all" };
    this.#open.add(id);
    this._pendingScroll = id;
    return this.render({ force: true });
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    if (!loreAvailable()) return;
    this.#actors = loreActors();

    const root = this.element;
    const input = root.querySelector(".ledger-search input");
    input.value = this.#state.q;
    input.addEventListener("input", () => { this.#state.q = input.value; this.#renderList(); });
    input.addEventListener("keydown", ev => {
      if (ev.key === "Escape") { input.value = ""; this.#state.q = ""; this.#renderList(); }
    });

    // One delegated listener for everything inside the results.
    root.querySelector(".ledger-results").addEventListener("click", ev => this.#onClick(ev));
    root.querySelector(".ledger-results").addEventListener("dragstart", ev => this.#onDragStart(ev));
    this.#renderList();

    if (this._pendingScroll) {
      root.querySelector(`#lore-${this._pendingScroll}`)?.scrollIntoView({ block: "start" });
      this._pendingScroll = null;
    }
  }

  /* -------------------------------------------- */
  /*  The list                                    */
  /* -------------------------------------------- */

  #matches() {
    const kinds = loreKinds().map(k => k.id);
    return search(loreEntries(), this.#state.q, kinds);
  }

  #renderList() {
    const root = this.element;
    const kinds = loreKinds();
    const matches = this.#matches();
    const shown = matches.filter(e => this.#state.kind === "all" || e.kind === this.#state.kind);

    // Chips, with counts for the current search.
    const counts = Object.fromEntries(kinds.map(k => [k.id, 0]));
    matches.forEach(e => { counts[e.kind]++; });
    const chips = [{ id: "all", label: game.i18n.localize("CANTICA.Ledger.All") }, ...kinds].map(k => {
      const n = k.id === "all" ? matches.length : counts[k.id];
      return `<button type="button" class="chip ${this.#state.kind === k.id ? "on" : ""}" data-act="kind" data-kind="${k.id}">${escapeHtml(k.label)} <span class="n">${n}</span></button>`;
    });
    root.querySelector(".ledger-chips").innerHTML = chips.join("");
    root.querySelector(".ledger-chips").onclick = ev => {
      const btn = ev.target.closest("[data-act=kind]");
      if (btn) { this.#state.kind = btn.dataset.kind; this.#renderList(); }
    };

    const grouped = !norm(this.#state.q) && this.#state.kind === "all";
    let html = "";
    if (grouped) {
      for (const kind of kinds) {
        const group = shown.filter(e => e.kind === kind.id);
        if (group.length) html += `<h2 class="group-title">${escapeHtml(kind.label)} <span class="n">${group.length}</span></h2><ul>${group.map(e => this.#entryHtml(e)).join("")}</ul>`;
      }
    } else {
      html = `<ul>${shown.map(e => this.#entryHtml(e)).join("")}</ul>`;
    }
    root.querySelector(".ledger-results").innerHTML = html;
    root.querySelector(".ledger-empty").hidden = shown.length > 0;
    root.querySelector(".ledger-count").textContent = game.i18n.format("CANTICA.Ledger.Count", { n: shown.length, total: loreEntries().length });
  }

  #entryHtml(e) {
    const i18n = game.i18n;
    const kindLabel = loreKinds().find(k => k.id === e.kind)?.label ?? e.kind;
    const open = this.#open.has(e.id);
    const tag = e.tag && norm(e.tag) !== norm(kindLabel) ? `<span class="entry-tag">${escapeHtml(e.tag)}</span>` : "";

    let body = "";
    if (open) {
      const byId = loreById();
      const art = loreImage(e);
      const doc = this.#actors.get(e.id);
      const link = (id, label) => `<a class="xref" data-act="xref" data-id="${id}">${label}</a>`;
      const text = linkify(paragraphs(e.body), byId, link);

      // The picture: draggable when it has an actor or card to drag.
      const img = art
        ? `<img class="entry-img ${doc ? "draggable" : ""}" src="${art}" alt="${escapeHtml(e.name)}" ${doc ? `draggable="true" data-uuid="${doc.uuid}" title="${i18n.localize("CANTICA.Ledger.DragHint")}"` : ""}>`
        : "";

      const buttons = [
        `<button type="button" data-act="share" data-id="${e.id}"><i class="fa-solid fa-comment"></i> ${i18n.localize("CANTICA.Ledger.Share")}</button>`,
        game.user.isGM && art ? `<button type="button" data-act="show" data-id="${e.id}"><i class="fa-solid fa-image"></i> ${i18n.localize("CANTICA.Ledger.Show")}</button>` : "",
        game.user.isGM && doc ? `<button type="button" data-act="sheet" data-id="${e.id}"><i class="fa-solid fa-id-card"></i> ${i18n.localize("CANTICA.Ledger.OpenSheet")}</button>` : ""
      ].join("");

      const inquiries = e.inquiry == null ? [] : [].concat(e.inquiry);
      const full = inquiries.map(n => {
        const pad = String(n).padStart(2, "0");
        return `<a class="full" href="${CONCIERGE}#qa-${pad}" target="_blank" rel="noopener">${i18n.localize("CANTICA.Ledger.Full")} № ${pad} ↗</a>`;
      }).join("");

      body = `<div class="entry-body">${img}<div class="entry-text">${text}</div>
        <div class="entry-foot"><span class="entry-actions">${buttons}</span>${full}</div></div>`;
    }

    return `<li class="entry ${open ? "open" : ""}" id="lore-${e.id}">
      <button type="button" class="entry-head" data-act="toggle" data-id="${e.id}" aria-expanded="${open}">
        <span class="kind kind-${e.kind}">${escapeHtml(kindLabel)}</span>
        <span class="entry-main"><span class="entry-name">${escapeHtml(e.name)}</span>${tag}<span class="entry-summary">${escapeHtml(e.summary)}</span></span>
        <span class="chev">▸</span>
      </button>${body}</li>`;
  }

  /* -------------------------------------------- */
  /*  Clicks                                      */
  /* -------------------------------------------- */

  async #onClick(ev) {
    const target = ev.target.closest("[data-act]");
    if (!target) return;
    const { act, id } = target.dataset;
    const entry = loreById()[id];

    if (act === "toggle") {
      if (this.#open.has(id)) this.#open.delete(id); else this.#open.add(id);
      this.#renderList();
    } else if (act === "xref") {
      ev.preventDefault();
      this.#state = { q: "", kind: "all" };
      this.element.querySelector(".ledger-search input").value = "";
      this.#open.add(id);
      this.#renderList();
      this.element.querySelector(`#lore-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    } else if (act === "share" && entry) {
      await this.#share(entry);
    } else if (act === "show" && entry) {
      await this.#show(entry);
    } else if (act === "sheet") {
      this.#actors.get(id)?.sheet.render(true);
    }
  }

  /** Dragging a portrait out of the window carries the actor or card it was made into. */
  #onDragStart(ev) {
    const img = ev.target.closest("img[data-uuid]");
    if (!img) return;
    ev.dataTransfer.setData("text/plain", JSON.stringify({ type: "Actor", uuid: img.dataset.uuid }));
  }

  /** Post the entry to chat, in Gloss's voice. */
  async #share(entry) {
    const byId = loreById();
    const kindLabel = loreKinds().find(k => k.id === entry.kind)?.label ?? entry.kind;
    const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat/lore.hbs`, {
      name: entry.name,
      kind: kindLabel,
      tag: entry.tag && norm(entry.tag) !== norm(kindLabel) ? entry.tag : "",
      img: loreImage(entry),
      // Links inside the text become plain words: they can't be followed from chat.
      text: unlink(paragraphs(entry.body), byId)
    });
    const ChatMessage = CONFIG.ChatMessage.documentClass;
    await ChatMessage.create({ speaker: { alias: "Gloss" }, content });
  }

  /** GM: pop the picture up on every player's screen. */
  async #show(entry) {
    const { ImagePopout } = foundry.applications.apps;
    const popout = new ImagePopout({ src: loreImage(entry), window: { title: entry.name } });
    await popout.render({ force: true });
    popout.shareImage();
  }

  static async #onImport() {
    await importLore();
    this.render();
  }
}
