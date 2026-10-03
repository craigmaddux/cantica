/* Station Briefs: the orientation packets, built from station-briefs-data.js (window.STATION_BRIEFS).
 * The same file is bundled into the Foundry system for Register With Gloss. No build step. */
(function () {
  "use strict";

  var BRIEFS = window.STATION_BRIEFS || [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function list(items) {
    return "<ul>" + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }

  /** Skills the Brief rates, highest first, each with a pip for every point. */
  function skillChips(skills) {
    return Object.keys(skills)
      .filter(function (k) { return skills[k] > 0; })
      .sort(function (a, b) { return skills[b] - skills[a] || a.localeCompare(b); })
      .map(function (k) {
        var pips = "";
        for (var i = 0; i < skills[k]; i++) pips += '<i aria-hidden="true"></i>';
        return '<li class="skill-chip r' + skills[k] + '"><span class="n">' + esc(cap(k)) + '</span><span class="pips">' + pips + '</span><span class="sr-only"> ' + skills[k] + "</span></li>";
      }).join("");
  }

  function packet(b, i) {
    var no = (i + 1 < 10 ? "0" : "") + (i + 1);
    return '<article class="brief" id="' + esc(b.id) + '">' +
      '<header><span class="brief-no">Brief ' + no + "</span>" +
        '<h2><a class="anchor" href="#' + esc(b.id) + '" aria-label="Link to this Brief">#</a>' + esc(b.name) + "</h2>" +
        '<p class="greeting">“' + esc(b.greeting) + "”</p></header>" +
      '<p class="tagline"><strong>' + esc(b.tagline) + "</strong> " + esc(b.blurb) + "</p>" +
      '<div class="brief-grid">' +
        '<section><h3>Suggested skills</h3><ul class="skill-chips">' + skillChips(b.skills) + "</ul>" +
          '<p class="fine">Three at 2, three at 1: exactly the 15 starting Tenure.</p></section>' +
        "<section><h3>Sample Traits</h3>" + list(b.traits) + "</section>" +
        "<section><h3>Sample Hindrances</h3>" + list(b.hindrances) + "</section>" +
        "<section><h3>If you're Touched</h3>" +
          '<p class="gift"><strong>Gift</strong> ' + esc(b.gift) + '</p><p class="gift"><strong>Drawback</strong> ' + esc(b.drawback) + "</p></section>" +
      "</div>" +
      '<p class="shine"><span>You shine when</span> ' + esc(b.shine) + ".</p>" +
      '<div class="first-comm"><h3>A first Commendation <small>(Grade II)</small></h3>' +
        "<strong>" + esc(b.commendation.name) + "</strong>" +
        "<p>" + esc(b.commendation.situation) + ", " + esc(b.commendation.effect) + ".</p></div>" +
      "</article>";
  }

  document.getElementById("brief-nav").innerHTML = BRIEFS.map(function (b) {
    return '<a href="#' + esc(b.id) + '"><strong>' + esc(b.name) + "</strong><span>" + esc(b.tagline) + "</span></a>";
  }).join("");

  document.getElementById("briefs").innerHTML = BRIEFS.map(packet).join("");

  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
