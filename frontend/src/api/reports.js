import api from './axios';
import * as envelope from './envelope';

const reportsApi = {
  async getData(filters = {}) {
    const params = { ...filters };
    const [summary, salesTrend, topProducts, topCategories, topOrders] = await Promise.all([
      api.get('/reports/summary', { params }).then(envelope.data),
      api.get('/reports/sales-trend', { params }).then(envelope.data),
      api.get('/reports/top-products', { params }).then(envelope.data),
      api.get('/reports/top-categories', { params }).then(envelope.data),
      api.get('/reports/top-orders', { params }).then(envelope.data),
    ]);

    return {
      data: {
        summary,
        salesTrend,
        topProducts,
        topCategories,
        topOrders,
      }
    };
  },
};

export default reportsApi;
