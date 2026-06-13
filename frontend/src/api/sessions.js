import { delay, mockSession } from './mockData';

let session = { ...mockSession };

const sessionsApi = {
  async getCurrent() {
    await delay(300);
    return { data: { ...session } };
  },

  async open() {
    await delay(500);
    session = {
      ...session,
      isOpen: true,
      openedAt: new Date().toISOString(),
      closedAt: null,
      totalOrders: 0,
      totalRevenue: 0,
    };
    return { data: { ...session } };
  },

  async close() {
    await delay(500);
    session = {
      ...session,
      isOpen: false,
      closedAt: new Date().toISOString(),
    };
    return { data: { ...session } };
  },
};

export default sessionsApi;
