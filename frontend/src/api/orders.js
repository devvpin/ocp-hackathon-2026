import api from './axios';

function unwrapList(response) {
  const payload = response.data;
  // Support both envelope { data: [...] } and flat array
  return { data: Array.isArray(payload.data) ? payload.data : payload };
}

function unwrapOne(response) {
  const payload = response.data;
  return { data: payload.data ?? payload };
}

const ordersApi = {
  async getAll(params = {}) {
    const response = await api.get('/orders', { params });
    const list = unwrapList(response);
    // Normalise field names coming from backend serializer
    list.data = list.data.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      sessionId: o.sessionId,
      tableId: o.tableId,
      tableNumber: o.table?.tableNumber ?? null,
      customerId: o.customerId,
      customerName: o.customer?.name ?? null,
      customerEmail: o.customer?.email ?? null,
      status: o.status,
      subtotal: Number(o.subtotal),
      tax: Number(o.taxAmount),
      discount: Number(o.discountAmount),
      total: Number(o.total),
      paymentMethod: o.paymentMethod,
      date: o.createdAt,
      paidAt: o.paidAt,
      items: (o.items || []).map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.productName,
        price: Number(i.unitPrice),
        quantity: i.quantity,
        total: Number(i.lineTotal),
        tax: Number(i.taxPercent),
      })),
    }));
    return list;
  },

  async getById(id) {
    const response = await api.get(`/orders/${id}`);
    const o = unwrapOne(response).data;
    return {
      data: {
        id: o.id,
        orderNumber: o.orderNumber,
        sessionId: o.sessionId,
        tableId: o.tableId,
        tableNumber: o.table?.tableNumber ?? null,
        customerId: o.customerId,
        customerName: o.customer?.name ?? null,
        customerEmail: o.customer?.email ?? null,
        status: o.status,
        subtotal: Number(o.subtotal),
        tax: Number(o.taxAmount),
        discount: Number(o.discountAmount),
        total: Number(o.total),
        paymentMethod: o.paymentMethod,
        date: o.createdAt,
        paidAt: o.paidAt,
        items: (o.items || []).map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.productName,
          price: Number(i.unitPrice),
          quantity: i.quantity,
          total: Number(i.lineTotal),
          tax: Number(i.taxPercent),
        })),
      },
    };
  },

  async create(data) {
    // Backend expects { tableId, customerId, items: [{productId, quantity}], couponCode? }
    const payload = {
      tableId: data.tableId || null,
      customerId: data.customerId || null,
      items: (data.items || []).map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
    if (data.couponCode) payload.couponCode = data.couponCode;
    const response = await api.post('/orders', payload);
    return unwrapOne(response);
  },

  async update(id, data) {
    const payload = {
      tableId: data.tableId || null,
      customerId: data.customerId || null,
      items: (data.items || []).map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
    if (data.couponCode) payload.couponCode = data.couponCode;
    const response = await api.patch(`/orders/${id}`, payload);
    return unwrapOne(response);
  },

  async delete(id) {
    const response = await api.delete(`/orders/${id}`);
    return unwrapOne(response);
  },

  async markPaid(id, paymentMethod, paymentReference = null, cashReceived = null) {
    const payload = { paymentMethod };
    if (paymentReference) payload.paymentReference = paymentReference;
    if (cashReceived !== null) payload.cashReceived = cashReceived;
    const response = await api.patch(`/orders/${id}/pay`, payload);
    return unwrapOne(response);
  },

  async cancel(id) {
    const response = await api.patch(`/orders/${id}/cancel`);
    return unwrapOne(response);
  },

  async sendToKitchen(id) {
    const response = await api.post(`/orders/${id}/send-kitchen`);
    return unwrapOne(response);
  },

  async sendReceipt(id, email) {
    const payload = {};
    if (email) payload.email = email;
    const response = await api.post(`/orders/${id}/send-receipt`, payload);
    return unwrapOne(response);
  },
};

export default ordersApi;
