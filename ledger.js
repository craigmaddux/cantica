/* The Ledger of Cantica: search, filter, expand, deep links.
 * Data lives in ledger-data.js (window.LEDGER, window.LEDGER_KINDS). No build step. */
(function () {
  "use strict";

  var KINDS = window.LEDGER_KINDS;
  var ENTRIES = window.LEDGER;
  var KIND_LABEL = {};
  var KIND_ORDER = {};
  KINDS.forEach(function (k, i) { KIND_LABEL[k.id] = k.label; KIND_ORDER[k.id] = i; });

  var byId = {};
  ENTRIES.forEach(function (e) { byId[e.id] = e; });

  var state = { q: "", kind: "all" };
  var open = {};        // id -> true
  var nodes = {};       // id -> <li>
  var built = {};       // id -> true once the body has been built

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    q: $("q"), chips: $("chips"), count: $("count"), results: $("results"),
    empty: $("empty"), rulesNote: $("rules-note"), header: $("terminal-header")
  };

  /* ── text helpers ── */

  function norm(s) {
    return String(s || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /** [[id]] or [[id|label]] -> link to another entry. Unknown ids degrade to plain text. */
  function linkify(html) {
    return html.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
      var target = byId[id];
      if (!target) return esc(label || id);
      return '<a class="xref" href="#' + id + '" data-id="' + id + '">' + (label || esc(target.name)) + "</a>";
    });
  }

  function plain(html) {
    return html.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
      return label || (byId[id] ? byId[id].name : id);
    }).replace(/<[^>]+>/g, " ");
  }

  /* ── search index ── */

  ENTRIES.forEach(function (e) {
    e._name = norm(e.name);
    e._aka = (e.aka || []).map(norm);
    e._tag = norm(e.tag);
    e._summary = norm(e.summary);
    e._text = norm(plain((e.body || []).join(" ")));
  });

  function score(e, tokens) {
    var total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i], s = 0;
      if (e._name === t) s = 120;
      else if (e._name.indexOf(t) === 0) s = 100;
      else if ((" " + e._name).indexOf(" " + t) !== -1) s = 80;
      else if (e._name.indexOf(t) !== -1) s = 60;
      if (!s) {
        for (var a = 0; a < e._aka.length; a++) { if (e._aka[a].indexOf(t) !== -1) { s = 50; break; } }
      }
      if (!s && e._tag.indexOf(t) !== -1) s = 25;
      if (!s && e._summary.indexOf(t) !== -1) s = 15;
      if (!s && e._text.indexOf(t) !== -1) s = 3;
      if (!s) return 0;           // every word must match somewhere
      total += s;
    }
    return total;
  }

  /** Entries matching the query (any kind), ranked. With no query: everything, by kind then name. */
  function search() {
    var tokens = norm(state.q).split(" ").filter(Boolean);
    var list = ENTRIES.map(function (e) { return { e: e, s: tokens.length ? score(e, tokens) : 1 }; })
      .filter(function (x) { return x.s > 0; });
    list.sort(function (a, b) {
      if (tokens.length && b.s !== a.s) return b.s - a.s;
      if (!tokens.length && KIND_ORDER[a.e.kind] !== KIND_ORDER[b.e.kind]) return KIND_ORDER[a.e.kind] - KIND_ORDER[b.e.kind];
      return a.e.name.localeCompare(b.e.name);
    });
    return list.map(function (x) { return x.e; });
  }

  /* ── building DOM ── */

  function buildEntry(e) {
    var li = document.createElement("li");
    li.className = "entry";
    li.id = "e-" + e.id;
    li.dataset.kind = e.kind;

    var head = document.createElement("button");
    head.type = "button";
    head.className = "entry-head";
    head.setAttribute("aria-expanded", "false");
    head.setAttribute("aria-controls", "b-" + e.id);
    head.innerHTML =
      '<span class="kind kind-' + e.kind + '">' + esc(KIND_LABEL[e.kind]) + "</span>" +
      '<span class="entry-main">' +
        '<span class="entry-name">' + esc(e.name) + "</span>" +
        (e.tag && norm(e.tag) !== norm(KIND_LABEL[e.kind]) ? '<span class="entry-tag">' + esc(e.tag) + "</span>" : "") +
        '<span class="entry-summary">' + esc(e.summary) + "</span>" +
      "</span>" +
      '<span class="chev" aria-hidden="true">▸</span>';
    head.addEventListener("click", function () { toggle(e.id); });

    var body = document.createElement("div");
    body.className = "entry-body";
    body.id = "b-" + e.id;
    body.hidden = true;

    li.appendChild(head);
    li.appendChild(body);
    nodes[e.id] = li;
    return li;
  }

  /** Bodies are built on first open, so portraits are only fetched when someone asks for them. */
  function fillBody(e) {
    if (built[e.id]) return;
    built[e.id] = true;
    var body = nodes[e.id].querySelector(".entry-body");
    var html = "";
    if (e.img) html += '<img class="entry-img" src="' + e.img + '" alt="' + esc(e.name) + '" loading="lazy">';
    html += '<div class="entry-text">';
    (e.body || []).forEach(function (p) {
      html += linkify(p.charAt(0) === "<" ? p : "<p>" + p + "</p>");
    });
    html += "</div>";

    var foot = "";
    var inq = e.inquiry == null ? [] : [].concat(e.inquiry);
    inq.forEach(function (n) {
      var pad = (n < 10 ? "0" : "") + n;
      foot += '<a class="full" href="index.html#qa-' + pad + '">Gloss’s full answer: Inquiry № ' + pad + " →</a>";
    });
    foot += '<a class="permalink" href="#' + e.id + '" title="Link to this entry">#</a>';
    html += '<div class="entry-foot">' + foot + "</div>";
    body.innerHTML = html;
  }

  function setOpen(id, value) {
    var li = nodes[id];
    if (!li) return;
    if (value) { fillBody(byId[id]); open[id] = true; } else { delete open[id]; }
    li.classList.toggle("open", !!value);
    li.querySelector(".entry-head").setAttribute("aria-expanded", value ? "true" : "false");
    li.querySelector(".entry-body").hidden = !value;
  }

  function toggle(id) { setOpen(id, !open[id]); }

  /* ── rendering ── */

  function render() {
    var matches = search();
    var inKind = function (e) { return state.kind === "all" || e.kind === state.kind; };
    var shown = matches.filter(inKind);

    // chips with counts for the current query
    var counts = { all: matches.length };
    KINDS.forEach(function (k) { counts[k.id] = 0; });
    matches.forEach(function (e) { counts[e.kind]++; });
    els.chips.innerHTML = "";
    [{ id: "all", label: "All" }].concat(KINDS).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.kind === k.id ? " on" : "");
      b.setAttribute("aria-pressed", state.kind === k.id ? "true" : "false");
      b.innerHTML = esc(k.label) + ' <span class="n">' + counts[k.id] + "</span>";
      b.addEventListener("click", function () { state.kind = k.id; render(); });
      els.chips.appendChild(b);
    });

    els.results.innerHTML = "";
    var grouped = !norm(state.q) && state.kind === "all";
    if (grouped) {
      KINDS.forEach(function (k) {
        var group = shown.filter(function (e) { return e.kind === k.id; });
        if (!group.length) return;
        var section = document.createElement("section");
        section.className = "group";
        section.innerHTML = '<h2><span class="kind-' + k.id + '">◆</span> ' + esc(k.label) + ' <span class="n">' + group.length + "</span></h2>";
        var ul = document.createElement("ul");
        group.forEach(function (e) { ul.appendChild(nodes[e.id] || buildEntry(e)); });
        section.appendChild(ul);
        els.results.appendChild(section);
      });
    } else {
      var ul = document.createElement("ul");
      ul.className = "flat";
      shown.forEach(function (e) { ul.appendChild(nodes[e.id] || buildEntry(e)); });
      els.results.appendChild(ul);
    }

    els.empty.hidden = shown.length > 0;
    els.rulesNote.hidden = state.kind !== "rules";
    els.count.textContent = shown.length === ENTRIES.length
      ? ENTRIES.length + " entries"
      : shown.length + " of " + ENTRIES.length + " entries";
  }

  /* ── navigation ── */

  /** Open an entry from a link or the URL, clearing any filter that would hide it. */
  function openEntry(id, scroll, instant) {
    var e = byId[id];
    if (!e) return false;
    var hiddenNow = state.kind !== "all" && state.kind !== e.kind;
    var inResults = search().indexOf(e) !== -1;
    if (hiddenNow || !inResults) { state.kind = "all"; state.q = ""; els.q.value = ""; }
    render();
    setOpen(id, true);
    if (scroll !== false) {
      nodes[id].scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
    }
    return true;
  }

  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.xref");
    if (!a) return;
    ev.preventDefault();
    history.pushState(null, "", "#" + a.dataset.id);
    openEntry(a.dataset.id);
  });

  window.addEventListener("hashchange", function () {
    var id = location.hash.slice(1);
    if (byId[id]) openEntry(id);
  });

  /* ── search box ── */

  els.q.addEventListener("input", function () {
    state.q = els.q.value;
    render();
  });

  els.q.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      els.q.value = ""; state.q = ""; render(); els.q.blur();
    } else if (ev.key === "Enter") {
      var first = search().filter(function (e) { return state.kind === "all" || e.kind === state.kind; })[0];
      if (first) { setOpen(first.id, true); nodes[first.id].scrollIntoView({ behavior: "smooth", block: "center" }); }
    }
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var t = ev.target;
    if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
    ev.preventDefault();
    els.q.focus();
    els.q.select();
  });

  /* ── start ── */

  function syncHeaderHeight() {
    document.documentElement.style.setProperty("--hdr", Math.ceil(els.header.getBoundingClientRect().height) - 1 + "px");
  }
  // The header's height changes once web fonts load, so watch it rather than measuring once.
  if (window.ResizeObserver) new ResizeObserver(syncHeaderHeight).observe(els.header);
  else window.addEventListener("resize", syncHeaderHeight);
  syncHeaderHeight();

  var params = new URLSearchParams(location.search);
  if (params.get("q")) { state.q = params.get("q"); els.q.value = state.q; }
  var startKind = params.get("kind");
  if (startKind && KIND_LABEL[startKind]) state.kind = startKind;

  render();
  // Deep links (ledger.html#chorus): open now, then scroll once layout and fonts have settled.
  var startId = location.hash.slice(1);
  if (byId[startId]) {
    openEntry(startId, false);
    var jump = function () { nodes[startId].scrollIntoView({ behavior: "auto", block: "start" }); };
    if (document.readyState === "complete") jump(); else window.addEventListener("load", jump);
  }
})();
