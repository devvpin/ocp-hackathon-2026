import { delay, mockUsers } from './mockData';
import { getToken } from '../utils/tokenStorage';

let users = [...mockUsers];

const authApi = {
  async login(email, password) {
    await delay(500);
    const user = users.find((u) => u.email === email && u.status === 'active');
    if (!user) {
      throw { response: { data: { message: 'Invalid email or password' } } };
    }
    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }));
    return { data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } };
  },

  async signup(name, email, password) {
    await delay(500);
    const exists = users.find((u) => u.email === email);
    if (exists) {
      throw { response: { data: { message: 'Email already registered' } } };
    }
    const newUser = { id: String(Date.now()), name, email, role: 'admin', status: 'active' };
    users.push(newUser);
    const token = btoa(JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role, exp: Date.now() + 86400000 }));
    return { data: { token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } } };
  },

  async getCurrentUser() {
    await delay(200);
    const token = getToken();
    if (!token) throw { response: { status: 401 } };
    try {
      const decoded = JSON.parse(atob(token));
      const user = users.find((u) => u.id === decoded.id);
      if (!user) throw { response: { status: 401 } };
      return { data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } };
    } catch {
      throw { response: { status: 401 } };
    }
  },
};

export default authApi;
