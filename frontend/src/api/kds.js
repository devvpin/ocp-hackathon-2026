import api from './axios';

const kdsApi = {
  async getOrders() {
    return api.get('/kds/orders');
  },

  async advanceStage(orderId, newStage) {
    return api.patch(`/kds/orders/${orderId}/stage`, { stage: newStage });
  },

  async toggleItemComplete(orderId, itemId) {
    return api.patch(`/kds/items/${itemId}/done`);
  },

  async addOrder(orderData) {
    // This is probably only used by mock data simulation, real app uses websockets
    return { data: orderData };
  },
};

export default kdsApi;
