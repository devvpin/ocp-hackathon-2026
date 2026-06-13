'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess } = require('../../utils/response');
const { broadcast } = require('../../websocket');

const router = Router();

const orderIdParamSchema = z.object({
  orderId: z.string().uuid('Invalid order id.'),
});

const itemIdParamSchema = z.object({
  itemId: z.string().uuid('Invalid item id.'),
});

const stageSchema = z.object({
  stage: z.enum(['preparing', 'completed']),
});

const stageOrder = {
  to_cook: 0,
  preparing: 1,
  completed: 2,
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
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        createdAt: order.createdAt,
        items: [],
      });
    }

    grouped.get(order.id).items.push(serializeKdsItem(item));
  }

  return [...grouped.values()];
}

router.get('/orders', async (req, res, next) => {
  try {
    const where = {
      order: { status: 'draft' },
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
    const orderId = req.validated.params.orderId;
    const newStage = req.validated.body.stage;
    const items = await prisma.orderItem.findMany({ where: { orderId } });

    if (items.length === 0) {
      throw new AppError('NOT_FOUND', 'Order has no kitchen items.');
    }

    const minCurrentStage = Math.min(...items.map((item) => stageOrder[item.kdsStage]));
    if (stageOrder[newStage] !== minCurrentStage + 1) {
      throw new AppError('INVALID_KDS_TRANSITION', 'KDS stage can only move forward one step.');
    }

    await prisma.orderItem.updateMany({
      where: { orderId },
      data: {
        kdsStage: newStage,
        kdsItemDone: newStage === 'completed' ? true : undefined,
      },
    });

    broadcast('kds:stage_changed', { orderId, newStage });
    return sendSuccess(res, 200, { orderId, newStage });
  } catch (err) {
    return next(err);
  }
});

router.patch('/items/:itemId/done', validate(itemIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const item = await prisma.orderItem.findUnique({ where: { id: req.validated.params.itemId } });
    if (!item) throw new AppError('NOT_FOUND', 'Kitchen item not found.');

    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: { kdsItemDone: !item.kdsItemDone },
    });

    broadcast('kds:item_done', {
      itemId: updated.id,
      orderId: updated.orderId,
      done: updated.kdsItemDone,
    });

    return sendSuccess(res, 200, serializeKdsItem(updated));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
