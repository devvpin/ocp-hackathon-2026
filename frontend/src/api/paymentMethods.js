import { delay, mockPaymentMethods } from './mockData';

let methods = [...mockPaymentMethods];

const paymentMethodsApi = {
  async getAll() {
    await delay(300);
    return { data: [...methods] };
  },

  async update(id, data) {
    await delay(400);
    const index = methods.findIndex((m) => m.id === id);
    if (index === -1) throw { response: { data: { message: 'Payment method not found' } } };
    methods[index] = { ...methods[index], ...data };
    return { data: methods[index] };
  },

  async toggle(id) {
    await delay(300);
    const index = methods.findIndex((m) => m.id === id);
    if (index === -1) throw { response: { data: { message: 'Payment method not found' } } };
    methods[index].enabled = !methods[index].enabled;
    return { data: methods[index] };
  },
};

export default paymentMethodsApi;
