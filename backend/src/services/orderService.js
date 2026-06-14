'use strict';

const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { broadcast } = require('../websocket');
const { updateTableStatus, broadcastTable } = require('./tableService');
const { logActivity } = require('../utils/activityLog');

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

async function getOpenSession(userId = null) {
  let session = await prisma.session.findFirst({
    where: { isOpen: true },
    orderBy: { openedAt: 'desc' },
  });

  if (!session) {
    let openedBy = userId;
    if (!openedBy) {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (admin) openedBy = admin.id;
    }
    
    if (openedBy) {
      session = await prisma.session.create({
        data: { openedBy, isOpen: true }
      });
    } else {
      throw new AppError('SESSION_NOT_OPEN', 'Open a POS session before creating or paying orders.');
    }
  }

  return session;
}

async function calculateOrder(input) {
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productsById = new Map(products.map((product) => [product.id, product]));

  if (products.length !== productIds.length) {
    throw new AppError('BAD_REQUEST', 'One or more products do not exist.');
  }

  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [
        { appliedTo: 'product', productId: { in: productIds } },
        { appliedTo: 'order' },
      ],
    },
  });

  const productPromotions = promotions.filter((promotion) => promotion.appliedTo === 'product');
  const orderPromotions = promotions.filter((promotion) => promotion.appliedTo === 'order');

  const items = input.items.map((item) => {
    const product = productsById.get(item.productId);
    const gross = money(Number(product.price) * item.quantity);
    const lineDiscount = money(productPromotions
      .filter((promotion) => promotion.productId === item.productId)
      .filter((promotion) => !promotion.minQuantity || item.quantity >= promotion.minQuantity)
      .reduce((sum, promotion) => {
        const discount = promotion.discountType === 'percentage'
          ? gross * (Number(promotion.discountValue) / 100)
          : Number(promotion.discountValue);
        return sum + discount;
      }, 0));
    const cappedLineDiscount = money(Math.min(lineDiscount, gross));
    const lineTotal = money(gross - cappedLineDiscount);

    return {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      taxPercent: product.taxPercent,
      lineDiscount: cappedLineDiscount,
      lineTotal,
    };
  });

  const subtotal = money(items.reduce((sum, item) => sum + item.lineTotal, 0));
  let discountAmount = 0;
  let couponId = null;

  for (const promotion of orderPromotions) {
    if (promotion.minOrderAmount !== null && subtotal < Number(promotion.minOrderAmount)) continue;
    const discount = promotion.discountType === 'percentage'
      ? subtotal * (Number(promotion.discountValue) / 100)
      : Number(promotion.discountValue);
    discountAmount += discount;
  }

  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: input.couponCode.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new AppError('BAD_REQUEST', 'Coupon is invalid or inactive.');
    }

    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
      throw new AppError('BAD_REQUEST', 'Minimum order amount for coupon not met.');
    }

    couponId = coupon.id;
    const remainingSubtotal = Math.max(0, subtotal - discountAmount);
    const couponDiscount = coupon.discountType === 'percentage'
      ? remainingSubtotal * (Number(coupon.discountValue) / 100)
      : Number(coupon.discountValue);
    discountAmount += couponDiscount;
  }

  discountAmount = money(Math.min(discountAmount, subtotal));
  const taxAmount = money(items.reduce(
    (sum, item) => sum + (item.lineTotal * (Number(item.taxPercent) / 100)),
    0
  ));
  const total = money(subtotal - discountAmount + taxAmount);

  return { items, subtotal, discountAmount, taxAmount, total, couponId };
}

async function getDraftOrder(id) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found.');
  if (order.status !== 'draft') throw new AppError('DRAFT_ONLY', 'Only draft orders can be changed.');
  return order;
}

function assertOrderOwner(order, reqUser) {
  if (reqUser.role === 'admin') return;
  if (order.employeeId !== reqUser.sub) {
    throw new AppError('FORBIDDEN', 'You do not have permission to modify this order.');
  }
}

