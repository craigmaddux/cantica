import { COLORSETS } from "./roll.mjs";

/**
 * Register the three Cantica dice colors with Dice So Nice (if installed):
 * white for ordinary dice, amber for the Margin, violet for the Bound.
 */
export function registerDiceColors(dice3d) {
  const common = { category: "Cantica", material: "plastic", font: "Arial", visibility: "visible" };

  dice3d.addColorset({
    ...common,
    name: COLORSETS.white,
    description: "Cantica: White",
    foreground: "#0c1320",
    background: "#e8eef8",
    outline: "#94a3bc",
    edge: "#c8d4e6"
  }, "default");

  dice3d.addColorset({
    ...common,
    name: COLORSETS.margin,
    description: "Cantica: The Margin",
    foreground: "#050810",
    background: "#ffb340",
    outline: "#c47820",
    edge: "#ffd07a"
  }, "default");

  dice3d.addColorset({
    ...common,
    name: COLORSETS.violet,
    description: "Cantica: The Bound",
    foreground: "#e8eef8",
    background: "#7a4ca0",
    outline: "#b07ad4",
    edge: "#4dd4e8"
  }, "default");
}
