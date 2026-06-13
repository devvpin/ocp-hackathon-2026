import api from './axios';

export default {
  getReservations(params) {
    return api.get('/reservations', { params }).then((res) => res.data);
  },
  getReservation(id) {
    return api.get(`/reservations/${id}`).then((res) => res.data);
  },
  createReservation(data) {
    return api.post('/reservations', data).then((res) => res.data);
  },
  updateReservation(id, data) {
    return api.put(`/reservations/${id}`, data).then((res) => res.data);
  },
  deleteReservation(id) {
    return api.delete(`/reservations/${id}`).then((res) => res.data);
  },
};
