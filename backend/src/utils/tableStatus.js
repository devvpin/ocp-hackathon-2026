'use strict';

const prisma = require('../config/db');
const { broadcast } = require('../websocket');

/**
 * Broadcasts a table occupancy event to all WS clients.
 */
function broadcastTable(tableId, occupied, orderId = null, orderStatus = null) {
  if (!tableId) return;
  broadcast('table:status_changed', { tableId, occupied, orderId, orderStatus });
}

/**
 * Re-evaluates a table's occupancy and broadcasts the result.
 *
 * A table is considered occupied when:
 *   1. There is at least one open (draft) order for the table, OR
 *   2. There is a paid order where at least one KDS item (showOnKds = true)
 *      has not yet reached the 'completed' stage.
 */
async function updateTableStatus(tableId) {
  if (!tableId) return;

  // 1. Check for a draft order first
  const draftOrder = await prisma.order.findFirst({
    where: { tableId, status: 'draft' },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });

  if (draftOrder) {
    broadcastTable(tableId, true, draftOrder.id, 'draft');
    return;
  }

  // 2. Check for paid orders with uncompleted KDS items
  const activePaidOrders = await prisma.order.findMany({
    where: { tableId, status: 'paid' },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });

  for (const order of activePaidOrders) {
    const kdsItems = order.items.filter((item) => item.product.showOnKds);
    if (kdsItems.length > 0) {
      const hasUncompletedItems = kdsItems.some((item) => item.kdsStage !== 'completed');
      if (hasUncompletedItems) {
        broadcastTable(tableId, true, order.id, 'paid');
        return;
      }
    }
  }

  // 3. Nothing occupying the table
  broadcastTable(tableId, false, null, null);
}

module.exports = { updateTableStatus, broadcastTable };
