import api from './axios';
import { data, ok } from './envelope';

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
    return { data: data(await api.post('/promotions', payload)) };
  },

  async updatePromotion(id, payload) {
    return { data: data(await api.patch(`/promotions/${id}`, payload)) };
  },

  async deletePromotion(id) {
    return ok(await api.delete(`/promotions/${id}`));
  },
};

export default promotionsApi;
