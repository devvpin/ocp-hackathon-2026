import { delay, mockUsers, generateId } from './mockData';

let users = [...mockUsers];

const usersApi = {
  async getAll() {
    await delay(300);
    return { data: [...users] };
  },

  async create(data) {
    await delay(400);
    const exists = users.find((u) => u.email === data.email);
    if (exists) throw { response: { data: { message: 'Email already exists' } } };
    const user = { id: generateId(), ...data, status: 'active' };
    users.push(user);
    return { data: user };
  },

  async update(id, data) {
    await delay(400);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw { response: { data: { message: 'User not found' } } };
    users[index] = { ...users[index], ...data };
    return { data: users[index] };
  },

  async changePassword(id, newPassword) {
    await delay(400);
    const user = users.find((u) => u.id === id);
    if (!user) throw { response: { data: { message: 'User not found' } } };
    return { data: { success: true, message: 'Password changed successfully' } };
  },

  async toggleArchive(id) {
    await delay(300);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw { response: { data: { message: 'User not found' } } };
    users[index].status = users[index].status === 'active' ? 'archived' : 'active';
    return { data: users[index] };
  },

  async delete(id) {
    await delay(300);
    users = users.filter((u) => u.id !== id);
    return { data: { success: true } };
  },
};

export default usersApi;
