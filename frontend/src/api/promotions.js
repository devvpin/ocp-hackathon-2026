import api from './axios';
import { data, ok } from './envelope';

function toApiPayload(payload) {
  let name = payload.name;
  if (!name) {
    if (payload.appliedTo === 'product') {
      name = `Promo: ${payload.productName || 'Product'}`;
    } else {
      name = `Promo: Order over ${payload.minimumOrderAmount || 0}`;
    }
  }
  return {
    name,
    appliedTo: payload.appliedTo,
    productId: payload.productId || null,
    minQuantity: payload.minimumQuantity ? Number(payload.minimumQuantity) : null,
    minOrderAmount: payload.minimumOrderAmount ? Number(payload.minimumOrderAmount) : null,
    discountType: payload.discountType,
    discountValue: Number(payload.discountValue),
    isActive: payload.isActive ?? true,
  };
}

const promotionsApi = {
  async getCoupons(params) {
    return { data: data(await api.get('/promotions/coupons', { params })) };
  },

  async createCoupon(payload) {
    return { data: data(await api.post('/promotions/coupons', payload)) };
  },

  async updateCoupon(id, payload) {
    return { data: data(await api.patch(`/promotions/coupons/${id}`, payload)) };
  },

  async deleteCoupon(id) {
    return ok(await api.delete(`/promotions/coupons/${id}`));
  },

  async validateCoupon(code) {
    return { data: data(await api.get(`/promotions/coupons/validate/${code}`)) };
  },

  async getPromotions(params) {
    return { data: data(await api.get('/promotions', { params })) };
  },

  async createPromotion(payload) {
    return { data: data(await api.post('/promotions', toApiPayload(payload))) };
  },

  async updatePromotion(id, payload) {
    return { data: data(await api.patch(`/promotions/${id}`, toApiPayload(payload))) };
  },

  async deletePromotion(id) {
    return ok(await api.delete(`/promotions/${id}`));
  },
};

export default promotionsApi;
