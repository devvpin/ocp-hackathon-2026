import api from './axios';

export default {
  processPayment: (payload) => api.post('/payments', payload),
};
