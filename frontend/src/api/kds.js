import api from './axios';
import * as envelope from './envelope';

const kdsApi = {
  getOrders: () => api.get('/kds/orders').then(envelope.ok),
  advanceStage: (orderId, newStage) => api.patch(`/kds/orders/${orderId}/stage`, { stage: newStage }).then(envelope.ok),
  toggleItemComplete: (orderId, itemId) => api.patch(`/kds/items/${itemId}/done`).then(envelope.ok),
};

export default kdsApi;
