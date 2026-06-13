'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess } = require('../../utils/response');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid table id.'),
});

const tableUpdateSchema = z.object({
  floorId: z.string().uuid('Invalid floor id.').optional(),
  tableNumber: z.coerce.number().int().positive('Table number must be positive.').optional(),
  seatCount: z.coerce.number().int().positive('Seat count must be positive.').optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

function serializeTable(table) {
  return {
    id: table.id,
    floorId: table.floorId,
    tableNumber: table.tableNumber,
    seatCount: table.seatCount,
    isActive: table.isActive,
  };
}

router.get('/:id', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const table = await prisma.diningTable.findUnique({ where: { id: req.validated.params.id } });

    if (!table) {
      throw new AppError('NOT_FOUND', 'Table not found.');
    }

    return sendSuccess(res, 200, serializeTable(table));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/status', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const table = await prisma.diningTable.findUnique({ where: { id } });

    if (!table) {
      throw new AppError('NOT_FOUND', 'Table not found.');
    }

    let activeOrder = await prisma.order.findFirst({
      where: {
        tableId: id,
        status: 'draft',
      },
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true,
        status: true,
        customer: { select: { name: true } }
      },
    });

    if (!activeOrder) {
      const activePaidOrders = await prisma.order.findMany({
        where: { tableId: id, status: 'paid' },
        include: { items: { include: { product: true } }, customer: true },
        orderBy: { createdAt: 'desc' },
      });

      for (const order of activePaidOrders) {
        const kdsItems = order.items.filter((item) => item.product.showOnKds);
        if (kdsItems.length > 0) {
          const hasUncompletedItems = kdsItems.some((item) => item.kdsStage !== 'completed');
          if (hasUncompletedItems) {
            activeOrder = {
              id: order.id,
              status: order.status,
              customer: order.customer ? { name: order.customer.name } : null,
            };
            break;
          }
        }
      }
    }

    return sendSuccess(res, 200, {
      occupied: Boolean(activeOrder),
      orderId: activeOrder?.id ?? null,
      orderStatus: activeOrder?.status ?? null,
      customerName: activeOrder?.customer?.name ?? null,
    });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(tableUpdateSchema),
  async (req, res, next) => {
    try {
      const table = await prisma.diningTable.update({
        where: { id: req.validated.params.id },
        data: req.validated.body,
      });

      return sendSuccess(res, 200, serializeTable(table));
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    await prisma.diningTable.delete({ where: { id: req.validated.params.id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
