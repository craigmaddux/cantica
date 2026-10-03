import { SYSTEM_ID } from "./config.mjs";

/**
 * Wire up buttons on Cantica roll cards. Cards are static HTML saved with the
 * message, so the button's state is read from the message flags on every render.
 */
export function onRenderChatMessage(message, html) {
  const flags = message.flags?.[SYSTEM_ID];
  if (!flags) return;

  const button = html.querySelector('[data-action="claim-stamp"]');
  if (!button) return;

  const actor = game.actors.get(flags.actorId);
  if (flags.stampClaimed) {
    button.disabled = true;
    button.textContent = game.i18n.localize("CANTICA.Roll.StampClaimed");
  } else if (!actor?.isOwner) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async event => {
    event.preventDefault();
    if (!actor?.isOwner || message.flags[SYSTEM_ID]?.stampClaimed) return;
    // Mark the card first so a double click can't award two Stamps.
    await message.update({ [`flags.${SYSTEM_ID}.stampClaimed`]: true });
    await actor.adjustStamps(1);
  });
}