async function createDraft(input, reqUser) {
  const session = await getOpenSession(reqUser.sub);
  const calculation = await calculateOrder(input);
  const tableId = input.tableId || null;
  const orderType = input.orderType || 'dine_in';

  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        sessionId: session.id,
        tableId,
        orderType,
        customerId: input.customerId || null,
        couponId: calculation.couponId,
        employeeId: reqUser.sub,
        status: 'draft',
        subtotal: calculation.subtotal,
        taxAmount: calculation.taxAmount,
        discountAmount: calculation.discountAmount,
        total: calculation.total,
        items: { create: calculation.items },
      },
      include: { items: true, table: true, customer: true, coupon: true },
    });
  });

  await updateTableStatus(order.tableId);
  broadcast('order:created', { orderId: order.id, tableId: order.tableId });
  logActivity({ userId: reqUser.sub, action: 'order.created', entityType: 'order', entityId: order.id, metadata: { total: Number(order.total), tableId: order.tableId, orderType } });
  return order;
}

async function updateDraft(id, input, reqUser) {
  await getOpenSession(reqUser.sub);
  const existing = await getDraftOrder(id);
  assertOrderOwner(existing, reqUser);

  const calculation = await calculateOrder(input);
  const tableId = input.tableId || null;
  const orderType = input.orderType || existing.orderType;

  const order = await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
    return tx.order.update({
      where: { id: existing.id },
      data: {
        tableId,
        orderType,
        customerId: input.customerId || null,
        couponId: calculation.couponId,
        subtotal: calculation.subtotal,
        taxAmount: calculation.taxAmount,
        discountAmount: calculation.discountAmount,
        total: calculation.total,
        items: { create: calculation.items },
      },
      include: { items: true, table: true, customer: true, coupon: true },
    });
  });

  if (existing.tableId && existing.tableId !== order.tableId) {
    await updateTableStatus(existing.tableId);
  }
  await updateTableStatus(order.tableId);
  logActivity({ userId: reqUser.sub, action: 'order.updated', entityType: 'order', entityId: order.id, metadata: { total: Number(order.total) } });
  return order;
}

async function cancelOrder(id, reqUser) {
  const order = await getDraftOrder(id);
  assertOrderOwner(order, reqUser);
  const cancelled = await changeOrderStatus(order.id, 'cancelled', reqUser.sub, 'Cancelled by user');
  logActivity({ userId: reqUser.sub, action: 'order.cancelled', entityType: 'order', entityId: order.id });
  return cancelled;
}

