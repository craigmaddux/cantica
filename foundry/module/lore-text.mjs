/**
 * Ledger text helpers: search ranking and turning entry bodies into plain text or linked HTML.
 * Pure functions with no Foundry dependency, unit-tested in Node against the real ledger data.
 *
 * Entry bodies are authored HTML. A string starting with "<" is inserted as-is; anything else
 * is wrapped in <p>. [[id]] or [[id|label]] links to another entry.
 */

const LINK = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function norm(s) {
  return String(s ?? "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Wrap bare paragraphs in <p>; leave authored blocks (tables, lists) alone. */
export const paragraphs = body => body.map(p => (p.charAt(0) === "<" ? p : `<p>${p}</p>`)).join("");

/** [[id|label]] -> a link to another entry. Unknown ids degrade to plain text. */
export function linkify(html, byId, makeLink) {
  return html.replace(LINK, (m, id, label) => {
    const target = byId[id];
    if (!target) return escapeHtml(label || id);
    return makeLink(id, label || escapeHtml(target.name));
  });
}

/** [[id|label]] -> just the label, for chat and notes. */
export function unlink(html, byId) {
  return html.replace(LINK, (m, id, label) => label || byId[id]?.name || id);
}

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ", "&mdash;": "—" };

/** HTML to readable plain text: paragraphs and list items on their own lines. */
export function toPlain(html, byId = {}) {
  return unlink(html, byId)
    .replace(/<\/(p|ul|ol|table|div|blockquote)>/gi, "\n\n")
    .replace(/<\/(li|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/t[dh]>/gi, " · ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, e => ENTITIES[e] ?? e)
    .replace(/ · \n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The whole entry as plain text: its summary, then its body. */
export function entryText(entry, byId = {}) {
  return [entry.summary, toPlain(paragraphs(entry.body), byId)].filter(Boolean).join("\n\n");
}

/* ── search ── */

/** Add normalized search fields to every entry (once). */
export function buildIndex(entries, byId = {}) {
  for (const e of entries) {
    e._name = norm(e.name);
    e._aka = (e.aka ?? []).map(norm);
    e._tag = norm(e.tag);
    e._summary = norm(e.summary);
    e._text = norm(toPlain(paragraphs(e.body), byId));
  }
  return entries;
}

function score(e, tokens) {
  let total = 0;
  for (const t of tokens) {
    let s = 0;
    if (e._name === t) s = 120;
    else if (e._name.startsWith(t)) s = 100;
    else if ((" " + e._name).includes(" " + t)) s = 80;
    else if (e._name.includes(t)) s = 60;
    if (!s && e._aka.some(a => a.includes(t))) s = 50;
    if (!s && e._tag.includes(t)) s = 25;
    if (!s && e._summary.includes(t)) s = 15;
    if (!s && e._text.includes(t)) s = 3;
    if (!s) return 0; // every word must match somewhere
    total += s;
  }
  return total;
}

/**
 * Entries matching a query, ranked. With no query: everything, grouped by kind then name.
 * @param {object[]} entries  Indexed with {@link buildIndex}.
 * @param {string[]} kindOrder  Kind ids in display order.
 */
export function search(entries, query, kindOrder) {
  const tokens = norm(query).split(" ").filter(Boolean);
  const rank = kind => kindOrder.indexOf(kind);
  return entries
    .map(e => ({ e, s: tokens.length ? score(e, tokens) : 1 }))
    .filter(x => x.s > 0)
    .sort((a, b) => {
      if (tokens.length && b.s !== a.s) return b.s - a.s;
      if (!tokens.length && rank(a.e.kind) !== rank(b.e.kind)) return rank(a.e.kind) - rank(b.e.kind);
      return a.e.name.localeCompare(b.e.name);
    })
    .map(x => x.e);
}
