'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const validate = require('../../middleware/validate');
const { sendSuccess, sendList } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

const router = Router();

const itemSchema = z.object({
  productId: z.string().uuid('Invalid product id.'),
  quantity: z.coerce.number().int().positive('Quantity must be positive.'),
});

const publicOrderWriteSchema = z.object({
  tableId: z.string().uuid('Invalid table id.'),
  items: z.array(itemSchema).min(1, 'At least one item is required.'),
});

const tableRequestSchema = z.object({
  type: z.enum(['waiter', 'water', 'bill', 'clean']),
});

function serializeProduct(product) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    taxPercent: Number(product.taxPercent),
    unitOfMeasure: product.unitOfMeasure,
    showOnKds: product.showOnKds,
  };
}

function serializeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
  };
}

router.get('/menu', async (_req, res, next) => {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.product.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return sendSuccess(res, 200, {
      categories: categories.map(serializeCategory),
      products: products.map(serializeProduct),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/orders', validate(publicOrderWriteSchema), async (req, res, next) => {
  try {
    const orderService = require('../../services/orderService');
    const order = await orderService.createPublicOrder(req.validated.body);
    
    return sendSuccess(res, 201, {
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: order.status
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/tables/:id', async (req, res, next) => {
  try {
    const table = await prisma.diningTable.findUnique({
      where: { id: req.params.id },
      include: { floor: true },
    });
    if (!table) throw new AppError('NOT_FOUND', 'Table not found.');

    return sendSuccess(res, 200, {
      id: table.id,
      number: table.tableNumber,
      floorName: table.floor.name,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/tables/:id/requests', validate(tableRequestSchema, 'body'), async (req, res, next) => {
  try {
    const tableId = req.params.id;
    const { type } = req.validated.body;

    const table = await prisma.diningTable.findUnique({
      where: { id: tableId },
      include: { floor: true }
    });
    if (!table) throw new AppError('NOT_FOUND', 'Table not found.');

    const request = await prisma.tableRequest.create({
      data: {
        tableId,
        type,
        status: 'pending'
      }
    });

    const { broadcast } = require('../../websocket');
    broadcast('table:request_created', {
      id: request.id,
      tableId,
      tableNumber: table.tableNumber,
      floorName: table.floor?.name,
      type,
      status: request.status,
      createdAt: request.createdAt,
    });

    return sendSuccess(res, 201, { success: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
