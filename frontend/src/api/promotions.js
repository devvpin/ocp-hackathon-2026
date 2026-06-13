import api from './axios';
import * as envelope from './envelope';

const promotionsApi = {
  getCoupons: () => api.get('/coupons').then(envelope.okList),
  createCoupon: (data) => api.post('/coupons', data).then(envelope.ok),
  updateCoupon: (id, data) => api.patch(`/coupons/${id}`, data).then(envelope.ok),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`).then(envelope.ok),
  validateCoupon: (code, orderSubtotal = 0) => api.post('/coupons/validate', { code, orderSubtotal }).then(envelope.ok),

  getPromotions: () => api.get('/promotions').then(envelope.okList),
  createPromotion: (data) => api.post('/promotions', data).then(envelope.ok),
  updatePromotion: (id, data) => api.patch(`/promotions/${id}`, data).then(envelope.ok),
  deletePromotion: (id) => api.delete(`/promotions/${id}`).then(envelope.ok),
};

export default promotionsApi;
