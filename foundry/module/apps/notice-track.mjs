import { SYSTEM_ID, SLOT_INFO } from "../config.mjs";
import { slotsFor, placeNotice, clearMinors as clearMinorSlots, emptySlot, isFilled, CHARACTER_TIER, NOTICE_TYPES } from "../notices.mjs";

const { DialogV2 } = foundry.applications.api;

/** The tier that decides which boxes an actor has: characters get the full track. */
export const tierOf = actor => (actor.type === "npc" ? actor.system.tier : CHARACTER_TIER);

/** Template context for the track partial: one entry per visible box. */
export function trackContext(actor) {
  const i18n = game.i18n;
  return slotsFor(tierOf(actor)).map(slot => {
    const data = actor.system.notices[slot];
    const { kind } = SLOT_INFO[slot];
    return {
      slot,
      kind,
      label: i18n.localize(`CANTICA.Track.${kind}`),
      status: i18n.localize(`CANTICA.Track.${kind}Status`),
      name: data.name,
      filled: isFilled(data),
      types: NOTICE_TYPES.map(value => ({ value, label: i18n.localize(`CANTICA.Track.type${value}`), selected: data.type === value }))
    };
  });
}

/* -------------------------------------------- */
/*  Sheet actions. `this` is the sheet.         */
/* -------------------------------------------- */

/** Land a Minor or Major Notice; overflow and being taken out are handled by the track rules. */
export async function takeNotice(event, target) {
  const i18n = game.i18n;
  const kind = target.dataset.kind;
  const notice = await DialogV2.prompt({
    window: { title: i18n.format("CANTICA.Track.TakeTitle", { kind: i18n.localize(`CANTICA.Track.${kind}`) }) },
    content: `<div class="form-group"><label>${i18n.localize("CANTICA.Track.NoticeName")}</label>
        <input type="text" name="name" autofocus></div>
      <div class="form-group"><label>${i18n.localize("CANTICA.Track.NoticeType")}</label>
        <select name="type">${NOTICE_TYPES.map(t => `<option value="${t}">${i18n.localize(`CANTICA.Track.type${t}`)}</option>`).join("")}</select></div>`,
    ok: {
      label: i18n.localize("CANTICA.Track.Take"),
      callback: (event, button) => ({
        name: button.form.elements.name.value.trim() || i18n.localize("CANTICA.Track.Unnamed"),
        type: button.form.elements.type.value
      })
    },
    rejectClose: false
  });
  if (!notice) return;

  const actor = this.actor;
  const result = placeNotice(actor.toObject().system.notices, tierOf(actor), kind, notice);
  await actor.update({ "system.notices": result.track });

  const { kind: landed } = SLOT_INFO[result.slot];
  const ChatMessage = CONFIG.ChatMessage.documentClass;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat/notice.hbs`, {
      actorName: actor.name,
      notice: notice.name,
      type: i18n.localize(`CANTICA.Track.type${notice.type}`),
      box: i18n.localize(`CANTICA.Track.${landed}`),
      status: i18n.localize(`CANTICA.Track.${landed}Status`),
      overflowed: result.overflowed,
      out: result.out
    })
  });
}

/** Clear one box: the Notice is resolved, or reclassified away. */
export async function clearNotice(event, target) {
  await this.actor.update({ [`system.notices.${target.dataset.slot}`]: emptySlot() });
}

/** End of session: clear all Minor Notices. */
export async function clearMinors() {
  await this.actor.update({ "system.notices": clearMinorSlots(this.actor.toObject().system.notices) });
}
