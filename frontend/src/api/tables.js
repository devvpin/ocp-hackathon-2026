import { delay, mockFloors, mockTables, generateId } from './mockData';

let floors = [...mockFloors];
let tables = [...mockTables];

const tablesApi = {
  async getFloors() {
    await delay(300);
    return { data: [...floors] };
  },

  async createFloor(data) {
    await delay(400);
    const floor = { id: generateId(), ...data };
    floors.push(floor);
    return { data: floor };
  },

  async deleteFloor(id) {
    await delay(300);
    floors = floors.filter((f) => f.id !== id);
    tables = tables.filter((t) => t.floorId !== id);
    return { data: { success: true } };
  },

  async getTables(floorId) {
    await delay(300);
    const filtered = floorId ? tables.filter((t) => t.floorId === floorId) : [...tables];
    return { data: filtered };
  },

  async getAllTables() {
    await delay(300);
    return { data: [...tables] };
  },

  async createTable(data) {
    await delay(400);
    const table = { id: generateId(), ...data, status: 'available' };
    tables.push(table);
    return { data: table };
  },

  async updateTable(id, data) {
    await delay(400);
    const index = tables.findIndex((t) => t.id === id);
    if (index === -1) throw { response: { data: { message: 'Table not found' } } };
    tables[index] = { ...tables[index], ...data };
    return { data: tables[index] };
  },

  async deleteTable(id) {
    await delay(300);
    tables = tables.filter((t) => t.id !== id);
    return { data: { success: true } };
  },

  async updateTableStatus(id, status) {
    await delay(200);
    const index = tables.findIndex((t) => t.id === id);
    if (index !== -1) {
      tables[index].status = status;
    }
    return { data: tables[index] };
  },
};

export default tablesApi;
