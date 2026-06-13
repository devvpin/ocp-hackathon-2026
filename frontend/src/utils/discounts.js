/**
 * Discount computation engine for Odoo Cafe POS.
 * Recomputes on every cart mutation.
 */

/**
 * Apply product-level promotions to cart items.
 * When cart item quantity >= minimumQuantity for a matched product, apply discount to that line.
 */
export function applyProductPromotions(cartItems, promotions) {
  const productPromos = promotions.filter((p) => p.appliedTo === 'product');

  return cartItems.map((item) => {
    const promo = productPromos.find(
      (p) => p.productId === item.productId && (!p.minQuantity || item.quantity >= p.minQuantity)
    );

    if (promo) {
      let discountAmount = 0;
      if (promo.discountType === 'percentage') {
        discountAmount = (item.price * item.quantity * promo.discountValue) / 100;
      } else {
        discountAmount = Math.min(promo.discountValue, item.price * item.quantity);
      }
      return {
        ...item,
        discount: Math.round(discountAmount * 100) / 100,
        promoApplied: promo,
      };
    }

    return { ...item, discount: 0, promoApplied: null };
  });
}

/**
 * Apply order-level promotions to the cart subtotal.
 * When cart subtotal >= minimumOrderAmount, apply discount to order total.
 */
export function applyOrderPromotions(subtotal, promotions) {
  const orderPromos = promotions.filter((p) => p.appliedTo === 'order');
  let orderDiscount = 0;
  let appliedPromo = null;

  for (const promo of orderPromos) {
    if (!promo.minOrderAmount || subtotal >= promo.minOrderAmount) {
      let discount = 0;
      if (promo.discountType === 'percentage') {
        discount = (subtotal * promo.discountValue) / 100;
      } else {
        discount = Math.min(promo.discountValue, subtotal);
      }
      if (discount > orderDiscount) {
        orderDiscount = discount;
        appliedPromo = promo;
      }
    }
  }

  return {
    orderDiscount: Math.round(orderDiscount * 100) / 100,
    appliedPromo,
  };
}

/**
 * Apply a coupon discount to the order total.
 * Coupon data comes from API validation response.
 */
export function applyCouponDiscount(subtotal, coupon) {
  if (!coupon) return 0;

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
  } else {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  return Math.round(discount * 100) / 100;
}

/**
 * Compute the full cart totals including all discounts.
 * Discounts are never stacked unless explicitly multiple.
 */
export function computeCartTotals(cartItems, promotions = [], coupon = null) {
  const itemsWithPromos = applyProductPromotions(cartItems, promotions);

  const subtotal = itemsWithPromos.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const productDiscountTotal = itemsWithPromos.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );

  const taxTotal = itemsWithPromos.reduce(
    (sum, item) => sum + ((item.price * item.quantity - (item.discount || 0)) * (item.tax || 0)) / 100,
    0
  );

  const { orderDiscount, appliedPromo } = applyOrderPromotions(
    subtotal - productDiscountTotal,
    promotions
  );

  const couponDiscount = applyCouponDiscount(
    subtotal - productDiscountTotal - orderDiscount,
    coupon
  );

  const totalDiscount = productDiscountTotal + orderDiscount + couponDiscount;
  const total = subtotal - totalDiscount + taxTotal;

  return {
    items: itemsWithPromos,
    subtotal: Math.round(subtotal * 100) / 100,
    productDiscountTotal: Math.round(productDiscountTotal * 100) / 100,
    orderDiscount: Math.round(orderDiscount * 100) / 100,
    orderPromo: appliedPromo,
    couponDiscount: Math.round(couponDiscount * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(Math.max(0, total) * 100) / 100,
  };
}
