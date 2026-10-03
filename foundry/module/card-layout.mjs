/**
 * The card on the tabletop, laid out. Pure: no Foundry, no canvas. Given the card's words and a way
 * to measure text, it returns a list of drawing commands, so the layout (wrapping, truncating,
 * "+3 more") is unit-tested in Node. card-art.mjs paints the commands onto a canvas.
 *
 * The card is the art cropped to the token's shape, a fade into a dark information plate over the
 * lower part, then the name, the place, and the Traits.
 */

export const COLOR = {
  void: "#050810", hull: "#0c1320", rule: "#2c3a55", ink: "#c8d4e6", bright: "#e8eef8", dim: "#5a6a86", warm: "#ffb340"
};

const SERIF = "Spectral, Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** Where the plate starts, as a share of the card's height. A short, wide card starts it higher. */
export const PLATE_START = 0.42;
export const plateStartFor = (w, h) => (h < w * 0.65 ? 0.28 : PLATE_START);

/** Split text into lines no wider than `maxWidth`, breaking at spaces. */
export function wrap(text, font, maxWidth, measure) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (!line || measure(attempt, font) <= maxWidth) line = attempt;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** At most `max` lines; if the text runs on, the last line ends in an ellipsis that still fits. */
export function clampLines(lines, max, font, maxWidth, measure) {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1];
  while (last.length > 1 && measure(`${last}…`, font) > maxWidth) last = last.slice(0, -1).trimEnd();
  kept[max - 1] = `${last}…`;
  return kept;
}

/**
 * @param {{name: string, description: string, traits: string[], width: number, height: number}} card
 * @param {(text: string, font: string) => number} measure  Width of text in the given CSS font.
 * @returns {{ops: object[], plateTop: number, shown: number, more: number}}
 */
export function layoutCard({ name, description, traits, width: w, height: h }, measure) {
  const ops = [];
  // Type scales with the card's smaller dimension, so a low, wide card doesn't get oversized text.
  const u = Math.min(w, h * 1.25);
  const pad = Math.max(8, Math.round(u * 0.04));
  const inner = w - pad * 2;
  const plateTop = Math.round(h * plateStartFor(w, h));
  const bottom = h - pad;
  const text = (t, x, y, font, fill, extra = {}) => ops.push({ t: "text", text: t, x, y, font, fill, ...extra });

  // The plate: a fade out of the art, the plate itself, and an amber rule along its top edge.
  ops.push({ t: "fade", y: plateTop - Math.round((h - plateTop) * 0.35), h: Math.round((h - plateTop) * 0.35) });
  ops.push({ t: "rect", x: 0, y: plateTop, w, h: h - plateTop, fill: "rgba(5, 8, 16, 0.9)" });
  ops.push({ t: "rect", x: 0, y: plateTop, w, h: 2, fill: COLOR.warm, alpha: 0.7 });

  let y = plateTop + Math.round(pad * 0.8);

  // Eyebrow.
  const eyebrowPx = Math.max(9, Math.round(u * 0.028));
  text("◆ SCENE", pad, y, `${eyebrowPx}px ${MONO}`, COLOR.dim, { spacing: 2 });
  y += Math.round(eyebrowPx * 1.5);

  // Name.
  const titlePx = Math.max(16, Math.round(u * 0.07));
  const titleFont = `${titlePx}px ${SERIF}`;
  for (const line of wrap(name || "—", titleFont, inner, measure)) {
    text(line, pad, y, titleFont, COLOR.bright);
    y += Math.round(titlePx * 1.2);
  }
  y += Math.round(pad * 0.35);

  // The place: at most two lines.
  if (description) {
    const px = Math.max(11, Math.round(u * 0.036));
    const font = `italic ${px}px ${SERIF}`;
    const lines = clampLines(wrap(description, font, inner, measure), 2, font, inner, measure);
    for (const line of lines) {
      text(line, pad, y, font, COLOR.ink);
      y += Math.round(px * 1.4);
    }
    y += Math.round(pad * 0.45);
  }

  // The Traits: as many as fit, and the rest counted.
  let shown = 0;
  if (traits.length) {
    const headerPx = Math.max(9, Math.round(u * 0.028));
    text("TRAITS", pad, y, `${headerPx}px ${MONO}`, COLOR.warm, { spacing: 3 });
    y += Math.round(headerPx * 1.6);

    const px = Math.max(11, Math.round(u * 0.04));
    const font = `${px}px ${SERIF}`;
    const rowH = Math.round(px * 1.35);
    for (let i = 0; i < traits.length; i++) {
      const lines = wrap(`◆ ${traits[i]}`, font, inner, measure);
      const needed = lines.length * rowH;
      const reserve = i < traits.length - 1 ? rowH : 0; // leave room for "+ N more"
      if (y + needed + reserve > bottom) break;
      for (const line of lines) { text(line, pad, y, font, COLOR.bright); y += rowH; }
      shown++;
    }
    if (shown < traits.length) {
      const morePx = Math.round(px * 0.85);
      text(`+ ${traits.length - shown} more`, pad, Math.min(y, bottom - morePx), `italic ${morePx}px ${SERIF}`, COLOR.dim);
    }
  }

  // Frame.
  for (const [x, yy, ww, hh] of [[0, 0, w, 2], [0, h - 2, w, 2], [0, 0, 2, h], [w - 2, 0, 2, h]]) {
    ops.push({ t: "rect", x, y: yy, w: ww, h: hh, fill: COLOR.rule });
  }

  return { ops, plateTop, shown, more: traits.length - shown };
}

/** A short stable hash of whatever makes the card look the way it does (FNV-1a, base 36). */
export function cardHash(value) {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

/** Pixels per grid square for the card's image, and the largest the image will be. */
export const PX_PER_SQUARE = 200;
export const MAX_PX = 1600;

/** The card image's size for a token's size in grid squares. */
export function imageSize(squaresWide, squaresHigh) {
  const w = squaresWide * PX_PER_SQUARE;
  const h = squaresHigh * PX_PER_SQUARE;
  // A big card is scaled down as a whole, so its shape is kept; only a tiny one is lifted to a minimum.
  const k = Math.min(1, MAX_PX / Math.max(w, h));
  const floor = n => Math.max(200, Math.round(n * k));
  return { width: floor(w), height: floor(h) };
}

/** Where a crop window sits so the art covers the whole card, a little above centre (focal 0.4). */
export function coverCrop(imageW, imageH, width, height, focalY = 0.4) {
  const scale = Math.max(width / imageW, height / imageH);
  const w = width / scale;
  const h = height / scale;
  return { sx: (imageW - w) / 2, sy: (imageH - h) * focalY, sw: w, sh: h };
}
