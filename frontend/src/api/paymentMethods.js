import api from './axios';
import { data } from './envelope';

const labels = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
};

function normalizeMethod(method) {
  return {
    ...method,
    type: method.method,
    name: labels[method.method] || method.method,
    enabled: method.isEnabled,
  };
}

const paymentMethodsApi = {
  async getAll() {
    return { data: data(await api.get('/payment-methods')).map(normalizeMethod) };
  },

  async update(id, payload) {
    const body = {
      isEnabled: payload.isEnabled ?? payload.enabled,
      upiId: payload.upiId,
    };
    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
    return { data: normalizeMethod(data(await api.patch(`/payment-methods/${id}`, body))) };
  },

  async toggle(method) {
    const id = typeof method === 'string' ? method : method.id;
    const current = typeof method === 'string'
      ? data(await api.get('/payment-methods')).find((item) => item.id === id)
      : method;
    return this.update(id, { isEnabled: !(current.isEnabled ?? current.enabled) });
  },
};

export default paymentMethodsApi;
