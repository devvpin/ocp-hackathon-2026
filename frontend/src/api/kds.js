import { delay, mockKDSOrders } from './mockData';

let kdsOrders = [...mockKDSOrders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }))];

const kdsApi = {
  async getOrders() {
    await delay(300);
    return { data: kdsOrders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) })) };
  },

  async advanceStage(orderId) {
    await delay(300);
    const index = kdsOrders.findIndex((o) => o.id === orderId);
    if (index === -1) throw { response: { data: { message: 'Order not found' } } };
    const stages = ['to_cook', 'preparing', 'completed'];
    const currentStageIndex = stages.indexOf(kdsOrders[index].stage);
    if (currentStageIndex < stages.length - 1) {
      kdsOrders[index].stage = stages[currentStageIndex + 1];
    }
    return { data: { ...kdsOrders[index], items: kdsOrders[index].items.map((i) => ({ ...i })) } };
  },

  async toggleItemComplete(orderId, itemId) {
    await delay(200);
    const order = kdsOrders.find((o) => o.id === orderId);
    if (!order) throw { response: { data: { message: 'Order not found' } } };
    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw { response: { data: { message: 'Item not found' } } };
    item.completed = !item.completed;
    return { data: { ...order, items: order.items.map((i) => ({ ...i })) } };
  },

  async addOrder(orderData) {
    await delay(200);
    kdsOrders.push(orderData);
    return { data: orderData };
  },
};

export default kdsApi;