async function changeOrderStatus(id, newStatus, userId, notes = null, requirePrevious = null) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found.');

  if (requirePrevious && order.status !== requirePrevious) {
    throw new AppError('INVALID_STATE', `Order must be in ${requirePrevious} state to transition to ${newStatus}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: { status: newStatus },
      include: { items: { include: { product: true } }, table: true, customer: true, coupon: true },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: order.status,
        newStatus: newStatus,
        changedBy: userId || null,
      }
    });

    return o;
  });

  await updateTableStatus(updated.tableId);
  broadcast(`order:${newStatus}`, { orderId: updated.id, tableId: updated.tableId });
  return updated;
}

async function sendToKitchen(id, reqUser) {
  const order = await getDraftOrder(id);
  assertOrderOwner(order, reqUser);

  const updated = await changeOrderStatus(id, 'sent_to_kitchen', reqUser.sub, 'Sent to Kitchen by POS', 'draft');

  const items = updated.items
    .filter((item) => item.product.showOnKds)
    .map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      taxPercent: Number(item.taxPercent),
      lineDiscount: Number(item.lineDiscount),
      lineTotal: Number(item.lineTotal),
      kdsStage: item.kdsStage,
      kdsItemDone: item.kdsItemDone,
    }));

  broadcast('kds:order_received', { orderId: updated.id, tableId: updated.tableId, items });
  logActivity({ userId: reqUser.sub, action: 'order.sent_to_kitchen', entityType: 'order', entityId: updated.id });
  return updated;
}

async function createPublicOrder(input) {
  const session = await getOpenSession();
  const calculation = await calculateOrder(input);
  const tableId = input.tableId;

  if (!tableId) {
    throw new AppError('BAD_REQUEST', 'Table ID is required for public orders.');
  }

  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        sessionId: session.id,
        tableId,
        customerId: input.customerId || null,
        couponId: calculation.couponId,
        status: 'sent_to_kitchen',
        subtotal: calculation.subtotal,
        taxAmount: calculation.taxAmount,
        discountAmount: calculation.discountAmount,
        total: calculation.total,
        items: { create: calculation.items },
      },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });
  });

  await updateTableStatus(order.tableId);
  broadcast('order:created', { orderId: order.id, tableId: order.tableId });
  broadcast('order:sent_to_kitchen', { orderId: order.id, tableId: order.tableId });

  const kdsItems = order.items
    .filter((item) => item.product.showOnKds)
    .map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      taxPercent: Number(item.taxPercent),
      lineDiscount: Number(item.lineDiscount),
      lineTotal: Number(item.lineTotal),
      kdsStage: item.kdsStage,
      kdsItemDone: item.kdsItemDone,
    }));

  broadcast('kds:order_received', { orderId: order.id, tableId: order.tableId, items: kdsItems });
  return order;
}

async function payOrder(id, input, reqUser) {
  await getOpenSession(reqUser.sub);
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) throw new AppError('NOT_FOUND', 'Order not found.');
  assertOrderOwner(order, reqUser);

  if (!['draft', 'sent_to_kitchen', 'preparing', 'ready', 'served'].includes(order.status)) {
    throw new AppError('INVALID_STATE', `Order in status ${order.status} cannot be paid.`);
  }

  let { paymentMethod, paymentReference, cashReceived } = input;

  if (paymentMethod === 'cash') {
    if (cashReceived === undefined || cashReceived === null) {
      cashReceived = Number(order.total);
    }
    if (Number(cashReceived) < Number(order.total) - 0.01) {
      throw new AppError('BAD_REQUEST', 'Cash received cannot be less than order total.');
    }
  }
  if ((paymentMethod === 'card') && !paymentReference) {
    throw new AppError('BAD_REQUEST', 'Payment reference is required for card payments.');
  }

  const paid = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod,
        paymentReference: paymentReference || null,
      },
      include: { items: true, table: true, customer: true, coupon: true },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: Number(order.total),
        paymentMethod,
        transactionReference: paymentReference || null,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: 'paid',
        changedBy: reqUser.sub || null,
      },
    });
    return o;
  });

  await updateTableStatus(paid.tableId);
  broadcast('order:paid', { orderId: paid.id, tableId: paid.tableId });
  logActivity({ userId: reqUser.sub, action: 'order.paid', entityType: 'order', entityId: paid.id, metadata: { paymentMethod, total: Number(paid.total) } });

  return {
    paid,
    changeAmount: paymentMethod === 'cash' ? money(Number(cashReceived) - Number(order.total)) : undefined,
  };
}

async function refundOrder(id, input, reqUser) {
  if (reqUser.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Only admins can process refunds.');
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found.');

  if (order.status !== 'paid' && order.status !== 'completed') {
    throw new AppError('INVALID_STATE', 'Only paid or completed orders can be refunded.');
  }

  const amountToRefund = input.amount || Number(order.total);

  const refunded = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: { status: 'refunded' },
      include: { items: true, table: true, customer: true, coupon: true },
    });

    await tx.refund.create({
      data: {
        orderId: order.id,
        refundAmount: amountToRefund,
        refundReason: input.reason || 'No reason provided',
        refundedBy: reqUser.sub,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: 'refunded',
        changedBy: reqUser.sub || null,
      },
    });

    return o;
  });

  await updateTableStatus(refunded.tableId);
  broadcast('order:refunded', { orderId: refunded.id, tableId: refunded.tableId });
  logActivity({ userId: reqUser.sub, action: 'order.refunded', entityType: 'order', entityId: refunded.id, metadata: { amount: amountToRefund, reason: input.reason } });

  return refunded;
}

async function serveOrder(orderId, reqUser) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found.');
  assertOrderOwner(order, reqUser);

  if (order.status !== 'ready') {
    throw new AppError('INVALID_STATE', 'Only ready orders can be served.');
  }

  const served = await changeOrderStatus(orderId, 'served', reqUser.sub, 'Order served to customer');
  logActivity({ userId: reqUser.sub, action: 'order.served', entityType: 'order', entityId: orderId });
  return served;
}

module.exports = {
  createDraft,
  updateDraft,
  cancelOrder,
  sendToKitchen,
  payOrder,
  refundOrder,
  getDraftOrder,
  assertOrderOwner,
  createPublicOrder,
  changeOrderStatus,
  serveOrder
};
