import api from './axios';
import { data, ok, okList } from './envelope';

function normalizeUser(user) {
  return {
    ...user,
    status: user.isArchived ? 'archived' : 'active',
  };
}

const usersApi = {
  async getAll(params = {}) {
    const res = okList(await api.get('/users', { params }));
    return { ...res, data: res.data.map(normalizeUser) };
  },

  async create(payload) {
    return { data: normalizeUser(data(await api.post('/users', payload))) };
  },

  async update(id, payload) {
    return { data: normalizeUser(data(await api.patch(`/users/${id}`, payload))) };
  },

  async changePassword(id, newPassword) {
    return ok(await api.patch(`/users/${id}/password`, { password: newPassword }));
  },

  async toggleArchive(user) {
    const id = typeof user === 'string' ? user : user.id;
    return { data: normalizeUser(data(await api.patch(`/users/${id}/archive`))) };
  },

  async delete(id) {
    return ok(await api.delete(`/users/${id}`));
  },
};

export default usersApi;
