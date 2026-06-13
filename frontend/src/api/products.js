import { delay, mockProducts, generateId } from './mockData';

let products = [...mockProducts];

const productsApi = {
  async getAll() {
    await delay(300);
    return { data: [...products] };
  },

  async getById(id) {
    await delay(200);
    const product = products.find((p) => p.id === id);
    if (!product) throw { response: { data: { message: 'Product not found' } } };
    return { data: product };
  },

  async create(data) {
    await delay(400);
    const product = { id: generateId(), ...data };
    products.push(product);
    return { data: product };
  },

  async update(id, data) {
    await delay(400);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw { response: { data: { message: 'Product not found' } } };
    products[index] = { ...products[index], ...data };
    return { data: products[index] };
  },

  async delete(id) {
    await delay(300);
    products = products.filter((p) => p.id !== id);
    return { data: { success: true } };
  },
};

export default productsApi;
