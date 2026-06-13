import api from './axios';
import { data, ok, okList } from './envelope';

const uomToApi = {
  'Per Piece': 'per_piece',
  'Per Kg': 'per_kg',
  'Per Litre': 'per_litre',
  per_piece: 'per_piece',
  per_kg: 'per_kg',
  per_litre: 'per_litre',
};

const uomFromApi = {
  per_piece: 'Per Piece',
  per_kg: 'Per Kg',
  per_litre: 'Per Litre',
};

function normalizeProduct(product) {
  if (!product) return product;
  return {
    ...product,
    tax: product.taxPercent ?? product.tax ?? 0,
    uom: uomFromApi[product.unitOfMeasure] || product.uom || 'Per Piece',
  };
}

function toApiPayload(payload) {
  return {
    name: payload.name,
    categoryId: payload.categoryId,
    price: Number(payload.price),
    unitOfMeasure: uomToApi[payload.uom || payload.unitOfMeasure] || 'per_piece',
    taxPercent: Number(payload.tax ?? payload.taxPercent ?? 0),
    description: payload.description || null,
    showOnKds: payload.showOnKds ?? true,
  };
}

const productsApi = {
  async getAll(params = {}) {
    const res = okList(await api.get('/products', { params }));
    return { ...res, data: res.data.map(normalizeProduct) };
  },

  async getById(id) {
    return { data: normalizeProduct(data(await api.get(`/products/${id}`))) };
  },

  async create(payload) {
    const res = await api.post('/products', toApiPayload(payload));
    return { data: normalizeProduct(data(res)) };
  },

  async update(id, payload) {
    const res = await api.patch(`/products/${id}`, toApiPayload(payload));
    return { data: normalizeProduct(data(res)) };
  },

  async delete(id) {
    return ok(await api.delete(`/products/${id}`));
  },
};

export default productsApi;
