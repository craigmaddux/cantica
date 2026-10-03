/**
 * Copies the website's ledger data and the art its entries use into foundry/lore/, so the
 * system zip carries them. The website's ledger-data.js stays the single source of truth.
 *
 * Run from anywhere:  node foundry/scripts/bundle-lore.mjs   (the release workflow does this)
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = path.join(root, "foundry", "lore");

const source = path.join(root, "ledger-data.js");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(source, "utf8"), ctx);
const entries = ctx.window.LEDGER ?? [];
if (!entries.length) throw new Error("ledger-data.js has no entries");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "assets"), { recursive: true });
fs.copyFileSync(source, path.join(out, "ledger-data.js"));

// The Station Briefs (the website's station-briefs-data.js), for Register With Gloss.
const briefsSource = path.join(root, "station-briefs-data.js");
const briefsCtx = { window: {} };
vm.createContext(briefsCtx);
vm.runInContext(fs.readFileSync(briefsSource, "utf8"), briefsCtx);
if (!(briefsCtx.window.STATION_BRIEFS ?? []).length) throw new Error("station-briefs-data.js has no Briefs");
fs.copyFileSync(briefsSource, path.join(out, "station-briefs-data.js"));

const missing = [];
const copied = new Set();
for (const entry of entries) {
  if (!entry.img) continue;
  const from = path.join(root, entry.img);
  const name = path.basename(entry.img);
  if (!fs.existsSync(from)) { missing.push(`${entry.id}: ${entry.img}`); continue; }
  if (!copied.has(name)) { fs.copyFileSync(from, path.join(out, "assets", name)); copied.add(name); }
}
if (missing.length) throw new Error("Missing art:\n  " + missing.join("\n  "));

console.log(`lore bundled: ${entries.length} entries, ${briefsCtx.window.STATION_BRIEFS.length} Station Briefs, ${copied.size} images -> foundry/lore/`);
