/**
 * The Hum (spec v0.8): the GM's measure of how much the Bound are stirring. It is never shown to
 * players, who feel it only through the world. Pure functions with no Foundry dependency, so the
 * same logic is unit-tested in Node (see test/hum.test.mjs).
 *
 * Each Dissonance adds 1 (a greater Bound Dissonance adds 2). It only builds; story can lower it,
 * but seldom. At 20 something gives: a campaign event, after which the Hum resets to 0.
 */

export const HUM_MAX = 20;

/** The bands, lowest first. `max` is inclusive; Something gives is the single value 20. */
export const HUM_BANDS = [
  { key: "still", min: 0, max: 4 },
  { key: "murmur", min: 5, max: 9 },
  { key: "refrain", min: 10, max: 14 },
  { key: "swell", min: 15, max: 19 },
  { key: "gives", min: 20, max: 20 }
];

const clamp = value => Math.min(HUM_MAX, Math.max(0, Math.trunc(Number(value) || 0)));

/** The band a Hum value falls in. */
export function bandFor(value) {
  const hum = clamp(value);
  return HUM_BANDS.find(band => hum >= band.min && hum <= band.max);
}

/** From the Refrain up, every violet die causes Dissonance on 1-2, for everyone at the table. */
export const widensDissonance = value => clamp(value) >= 10;

/**
 * The Hum a roll adds: 1 per Dissonance, 2 per Dissonance when the roll was made under greater Bound.
 * @param {number} dissonance  Dissonance on the roll (after any Commendation).
 * @param {boolean} [greaterBound]
 */
export function humFromRoll(dissonance, greaterBound = false) {
  return Math.max(0, Math.trunc(Number(dissonance) || 0)) * (greaterBound ? 2 : 1);
}

/**
 * Change the Hum and report what crossed. The Hum is kept between 0 and 20.
 * @returns {{value: number, before: number, band: string, crossed: string|null, gives: boolean}}
 *   `crossed` is the key of a new, higher band if the change entered one; `gives` is true when the
 *   change reached 20 (the event is the GM's to write, and the GM then resets the Hum).
 */
export function changeHum(current, delta) {
  const before = clamp(current);
  const value = clamp(before + (Number(delta) || 0));
  const from = bandFor(before);
  const to = bandFor(value);
  return {
    value,
    before,
    band: to.key,
    crossed: HUM_BANDS.indexOf(to) > HUM_BANDS.indexOf(from) ? to.key : null,
    gives: value === HUM_MAX && before < HUM_MAX
  };
}
