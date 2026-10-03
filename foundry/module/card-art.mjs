import { SYSTEM_ID } from "./config.mjs";
import { layoutCard, cardHash, imageSize, coverCrop, COLOR } from "./card-layout.mjs";

/**
 * The card on the tabletop. The whole card (art cropped to the token's shape, the fade, the name, the
 * place, the Traits) is painted into one image, saved in the world's folder, and used as the token's
 * picture. Foundry then treats it like any token art: trimmed to the token, and underneath the
 * characters standing on it.
 *
 * Only one GM's client does the painting, whenever a card token is dropped, resized, or its card is
 * edited. If painting or saving fails, the token simply keeps showing the plain art.
 */

const FOLDER = "cantica-cards";
let warned = false;

/** Placeholder pictures that mean "no art set yet". */
const hasArt = img => Boolean(img) && !/(mystery-man|emblem)\.svg$/.test(img);

const isCard = token => token?.actor?.type === "card";
const isPainter = () => game.user.isActiveGM;

function warn(error) {
  console.warn(`${SYSTEM_ID} | could not paint a card for the tabletop`, error);
  if (warned) return;
  warned = true;
  ui.notifications.warn(game.i18n.localize("CANTICA.Card.PaintFailed"));
}

/* -------------------------------------------- */
/*  Painting                                    */
/* -------------------------------------------- */

async function loadImage(src) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  return image;
}

/** Paint the card onto a new canvas. */
export async function renderCardImage({ name, description, traits, art }, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // The card's fonts, so the text is drawn in them and not in a fallback.
  await Promise.all(["20px Spectral", "italic 20px Spectral", "12px 'JetBrains Mono'"].map(font => document.fonts.load(font))).catch(() => {});

  ctx.fillStyle = COLOR.hull;
  ctx.fillRect(0, 0, width, height);

  if (art) {
    try {
      const image = await loadImage(art);
      const { sx, sy, sw, sh } = coverCrop(image.naturalWidth, image.naturalHeight, width, height);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
    } catch (error) { console.warn(`${SYSTEM_ID} | the card's art could not be loaded`, error); }
  }

  const measure = (text, font) => { ctx.font = font; return ctx.measureText(text).width; };
  const { ops } = layoutCard({ name, description, traits, width, height }, measure);

  ctx.textBaseline = "top";
  for (const op of ops) {
    if (op.t === "fade") {
      const fade = ctx.createLinearGradient(0, op.y, 0, op.y + op.h);
      fade.addColorStop(0, "rgba(5, 8, 16, 0)");
      fade.addColorStop(1, "rgba(5, 8, 16, 0.55)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, op.y, width, op.h);
    } else if (op.t === "rect") {
      ctx.globalAlpha = op.alpha ?? 1;
      ctx.fillStyle = op.fill;
      ctx.fillRect(op.x, op.y, op.w, op.h);
      ctx.globalAlpha = 1;
    } else if (op.t === "text") {
      ctx.font = op.font;
      ctx.fillStyle = op.fill;
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${op.spacing ?? 0}px`;
      ctx.fillText(op.text, op.x, op.y);
    }
  }
  return canvas;
}

/** Save the painted card in the world's folder. @returns {Promise<string>} its path */
async function upload(canvas, filename) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.92));
  if (!blob) throw new Error("the card could not be encoded as an image");

  const FilePicker = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  const directory = `worlds/${game.world.id}/${FOLDER}`;
  try { await FilePicker.createDirectory("data", directory); } catch { /* it already exists */ }

  const file = new File([blob], `${filename}.webp`, { type: "image/webp" });
  const response = await FilePicker.upload("data", directory, file, {}, { notify: false });
  return response?.path ?? `${directory}/${file.name}`;
}

/** Paint a card token's picture, unless it already shows the card as it now is. */
export async function paintToken(token, { force = false } = {}) {
  try {
    const actor = token.actor;
    if (actor?.type !== "card") return;

    const { width, height } = imageSize(token.width, token.height);
    const data = {
      name: actor.name,
      description: actor.system.description,
      traits: actor.system.traits.map(trait => trait.name).filter(Boolean),
      art: hasArt(actor.img) ? actor.img : null
    };
    const hash = cardHash([data, width, height]);
    if (!force && token.getFlag(SYSTEM_ID, "painted") === hash) return;

    const canvas = await renderCardImage(data, width, height);
    const path = await upload(canvas, `${actor.id}-${width}x${height}-${hash}`);
    await token.update({ "texture.src": path, "texture.fit": "fill", [`flags.${SYSTEM_ID}.painted`]: hash });
  } catch (error) { warn(error); }
}

/* -------------------------------------------- */
/*  When to paint                               */
/* -------------------------------------------- */

const timers = new Map();

/** Paint soon, once edits have settled. */
function queue(token, delay = 1200) {
  if (!isPainter()) return;
  clearTimeout(timers.get(token.uuid));
  timers.set(token.uuid, setTimeout(() => { timers.delete(token.uuid); paintToken(token); }, delay));
}

/** Every token of a card, on every scene. */
const tokensOf = actor => game.scenes.flatMap(scene => scene.tokens.filter(token => token.actorId === actor.id));

/** Repaint every card token in the scene being viewed. */
export function repaintCards({ force = true } = {}) {
  if (!isPainter() || !canvas?.scene) return;
  for (const token of canvas.scene.tokens) if (isCard(token)) paintToken(token, { force });
}

export function registerCardArt() {
  // New card tokens: fitted to the token, drawn beneath characters, with no name label (it's on the card).
  Hooks.on("preCreateToken", token => {
    if (!isCard(token)) return;
    token.updateSource({
      "texture.src": token.actor.img,
      "texture.fit": "fill",
      sort: -1000,
      displayName: CONST.TOKEN_DISPLAY_MODES.NONE
    });
  });

  Hooks.on("createToken", token => { if (isCard(token)) queue(token, 200); });

  // The card is a different shape now.
  Hooks.on("updateToken", (token, changes) => {
    if (isCard(token) && ("width" in changes || "height" in changes)) queue(token);
  });

  // The card's words or art changed: repaint wherever it sits.
  Hooks.on("updateActor", (actor, changes) => {
    if (actor.type !== "card") return;
    const system = changes.system ?? {};
    if (!("name" in changes || "img" in changes || "description" in system || "traits" in system)) return;
    for (const token of tokensOf(actor)) queue(token);
  });

  // Cards placed before this existed, or while no GM was around, are painted when the scene opens.
  Hooks.on("canvasReady", () => {
    if (!isPainter()) return;
    for (const token of canvas.scene?.tokens ?? []) if (isCard(token)) queue(token, 500);
  });
}
