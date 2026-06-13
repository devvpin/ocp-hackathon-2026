import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  getMenu() {
    return api.get('/menu');
  },
  getTableInfo(id) {
    return api.get(`/tables/${id}`);
  },
  createOrder(data) {
    return api.post('/orders', data);
  },
  createTableRequest(tableId, type) {
    return api.post(`/tables/${tableId}/requests`, { type });
  }
};
