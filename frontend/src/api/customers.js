import api from './axios';
import { data, ok, okList } from './envelope';

const customersApi = {
  async getAll(params = {}) {
    return okList(await api.get('/customers', { params }));
  },

  async getById(id) {
    const res = await api.get('/customers', { params: { limit: 100 } });
    return { data: res.data.data.find((customer) => customer.id === id) };
  },

  async create(payload) {
    return { data: data(await api.post('/customers', payload)) };
  },

  async update(id, payload) {
    return { data: data(await api.patch(`/customers/${id}`, payload)) };
  },

  async delete(id) {
    return ok(await api.delete(`/customers/${id}`));
  },
};

export default customersApi;
