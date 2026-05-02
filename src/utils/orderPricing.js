import { DELIVERY_CHARGE_USD, FREE_DELIVERY_SUBTOTAL_USD } from '../constants/pricing.js';
import { getMypetDiscountedPrice } from '../constants/promoMypet.js';

/**
 * Pricing from submitted order shape: orderData.albums[].album.price = charged line price
 * orderData.preDiscountSubtotal = sum of list prices before promo (for free-delivery threshold)
 */
export function getOrderPricing(orderData) {
  const albums = orderData.albums || [];
  const is4x100Offer = albums.length === 4 && albums.every((a) => a.album?.size === 100);
  const chargedSubtotal = is4x100Offer
    ? 149
    : albums.reduce((sum, a) => sum + (Number(a.album?.price) || 0), 0);

  const preDiscount = orderData.preDiscountSubtotal;
  const preDiscountSubtotal =
    preDiscount != null && Number.isFinite(preDiscount)
      ? preDiscount
      : chargedSubtotal;

  const deliveryCharge = is4x100Offer
    ? 0
    : preDiscountSubtotal >= FREE_DELIVERY_SUBTOTAL_USD
      ? 0
      : DELIVERY_CHARGE_USD;

  const total = is4x100Offer ? 149 : chargedSubtotal + deliveryCharge;

  return {
    subtotal: chargedSubtotal,
    deliveryCharge,
    total,
    is4x100Offer,
  };
}

/**
 * Live checkout (OrderForm): uses selectedAlbum list prices + promo flag
 */
export function getCheckoutPricingFromAlbumsState(albums, { promoMypetApplied, is4x100Offer }) {
  const preDiscountSubtotal = is4x100Offer
    ? 0
    : albums.reduce((sum, a) => sum + (a.selectedAlbum?.price || 0), 0);

  const chargedSubtotal = is4x100Offer
    ? 149
    : albums.reduce((sum, a) => {
        const p = a.selectedAlbum?.price || 0;
        const sz = a.selectedAlbum?.size;
        return sum + (promoMypetApplied ? getMypetDiscountedPrice(sz, p) : p);
      }, 0);

  const deliveryCharge = is4x100Offer
    ? 0
    : preDiscountSubtotal >= FREE_DELIVERY_SUBTOTAL_USD
      ? 0
      : DELIVERY_CHARGE_USD;

  const total = is4x100Offer ? 149 : chargedSubtotal + deliveryCharge;

  return {
    preDiscountSubtotal,
    chargedSubtotal,
    deliveryCharge,
    total,
  };
}

export { isMypetPromoEligible, getMypetDiscountedPrice, isMypetPromoPeriodActive } from '../constants/promoMypet.js';
