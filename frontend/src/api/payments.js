import api from './axios';

export default {
  processPayment: (payload) => api.post('/payments', payload),
  createRazorpayOrder: (payload) => api.post('/payments/razorpay/create-order', payload),
  verifyRazorpay: (payload) => api.post('/payments/razorpay/verify', payload),
};
