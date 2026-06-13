import api from './axios';

function unwrapAuthResponse(response) {
  return {
    data: {
      token: response.data.data.token,
      user: response.data.data.user,
    },
  };
}

function unwrapUserResponse(response) {
  return {
    data: {
      user: response.data.data.user,
    },
  };
}

const authApi = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return unwrapAuthResponse(response);
  },

  async signup(name, email, password) {
    const response = await api.post('/auth/signup', { name, email, password });
    return unwrapAuthResponse(response);
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return unwrapUserResponse(response);
  },

  async logout() {
    return api.post('/auth/logout');
  },
};

export default authApi;
