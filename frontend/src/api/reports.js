import api from './axios';

const reportsApi = {
  async getData(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const [summary, salesTrend, topProducts, topCategories, topOrders] = await Promise.all([
      api.get(`/reports/summary?${params}`),
      api.get(`/reports/sales-trend?${params}`),
      api.get(`/reports/top-products?${params}&limit=5`),
      api.get(`/reports/top-categories?${params}`),
      api.get(`/reports/top-orders?${params}`)
    ]);

    return {
      data: {
        totalOrders: summary.data.data.totalOrders,
        revenue: summary.data.data.revenue,
        averageOrderValue: summary.data.data.avgOrderValue,
        salesTrend: salesTrend.data.data.map(item => ({
          date: item.period,
          revenue: item.revenue,
          orders: item.totalOrders
        })),
        topCategories: topCategories.data.data.map((item, i) => ({
          name: item.categoryName,
          revenue: item.revenue,
          color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5]
        })),
        topProducts: topProducts.data.data.map(item => ({
          name: item.productName,
          qtySold: item.quantity,
          revenue: item.revenue
        })),
        topOrders: topOrders.data.data.map(item => ({
          orderNumber: item.orderNumber,
          date: new Date(item.paidAt).toLocaleDateString(),
          customer: item.customer?.name || 'Walk-in',
          amount: item.total
        }))
      }
    };
  },
  async getSummary(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/reports/summary?${params}`);
    return res.data;
  }
};

export default reportsApi;
