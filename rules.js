/* The Rules of the Cantica: a readable rules book built from the Ledger's rules entries.
 * The ideas (Part I) are written by hand in rules.html. Everything else comes from window.LEDGER,
 * so the Ledger and this page can never disagree. No build step. */
(function () {
  "use strict";

  var ENTRIES = window.LEDGER;
  var byId = {};
  ENTRIES.forEach(function (e) { byId[e.id] = e; });

  /* The parts of the book, in order. Each lists the Ledger entries that make it up. */
  var PARTS = [
    { id: "part-roll", no: "Part II", title: "Rolling the dice",
      blurb: "Everything that happens between the GM describing a moment and you finding out how it went.",
      entries: ["rules-core", "rules-pool", "rules-gear", "rules-difficulty", "rules-margin", "rules-violet", "rules-odds"] },
    { id: "part-character", no: "Part III", title: "Your character",
      blurb: "Who you are is a few phrases and a few numbers. Gloss will walk you through making one.",
      entries: ["rules-creation", "rules-traits", "rules-hindrances", "rules-gift"] },
    { id: "part-skills", no: "Part IV", title: "The skills", skills: true,
      blurb: "Thirteen skills, each rated 0 to 2. A skill says what you are doing; a Trait says why you are good at it." },
    { id: "part-currencies", no: "Part V", title: "Stamps and Scrutiny",
      blurb: "Two small currencies, one for the players and one for the ship. Both are kept in the open.",
      entries: ["rules-stamps", "rules-scrutiny"] },
    { id: "part-conflict", no: "Part VI", title: "Conflict and harm",
      blurb: "A fight, a flirtation, a hearing before the Magistrate: they all use the same rules.",
      entries: ["rules-notices", "rules-recovery", "rules-acting", "rules-resisting", "rules-resist-skills", "rules-npcs", "rules-hazards"] },
    { id: "part-scenes", no: "Part VII", title: "Scenes",
      blurb: "The place you are in, and the different ways a scene can be played.",
      entries: ["rules-scene-cards", "rules-summary", "rules-dockets", "rules-record"] },
    { id: "part-growth", no: "Part VIII", title: "Growing",
      blurb: "How a resident becomes someone with seniority.",
      entries: ["rules-compline", "rules-grade", "rules-commendations"] }
  ];

  /* Which entries have a section on this page, so links to them stay on the page. */
  var onPage = {};
  PARTS.forEach(function (p) {
    (p.entries || []).forEach(function (id) { onPage[id] = true; });
  });
  ENTRIES.forEach(function (e) { if (e.id.indexOf("skill-") === 0) onPage[e.id] = true; });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /** [[id]] or [[id|label]]: a link within this page if the entry is here, otherwise into the Ledger. */
  function linkify(html) {
    return html.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
      var target = byId[id];
      if (!target) return esc(label || id);
      var text = label || esc(target.name);
      if (onPage[id]) return '<a class="xref" href="#' + id + '">' + text + "</a>";
      return '<a class="xref ledger-ref" href="ledger.html#' + id + '" title="In the Ledger">' + text + "</a>";
    });
  }

  function bodyHtml(e) {
    var html = "";
    (e.body || []).forEach(function (p) {
      html += linkify(p.charAt(0) === "<" ? p : "<p>" + p + "</p>");
    });
    return html;
  }

  function section(e) {
    return '<section class="rule" id="' + e.id + '">' +
      '<h3><a class="anchor" href="#' + e.id + '" aria-label="Link to this section">#</a>' + esc(e.name) + "</h3>" +
      '<p class="rule-summary">' + esc(e.summary) + "</p>" +
      '<div class="entry-text">' + bodyHtml(e) + "</div>" +
      '<p class="rule-foot"><a href="ledger.html#' + e.id + '">Look this up in the Ledger →</a></p>' +
      "</section>";
  }

  function skillsSection() {
    var groups = [];
    var seen = {};
    ENTRIES.filter(function (e) { return e.id.indexOf("skill-") === 0; }).forEach(function (e) {
      var group = (e.tag || "").replace(/^Skill\s*·\s*/, "");
      if (!seen[group]) { seen[group] = { name: group, skills: [] }; groups.push(seen[group]); }
      seen[group].skills.push(e);
    });
    return groups.map(function (g) {
      return '<div class="skill-group"><h4>' + esc(g.name) + "</h4><dl>" +
        g.skills.map(function (e) {
          return '<div class="skill" id="' + e.id + '"><dt>' + esc(e.name) + "</dt><dd>" + esc(e.summary) + "</dd></div>";
        }).join("") +
        "</dl></div>";
    }).join("");
  }

  function build() {
    var out = "";
    PARTS.forEach(function (p) {
      out += '<section class="part" id="' + p.id + '" data-title="' + esc(p.title) + '">' +
        '<header class="part-head"><span class="part-no">' + p.no + "</span><h2>" + esc(p.title) + "</h2>" +
        '<p class="part-blurb">' + esc(p.blurb) + "</p></header>";
      if (p.skills) {
        out += '<div class="skill-groups">' + skillsSection() + "</div>" +
          '<p class="rule-foot"><a href="ledger.html">Each skill has its own entry in the Ledger →</a></p>';
      } else {
        p.entries.forEach(function (id) {
          if (byId[id]) out += section(byId[id]);
          else if (window.console) console.warn("rules.js: no Ledger entry " + id);
        });
      }
      out += "</section>";
    });
    document.getElementById("built").innerHTML = out;
  }

  /* ── contents ── */

  function buildToc() {
    var list = document.getElementById("toc-list");
    var html = "";
    var parts = document.querySelectorAll(".part");
    Array.prototype.forEach.call(parts, function (part) {
      var sections = part.querySelectorAll(".rule");
      html += '<li class="toc-part"><a href="#' + part.id + '" data-target="' + part.id + '">' + esc(part.getAttribute("data-title")) + "</a>";
      if (sections.length) {
        html += "<ol>";
        Array.prototype.forEach.call(sections, function (s) {
          html += '<li><a href="#' + s.id + '" data-target="' + s.id + '">' + esc(s.querySelector("h3").textContent.replace(/^#/, "")) + "</a></li>";
        });
        html += "</ol>";
      }
      html += "</li>";
    });
    list.innerHTML = html;

    // On a narrow screen the contents start closed, and close again after a choice.
    var box = document.getElementById("toc-box");
    if (window.matchMedia("(max-width: 900px)").matches) box.removeAttribute("open");
    list.addEventListener("click", function (ev) {
      if (ev.target.tagName === "A" && window.matchMedia("(max-width: 900px)").matches) box.removeAttribute("open");
    });
  }

  /* Highlight the section being read. */
  function spy() {
    if (!("IntersectionObserver" in window)) return;
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll("#toc-list a"), function (a) { links[a.getAttribute("data-target")] = a; });
    var current = null;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var link = links[en.target.id];
        if (!link) return;
        if (current) current.classList.remove("current");
        link.classList.add("current");
        current = link;
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".part, .rule").forEach(function (el) { observer.observe(el); });
  }

  build();
  buildToc();
  spy();

  // Land on a deep link once the sections exist.
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
