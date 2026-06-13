import api from './axios';
import { data } from './envelope';

const sessionsApi = {
  async getCurrent() {
    return { data: data(await api.get('/sessions/current')) };
  },

  async open() {
    return { data: data(await api.post('/sessions/open')) };
  },

  async close(id) {
    const sessionId = id || data(await api.get('/sessions/current'))?.id;
    return { data: data(await api.post(`/sessions/${sessionId}/close`)) };
  },
};

export default sessionsApi;
