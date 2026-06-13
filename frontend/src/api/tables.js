import api from './axios';
import { data, ok } from './envelope';

function normalizeTable(table, status) {
  return {
    ...table,
    number: table.tableNumber,
    seats: table.seatCount,
    active: table.isActive,
    status: status?.occupied ? 'occupied' : 'available',
    orderId: status?.orderId ?? null,
    orderStatus: status?.orderStatus ?? null,
    customerName: status?.customerName ?? null,
  };
}

function normalizeFloor(floor) {
  return {
    ...floor,
    tables: (floor.tables || []).map((table) => normalizeTable(table)),
  };
}

function toTablePayload(payload) {
  return {
    floorId: payload.floorId,
    tableNumber: Number(payload.number ?? payload.tableNumber),
    seatCount: Number(payload.seats ?? payload.seatCount),
    isActive: payload.active ?? payload.isActive ?? true,
  };
}

async function withStatus(table) {
  try {
    const status = data(await api.get(`/tables/${table.id}/status`));
    return normalizeTable(table, status);
  } catch {
    return normalizeTable(table);
  }
}

const tablesApi = {
  async getFloors() {
    const floors = data(await api.get('/floors')).map(normalizeFloor);
    return { data: floors };
  },

  async createFloor(payload) {
    return { data: normalizeFloor(data(await api.post('/floors', payload))) };
  },

  async deleteFloor(id) {
    return ok(await api.delete(`/floors/${id}`));
  },

  async getTables(floorId) {
    const floors = data(await api.get('/floors')).map(normalizeFloor);
    const tables = floors.flatMap((floor) => floor.tables || []);
    return { data: floorId ? tables.filter((table) => table.floorId === floorId) : tables };
  },

  async getAllTables() {
    const floors = data(await api.get('/floors'));
    const tables = floors.flatMap((floor) => floor.tables || []);
    return { data: await Promise.all(tables.map(withStatus)) };
  },

  async createTable(payload) {
    const body = toTablePayload(payload);
    const table = data(await api.post(`/floors/${body.floorId}/tables`, body));
    return { data: normalizeTable(table) };
  },

  async updateTable(id, payload) {
    const table = data(await api.patch(`/tables/${id}`, toTablePayload(payload)));
    return { data: normalizeTable(table) };
  },

  async deleteTable(id) {
    return ok(await api.delete(`/tables/${id}`));
  },

  async updateTableStatus(id) {
    const status = data(await api.get(`/tables/${id}/status`));
    const table = data(await api.get(`/tables/${id}`));
    return { data: normalizeTable(table, status) };
  },
};

export default tablesApi;
