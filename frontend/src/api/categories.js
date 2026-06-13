import api from './axios';
import { ok, okList } from './envelope';

const categoriesApi = {
  async getAll(params = {}) {
    return okList(await api.get('/categories', { params }));
  },

  async getById(id) {
    const res = await api.get('/categories', { params: { limit: 100 } });
    const category = res.data.data.find((item) => item.id === id);
    return { data: category };
  },

  async create(data) {
    return ok(await api.post('/categories', data));
  },

  async update(id, data) {
    return ok(await api.patch(`/categories/${id}`, data));
  },

  async delete(id) {
    return ok(await api.delete(`/categories/${id}`));
  },
};

export default categoriesApi;
