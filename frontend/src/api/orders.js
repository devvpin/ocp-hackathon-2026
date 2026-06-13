import api from './axios';
import * as envelope from './envelope';

const ordersApi = {
  getAll: (params) => api.get('/orders', { params }).then(envelope.okList),
  getById: (id) => api.get(`/orders/${id}`).then(envelope.ok),
  create: (data) => api.post('/orders', data).then(envelope.ok),
  update: (id, data) => api.patch(`/orders/${id}`, data).then(envelope.ok),
  delete: (id) => api.delete(`/orders/${id}`).then(envelope.ok),
  markPaid: (id, paymentMethod) => api.patch(`/orders/${id}/pay`, { paymentMethod }).then(envelope.ok),
  sendToKitchen: (id) => api.post(`/orders/${id}/send-kitchen`).then(envelope.ok),
  sendReceipt: (id, email) => api.post(`/orders/${id}/send-receipt`, { email }).then(envelope.ok),
};

export default ordersApi;
