import api from './axios';

export default {
  getReservations(params) {
    return api.get('/reservations', { params }).then((r) => r.data);
  },
  getReservation(id) {
    return api.get(`/reservations/${id}`).then((r) => r.data);
  },
  createReservation(data) {
    return api.post('/reservations', data).then((r) => r.data);
  },
  updateReservation(id, data) {
    return api.patch(`/reservations/${id}`, data).then((r) => r.data);
  },
  deleteReservation(id) {
    return api.delete(`/reservations/${id}`).then((r) => r.data);
  },
};
