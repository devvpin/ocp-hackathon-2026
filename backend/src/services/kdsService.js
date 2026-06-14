'use strict';

const prisma = require('../config/db');
const { broadcast } = require('../websocket');
const { updateTableStatus } = require('./tableService');
const { AppError } = require('../middleware/errorHandler');
const { changeOrderStatus } = require('./orderService');
const { logActivity } = require('../utils/activityLog');

async function startPreparing(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { product: true }
  });

  if (items.length === 0) {
    throw new AppError('NOT_FOUND', 'Order has no items.');
  }

  await prisma.orderItem.updateMany({
    where: { orderId },
    data: { kdsStage: 'preparing' }
  });

  await changeOrderStatus(orderId, 'preparing', null, 'Kitchen started preparation');

  broadcast('kds:stage_changed', { orderId, newStage: 'preparing' });
  broadcast('order:preparing', { orderId });
  logActivity({ action: 'kds.preparing', entityType: 'order', entityId: orderId });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order && order.tableId) {
    await updateTableStatus(order.tableId);
  }

  return { orderId, newStage: 'preparing' };
}

async function markReady(orderId) {
  await prisma.orderItem.updateMany({
    where: { orderId },
    data: { kdsStage: 'ready' }
  });

  await changeOrderStatus(orderId, 'ready', null, 'Kitchen marked order as ready');

  await prisma.order.update({
    where: { id: orderId },
    data: { kitchenCompleted: true },
  });

  broadcast('kds:stage_changed', { orderId, newStage: 'ready' });
  broadcast('order:ready', { orderId });
  broadcast('order:kitchen_completed', { orderId });
  logActivity({ action: 'kds.ready', entityType: 'order', entityId: orderId });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order && order.tableId) {
    await updateTableStatus(order.tableId);
  }

  return { orderId, newStage: 'ready' };
}

async function markCompleted(orderId) {
  await prisma.orderItem.updateMany({
    where: { orderId },
    data: { kdsStage: 'completed' }
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { kitchenCompleted: true }
  });

  // Depending on flow, completing in KDS might mean it's ready or served.
  // We'll leave order status as is or change to ready if it's not already.
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order.status !== 'ready' && order.status !== 'served' && order.status !== 'paid' && order.status !== 'completed') {
    await changeOrderStatus(orderId, 'ready', null, 'Kitchen marked order as completed');
  }

  broadcast('kds:stage_changed', { orderId, newStage: 'completed' });
  broadcast('order:kitchen_completed', { orderId });
  logActivity({ action: 'kds.completed', entityType: 'order', entityId: orderId });

  if (order && order.tableId) {
    await updateTableStatus(order.tableId);
  }

  return { orderId, newStage: 'completed' };
}

async function determineKitchenCompletion(orderId) {
  const allItems = await prisma.orderItem.findMany({
    where: { orderId, product: { showOnKds: true } },
  });

  if (allItems.length > 0 && allItems.every(i => i.kdsItemDone)) {
    // Auto advance to ready when all items are done
    return await markReady(orderId);
  }
  return false;
}

async function toggleItemDone(itemId) {
  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError('NOT_FOUND', 'Kitchen item not found.');

  const updated = await prisma.orderItem.update({
    where: { id: item.id },
    data: { kdsItemDone: !item.kdsItemDone },
    include: {
      product: {
        include: { category: true }
      }
    }
  });

  broadcast('kds:item_done', {
    itemId: updated.id,
    orderId: updated.orderId,
    done: updated.kdsItemDone,
  });
  logActivity({ action: updated.kdsItemDone ? 'kds.item_done' : 'kds.item_undone', entityType: 'order_item', entityId: updated.id, metadata: { orderId: updated.orderId } });

  await determineKitchenCompletion(updated.orderId);

  return updated;
}

module.exports = { startPreparing, markReady, markCompleted, toggleItemDone, determineKitchenCompletion };
