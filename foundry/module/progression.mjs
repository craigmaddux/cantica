/**
 * Advancement (spec v0.5): Tenure, Grade, and what each Grade unlocks.
 * Pure functions with no Foundry dependency, unit-tested in Node.
 *
 * Grade is set by lifetime Tenure *earned* (never by what is spent): every 6 Tenure
 * earns the next Grade, to a maximum of X.
 */

export const TENURE_PER_GRADE = 6;
export const MAX_GRADE = 10;
export const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const gradeFor = earned => Math.min(MAX_GRADE, 1 + Math.floor(Math.max(0, Number(earned) || 0) / TENURE_PER_GRADE));

/** The Margin's success threshold improves with Grade. Its 1 (Error) and 10 (Grace) never change. */
export function marginTarget(grade) {
  if (grade >= 10) return 4;
  if (grade >= 7) return 5;
  if (grade >= 4) return 6;
  return 7;
}

/** Stamps at the start of each session: 2 at Grade I, +1 at Grades III, VI and IX. */
export const stampsPerSession = grade => 2 + [3, 6, 9].filter(g => grade >= g).length;

/** Commendation slots: 1 at Grade II, 2 at Grade V, 3 at Grade VIII. */
export const commendationSlots = grade => [2, 5, 8].filter(g => grade >= g).length;

/* ── Skills ── */

export const CREATION_BUDGET = 12;
export const CREATION_MAX = 2;
export const RATING_3_GRADE = 3;

/** Total Tenure spent to reach a rating from 0: 0→1 costs 1, 1→2 costs 2, 2→3 costs 6. */
export const skillCost = rating => (rating >= 1 ? 1 : 0) + (rating >= 2 ? 2 : 0) + (rating >= 3 ? 6 : 0);

/** What a whole set of skill ratings cost: used for the creation budget. */
export const skillsCost = ratings => Object.values(ratings).reduce((sum, rating) => sum + skillCost(rating), 0);

/**
 * May a skill go from one rating to another, and what does it cost?
 * @param {object} o
 * @param {number} o.from
 * @param {number} o.to
 * @param {boolean} o.creation   Character creation: a 12 Tenure budget, maximum rating 2, free to rearrange.
 * @param {number} o.grade
 * @param {number} o.unspent     Unspent Tenure (play).
 * @param {number} o.spent       Tenure already spent from the creation budget on all skills.
 * @param {boolean} [o.gm]       The GM may set anything, free.
 * @returns {{ok: boolean, cost: number, reason?: string}}
 */
export function skillChange({ from, to, creation, grade, unspent = 0, spent = 0, gm = false }) {
  if (!Number.isInteger(to) || to < 0 || to > 3) return { ok: false, cost: 0, reason: "range" };
  if (to === from) return { ok: true, cost: 0 };
  const cost = skillCost(to) - skillCost(from);
  if (gm) return { ok: true, cost: 0 };

  if (creation) {
    if (to > CREATION_MAX) return { ok: false, cost: 0, reason: "creationMax" };
    if (cost > 0 && spent + cost > CREATION_BUDGET) return { ok: false, cost, reason: "creationBudget" };
    return { ok: true, cost };
  }

  if (cost < 0) return { ok: false, cost, reason: "noRefund" };
  if (to === 3 && grade < RATING_3_GRADE) return { ok: false, cost, reason: "needGrade" };
  if (cost > unspent) return { ok: false, cost, reason: "needTenure" };
  return { ok: true, cost };
}

/* ── Traits ── */

export const TRAIT_BASE = 3;
export const TRAIT_MAX = 6;
export const TRAIT_COST = 4;

/** Buying another open Trait slot: 4 Tenure, to a maximum of six. */
export function traitSlotPurchase({ slots, unspent }) {
  if (slots >= TRAIT_MAX) return { ok: false, cost: TRAIT_COST, reason: "max" };
  if (unspent < TRAIT_COST) return { ok: false, cost: TRAIT_COST, reason: "needTenure" };
  return { ok: true, cost: TRAIT_COST };
}

/* ── Tenure ── */

/**
 * Award Tenure: it raises both lifetime earned (which sets Grade) and unspent (which you spend).
 * Reports a Grade-up so the log can highlight it.
 */
export function awardTenure({ earned, unspent }, amount) {
  const gained = Math.max(0, Math.trunc(Number(amount) || 0));
  const before = gradeFor(earned);
  const after = gradeFor(earned + gained);
  return {
    earned: earned + gained,
    unspent: unspent + gained,
    gained,
    gradeBefore: before,
    gradeAfter: after,
    gradeUp: after > before
  };
}
