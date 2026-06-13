import { delay, mockCategories, generateId } from './mockData';

let categories = [...mockCategories];

const categoriesApi = {
  async getAll() {
    await delay(300);
    return { data: [...categories] };
  },

  async getById(id) {
    await delay(200);
    const category = categories.find((c) => c.id === id);
    if (!category) throw { response: { data: { message: 'Category not found' } } };
    return { data: category };
  },

  async create(data) {
    await delay(400);
    const category = { id: generateId(), ...data };
    categories.push(category);
    return { data: category };
  },

  async update(id, data) {
    await delay(400);
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw { response: { data: { message: 'Category not found' } } };
    categories[index] = { ...categories[index], ...data };
    return { data: categories[index] };
  },

  async delete(id) {
    await delay(300);
    categories = categories.filter((c) => c.id !== id);
    return { data: { success: true } };
  },
};

export default categoriesApi;
