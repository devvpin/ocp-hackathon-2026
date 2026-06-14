'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess } = require('../../utils/response');
const { broadcast } = require('../../websocket');
const { updateTableStatus } = require('../../services/tableService');

const router = Router();

router.use(requireAuth, requireRole('admin', 'employee'));

const orderIdParamSchema = z.object({
  orderId: z.string().uuid('Invalid order id.'),
});

const itemIdParamSchema = z.object({
  itemId: z.string().uuid('Invalid item id.'),
});

const stageSchema = z.object({
  stage: z.enum(['preparing', 'ready', 'completed']),
});

const stageOrder = {
  to_cook: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
};

function serializeKdsItem(item) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    kdsStage: item.kdsStage,
    kdsItemDone: item.kdsItemDone,
    category: item.product?.category
      ? {
          id: item.product.category.id,
          name: item.product.category.name,
          color: item.product.category.color,
        }
      : null,
  };
}

function groupItems(items) {
  const grouped = new Map();

  for (const item of items) {
    const order = item.order;
    if (!grouped.has(order.id)) {
      grouped.set(order.id, {
        id: order.id,
        orderNumber: String(order.orderNumber),
        tableId: order.tableId,
        createdAt: order.createdAt,
        stage: item.kdsStage,
        items: [],
      });
    }

    grouped.get(order.id).items.push({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      completed: item.kdsItemDone,
      category: item.product?.category
        ? {
            id: item.product.category.id,
            name: item.product.category.name,
            color: item.product.category.color,
          }
        : null,
    });
  }

  const result = [...grouped.values()];
  for (const order of result) {
    const stageValues = { to_cook: 0, preparing: 1, ready: 2, completed: 3 };
    // Find the minimum stage of all items
    const minStage = Object.keys(stageValues).reduce((min, stage) => {
      const hasStage = items.some(i => i.orderId === order.id && i.kdsStage === stage);
      if (hasStage && stageValues[stage] < stageValues[min]) return stage;
      return min;
    }, 'completed');
    order.stage = minStage;
  }

  return result;
}

router.get('/orders', async (req, res, next) => {
  try {
    const where = {
      order: {
        status: { in: ['sent_to_kitchen', 'preparing', 'ready', 'served', 'paid'] },
      },
      product: { showOnKds: true },
    };

    if (req.query.stage) where.kdsStage = String(req.query.stage);
    if (req.query.productId) where.productId = String(req.query.productId);
    if (req.query.categoryId) where.product = { showOnKds: true, categoryId: String(req.query.categoryId) };

    const items = await prisma.orderItem.findMany({
      where,
      orderBy: [{ order: { createdAt: 'asc' } }, { productName: 'asc' }],
      include: {
        order: true,
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return sendSuccess(res, 200, groupItems(items));
  } catch (err) {
    return next(err);
  }
});

router.patch('/orders/:orderId/stage', validate(orderIdParamSchema, 'params'), validate(stageSchema), async (req, res, next) => {
  try {
    const kdsService = require('../../services/kdsService');
    const orderId = req.validated.params.orderId;
    const newStage = req.validated.body.stage;
    
    if (newStage === 'preparing') {
      const result = await kdsService.startPreparing(orderId);
      return sendSuccess(res, 200, result);
    } else if (newStage === 'ready') {
      const result = await kdsService.markReady(orderId);
      return sendSuccess(res, 200, result);
    } else if (newStage === 'completed') {
      const result = await kdsService.markCompleted(orderId);
      return sendSuccess(res, 200, result);
    } else {
      throw new AppError('INVALID_KDS_TRANSITION', 'Invalid transition stage.');
    }
  } catch (err) {
    return next(err);
  }
});

router.patch('/items/:itemId/done', validate(itemIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const kdsService = require('../../services/kdsService');
    const updated = await kdsService.toggleItemDone(req.validated.params.itemId);
    return sendSuccess(res, 200, serializeKdsItem(updated));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
