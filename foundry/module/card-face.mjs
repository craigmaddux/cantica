import { SYSTEM_ID } from "./config.mjs";

/**
 * The card on the tabletop (A). A Scene Card's token is drawn like the card sheet: its art, with an
 * information plate over the lower part carrying the name, the place, and its Traits, so everyone at
 * the table can read it without opening anything. Double-click still opens the sheet.
 *
 * This is canvas drawing and is deliberately defensive: if anything here fails, the token simply
 * stays a plain picture and a single warning is logged.
 */

const FACE = Symbol("cantica.cardFace");
let warned = false;

const COLOR = { void: 0x050810, hull: 0x0c1320, rule: 0x2c3a55, ink: 0xc8d4e6, bright: 0xe8eef8, dim: 0x5a6a86, warm: 0xffb340 };
const css = n => `#${n.toString(16).padStart(6, "0")}`;

export function registerCardFaces() {
  Hooks.on("drawToken", token => draw(token));
  Hooks.on("refreshToken", token => draw(token));
  Hooks.on("updateActor", actor => {
    if (actor.type !== "card") return;
    for (const token of actor.getActiveTokens()) draw(token, true);
  });

  // A card token's size follows its art, so a wide picture makes a wide card.
  Hooks.on("createToken", async (document, options, userId) => {
    if (userId !== game.user.id || document.actor?.type !== "card") return;
    try {
      const size = await sizeFor(document.actor.img);
      if (size) await document.update(size);
    } catch (error) { warn(error); }
  });

  // New tokens wear the card's art, fitted exactly to the (art-shaped) token, and sit beneath characters.
  Hooks.on("preCreateToken", token => {
    if (token.actor?.type !== "card") return;
    token.updateSource({ "texture.src": token.actor.img, "texture.fit": "fill", sort: -1000, displayName: CONST.TOKEN_DISPLAY_MODES.NONE });
  });
}

/** Four grid squares wide; as tall as the art's proportions make it (at least two squares). */
async function sizeFor(src) {
  const load = foundry.canvas?.loadTexture ?? globalThis.loadTexture;
  if (!load || !src) return null;
  const texture = await load(src);
  if (!texture?.width || !texture?.height) return null;
  const width = 4;
  const height = Math.max(2, Math.round(width * (texture.height / texture.width) * 2) / 2);
  return { width, height };
}

function warn(error) {
  if (warned) return;
  warned = true;
  console.warn(`${SYSTEM_ID} | the card face could not be drawn; the token stays a plain picture.`, error);
}

/** Make sure a card token carries an up-to-date face. */
function draw(token, force = false) {
  try {
    const actor = token.actor;
    if (actor?.type !== "card") return;

    const data = {
      name: actor.name,
      description: actor.system.description,
      traits: actor.system.traits.map(trait => trait.name).filter(Boolean),
      w: token.w,
      h: token.h
    };
    const key = JSON.stringify(data);

    let face = token[FACE];
    if (!face || face.destroyed) {
      face = token[FACE] = new PIXI.Container();
      face.eventMode = "none";
      token.addChild(face);
      face.cacheKey = "";
    }
    if (force || face.cacheKey !== key) {
      face.cacheKey = key;
      buildFace(face, data);
    }
  } catch (error) { warn(error); }
}

/** A solid rectangle, drawn with a tinted white texture so it works on any PIXI version. */
function rect(x, y, w, h, color, alpha = 1) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
  sprite.position.set(x, y);
  sprite.width = w;
  sprite.height = h;
  sprite.tint = color;
  sprite.alpha = alpha;
  return sprite;
}

function text(string, style) {
  const label = new PIXI.Text(string, { fontFamily: "Spectral, Georgia, serif", fill: css(COLOR.ink), ...style });
  label.resolution = 2;
  return label;
}

/** Draw the information plate: a fade over the art, then the name, the place, and the Traits. */
export function buildFace(face, { name, description, traits, w, h }) {
  for (const child of face.removeChildren()) child.destroy({ children: true });

  const pad = Math.max(8, Math.round(w * 0.04));
  const plateTop = Math.round(h * 0.42);
  const plateH = h - plateTop;

  // A fade from the art into the plate, then the plate itself.
  const fadeH = Math.round(plateH * 0.35);
  for (let i = 0; i < 8; i++) {
    face.addChild(rect(0, plateTop - fadeH + (fadeH / 8) * i, w, fadeH / 8 + 1, COLOR.void, (i + 1) / 8 * 0.55));
  }
  face.addChild(rect(0, plateTop, w, plateH, COLOR.void, 0.9));
  face.addChild(rect(0, plateTop, w, 2, COLOR.warm, 0.7));

  // Frame.
  face.addChild(rect(0, 0, w, 2, COLOR.rule));
  face.addChild(rect(0, h - 2, w, 2, COLOR.rule));
  face.addChild(rect(0, 0, 2, h, COLOR.rule));
  face.addChild(rect(w - 2, 0, 2, h, COLOR.rule));

  const inner = w - pad * 2;
  const bottom = h - pad;
  let y = plateTop + pad * 0.8;

  // Eyebrow and name.
  const eyebrow = text("◆ SCENE", { fontFamily: "JetBrains Mono, monospace", fontSize: Math.max(9, w * 0.028), fill: css(COLOR.dim), letterSpacing: 2 });
  eyebrow.position.set(pad, y);
  face.addChild(eyebrow);
  y += eyebrow.height + 2;

  const title = text(name, { fontSize: Math.max(16, w * 0.07), fill: css(COLOR.bright), wordWrap: true, wordWrapWidth: inner });
  title.position.set(pad, y);
  face.addChild(title);
  y += title.height + pad * 0.35;

  // The place, kept to what fits in about two lines.
  if (description) {
    const size = Math.max(11, w * 0.036);
    let line = description;
    let place = text(line, { fontSize: size, fontStyle: "italic", fill: css(COLOR.ink), wordWrap: true, wordWrapWidth: inner });
    const maxH = size * 1.45 * 2;
    while (place.height > maxH && line.length > 8) {
      line = line.slice(0, Math.floor(line.length * 0.85)).trimEnd();
      place.destroy();
      place = text(`${line}…`, { fontSize: size, fontStyle: "italic", fill: css(COLOR.ink), wordWrap: true, wordWrapWidth: inner });
    }
    place.position.set(pad, y);
    face.addChild(place);
    y += place.height + pad * 0.45;
  }

  // The Traits, as many as fit; the rest are counted.
  if (traits.length) {
    const size = Math.max(11, w * 0.04);
    const header = text("TRAITS", { fontFamily: "JetBrains Mono, monospace", fontSize: Math.max(9, w * 0.028), fill: css(COLOR.warm), letterSpacing: 3 });
    header.position.set(pad, y);
    face.addChild(header);
    y += header.height + 3;

    let shown = 0;
    for (const trait of traits) {
      const row = text(`◆ ${trait}`, { fontSize: size, fill: css(COLOR.bright), wordWrap: true, wordWrapWidth: inner });
      const remaining = traits.length - shown - 1;
      const reserve = remaining > 0 ? size * 1.5 : 0;
      if (y + row.height + reserve > bottom) { row.destroy(); break; }
      row.position.set(pad, y);
      face.addChild(row);
      y += row.height + 2;
      shown++;
    }
    if (shown < traits.length) {
      const more = text(`+ ${traits.length - shown} more`, { fontSize: size * 0.85, fontStyle: "italic", fill: css(COLOR.dim) });
      more.position.set(pad, Math.min(y, bottom - more.height));
      face.addChild(more);
    }
  }
}
