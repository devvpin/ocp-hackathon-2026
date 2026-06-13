import { delay, mockReportData } from './mockData';

const reportsApi = {
  async getData(filters = {}) {
    await delay(500);
    return { data: { ...mockReportData } };
  },
};

export default reportsApi;
