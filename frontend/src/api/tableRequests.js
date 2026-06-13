import api from './axios';

export default {
  getActiveRequests() {
    return api.get('/table-requests?status=pending');
  },
  resolveRequest(id) {
    return api.patch(`/table-requests/${id}/resolve`);
  }
};
