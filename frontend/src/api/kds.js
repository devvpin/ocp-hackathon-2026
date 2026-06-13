import api from './axios';

function unwrap(res) {
  return res.data.data;
}

const kdsApi = {
  async getOrders() {
    return unwrap(await api.get('/kds/orders'));
  },

  async advanceStage(orderId, newStage) {
    return unwrap(await api.patch(`/kds/orders/${orderId}/stage`, { stage: newStage }));
  },

  async toggleItemComplete(orderId, itemId) {
    return unwrap(await api.patch(`/kds/items/${itemId}/done`));
  },

  async addOrder(orderData) {
    // This is probably only used by mock data simulation, real app uses websockets
    return orderData;
  },
};

export default kdsApi;
