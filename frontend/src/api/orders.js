import { delay, mockOrders, generateId } from './mockData';

let orders = [...mockOrders];

const ordersApi = {
  async getAll() {
    await delay(300);
    return { data: [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)) };
  },

  async getById(id) {
    await delay(200);
    const order = orders.find((o) => o.id === id);
    if (!order) throw { response: { data: { message: 'Order not found' } } };
    return { data: order };
  },

  async create(data) {
    await delay(400);
    const order = {
      id: generateId(),
      date: new Date().toISOString(),
      status: 'draft',
      ...data,
    };
    orders.push(order);
    return { data: order };
  },

  async update(id, data) {
    await delay(400);
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw { response: { data: { message: 'Order not found' } } };
    orders[index] = { ...orders[index], ...data };
    return { data: orders[index] };
  },

  async delete(id) {
    await delay(300);
    orders = orders.filter((o) => o.id !== id);
    return { data: { success: true } };
  },

  async markPaid(id, paymentMethod) {
    await delay(400);
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw { response: { data: { message: 'Order not found' } } };
    orders[index].status = 'paid';
    orders[index].paymentMethod = paymentMethod;
    return { data: orders[index] };
  },

  async sendToKitchen(id) {
    await delay(500);
    return { data: { success: true, message: 'Order sent to kitchen' } };
  },

  async sendReceipt(id, email) {
    await delay(500);
    return { data: { success: true, message: `Receipt sent to ${email}` } };
  },
};

export default ordersApi;
