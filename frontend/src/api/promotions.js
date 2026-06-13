import { delay, mockCoupons, mockPromotions, generateId } from './mockData';

let coupons = [...mockCoupons];
let promotions = [...mockPromotions];

const promotionsApi = {
  async getCoupons() {
    await delay(300);
    return { data: [...coupons] };
  },

  async createCoupon(data) {
    await delay(400);
    const exists = coupons.find((c) => c.code === data.code);
    if (exists) throw { response: { data: { message: 'Coupon code already exists' } } };
    const coupon = { id: generateId(), ...data };
    coupons.push(coupon);
    return { data: coupon };
  },

  async updateCoupon(id, data) {
    await delay(400);
    const index = coupons.findIndex((c) => c.id === id);
    if (index === -1) throw { response: { data: { message: 'Coupon not found' } } };
    coupons[index] = { ...coupons[index], ...data };
    return { data: coupons[index] };
  },

  async deleteCoupon(id) {
    await delay(300);
    coupons = coupons.filter((c) => c.id !== id);
    return { data: { success: true } };
  },

  async validateCoupon(code) {
    await delay(500);
    const coupon = coupons.find((c) => c.code === code);
    if (!coupon) throw { response: { data: { message: 'Invalid coupon code' } } };
    return { data: coupon };
  },

  async getPromotions() {
    await delay(300);
    return { data: [...promotions] };
  },

  async createPromotion(data) {
    await delay(400);
    const promo = { id: generateId(), ...data };
    promotions.push(promo);
    return { data: promo };
  },

  async updatePromotion(id, data) {
    await delay(400);
    const index = promotions.findIndex((p) => p.id === id);
    if (index === -1) throw { response: { data: { message: 'Promotion not found' } } };
    promotions[index] = { ...promotions[index], ...data };
    return { data: promotions[index] };
  },

  async deletePromotion(id) {
    await delay(300);
    promotions = promotions.filter((p) => p.id !== id);
    return { data: { success: true } };
  },
};

export default promotionsApi;
