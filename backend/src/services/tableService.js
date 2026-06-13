'use strict';

const prisma = require('../config/db');
const { broadcast } = require('../websocket');

const UI_TO_DB_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  PREPARING: 'preparing',
  READY_TO_SERVE: 'ready_to_serve',
  COMPLETED: 'completed',
};

function toDbStatus(uiStatus) {
  const normalized = String(uiStatus).toLowerCase();
  if (['available', 'occupied', 'preparing', 'ready_to_serve', 'completed'].includes(normalized)) {
    return normalized;
  }
  return UI_TO_DB_STATUS[uiStatus] || 'available';
}

async function getTableStatusData(tableId) {
  if (!tableId) return { occupied: false, tableStatus: 'available', orderId: null, orderStatus: null, customerName: null };

  const activeOrder = await prisma.order.findFirst({
    where: {
      tableId,
      status: { notIn: ['cancelled', 'refunded'] }, // Consider all active orders until table is explicitly freed
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeOrder || activeOrder.status === 'completed') {
    return { occupied: false, tableStatus: 'available', orderId: null, orderStatus: null, customerName: null, guests: 0 };
  }

  const customerName = activeOrder.customer?.name || null;
  let tableStatus = 'occupied';
  
  if (['sent_to_kitchen', 'preparing'].includes(activeOrder.status)) {
    tableStatus = 'preparing';
  } else if (activeOrder.status === 'ready') {
    tableStatus = 'ready_to_serve';
  } else if (['served', 'paid'].includes(activeOrder.status)) {
    tableStatus = 'completed';
  }

  return {
    occupied: true,
    tableStatus,
    orderId: activeOrder.id,
    orderStatus: activeOrder.status,
    customerName,
    guests: activeOrder.guests || 0,
  };
}

async function updateTableStatus(tableId) {
  if (!tableId) return;
  const data = await getTableStatusData(tableId);

  const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
  const newDbStatus = toDbStatus(data.tableStatus);

  if (table && (table.status !== newDbStatus || table.occupiedSeats !== data.guests)) {
    await prisma.$transaction(async (tx) => {
      await tx.diningTable.update({
        where: { id: tableId },
        data: { 
          status: newDbStatus,
          occupiedSeats: data.guests || 0,
        },
      });
      if (table.status !== newDbStatus) {
        await tx.tableStatusHistory.create({
          data: {
            tableId,
            oldStatus: table.status,
            newStatus: newDbStatus,
          },
        });
      }
    });
  }

  broadcastTable(tableId, data.tableStatus, data.orderId, data.orderStatus, data.customerName);
}

function broadcastTable(tableId, tableStatus, orderId = null, orderStatus = null, customerName = null, guests = 0) {
  if (!tableId) return;
  broadcast('table:status_changed', {
    tableId,
    occupied: tableStatus !== 'available',
    tableStatus,
    orderId,
    orderStatus,
    customerName,
    guests,
  });
}

module.exports = { updateTableStatus, broadcastTable, getTableStatusData };
