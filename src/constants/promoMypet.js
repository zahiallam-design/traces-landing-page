/** Case-insensitive promo code for May "mypet" campaign */
export const PROMO_MYPET_CODE = 'mypet';

/** List price → discounted album price (~20%, rounded as specified) */
export const PROMO_MYPET_DISCOUNT_PRICES = {
  52: 26,
  100: 37,
};

/**
 * Promo window: calendar May (local time), unless overridden by env:
 * - VITE_PROMO_MYPET_ACTIVE=true → always allow
 * - VITE_PROMO_MYPET_ACTIVE=false → never allow (overrides May)
 * - unset → May only
 */
export function isMypetPromoPeriodActive(date = new Date()) {
  const flag = import.meta.env.VITE_PROMO_MYPET_ACTIVE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return date.getMonth() === 4; // May (0-indexed)
}

export function normalizePromoCode(input) {
  return String(input ?? '').trim().toLowerCase();
}

export function getMypetDiscountedPrice(size, listPrice) {
  const mapped = PROMO_MYPET_DISCOUNT_PRICES[size];
  if (mapped != null) return mapped;
  const n = Number(listPrice);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 0.8);
}

/** Eligible when: in promo period, not 4×100 offer, code matches */
export function isMypetPromoEligible({ promoCodeInput, is4x100Offer, date = new Date() }) {
  if (is4x100Offer) return false;
  if (!isMypetPromoPeriodActive(date)) return false;
  return normalizePromoCode(promoCodeInput) === PROMO_MYPET_CODE;
}
