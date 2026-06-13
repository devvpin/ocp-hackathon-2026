import { delay, mockCustomers, generateId } from './mockData';

let customers = [...mockCustomers];

const customersApi = {
  async getAll() {
    await delay(300);
    return { data: [...customers] };
  },

  async getById(id) {
    await delay(200);
    const customer = customers.find((c) => c.id === id);
    if (!customer) throw { response: { data: { message: 'Customer not found' } } };
    return { data: customer };
  },

  async create(data) {
    await delay(400);
    const customer = { id: generateId(), ...data };
    customers.push(customer);
    return { data: customer };
  },

  async update(id, data) {
    await delay(400);
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw { response: { data: { message: 'Customer not found' } } };
    customers[index] = { ...customers[index], ...data };
    return { data: customers[index] };
  },

  async delete(id) {
    await delay(300);
    customers = customers.filter((c) => c.id !== id);
    return { data: { success: true } };
  },
};

export default customersApi;
