'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const env = require('../../config/env');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess, sendList } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { sendMail } = require('../../utils/email');
const { broadcast } = require('../../websocket');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid order id.'),
});

const itemSchema = z.object({
  productId: z.string().uuid('Invalid product id.'),
  quantity: z.coerce.number().int().positive('Quantity must be positive.'),
});

const orderWriteSchema = z.object({
  tableId: z.string().uuid('Invalid table id.').optional().nullable(),
  customerId: z.string().uuid('Invalid customer id.').optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one item is required.'),
  couponCode: z.string().trim().min(1).optional().nullable(),
  promotionIds: z.array(z.string().uuid('Invalid promotion id.')).optional(),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'upi']),
  paymentReference: z.string().trim().optional().nullable(),
  cashReceived: z.coerce.number().optional(),
});

const receiptSchema = z.object({
  email: z.string().email('Email must be valid.').optional(),
});

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function serializeItem(item) {
  return {
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
  };
}

function serializeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    sessionId: order.sessionId,
    tableId: order.tableId,
    customerId: order.customerId,
    couponId: order.couponId,
    employeeId: order.employeeId,
    status: order.status,
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    receiptSentAt: order.receiptSentAt,
    table: order.table,
    customer: order.customer,
    coupon: order.coupon,
    items: Array.isArray(order.items) ? order.items.map(serializeItem) : undefined,
  };
}

function orderInclude() {
  return {
    items: true,
    table: true,
    customer: true,
    coupon: true,
  };
}

async function getOpenSession() {
  const session = await prisma.session.findFirst({
    where: { isOpen: true },
    orderBy: { openedAt: 'desc' },
  });

  if (!session) {
    throw new AppError('SESSION_NOT_OPEN', 'Open a POS session before creating or paying orders.');
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

    couponId = coupon.id;
    discountAmount += coupon.discountType === 'percentage'
      ? subtotal * (Number(coupon.discountValue) / 100)
      : Number(coupon.discountValue);
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

function broadcastTable(tableId, occupied, orderId = null) {
  if (!tableId) return;
  broadcast('table:status_changed', { tableId, occupied, orderId });
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const openSession = await prisma.session.findFirst({ where: { isOpen: true } });
    const where = {};

    if (req.query.sessionId) where.sessionId = String(req.query.sessionId);
    else if (openSession) where.sessionId = openSession.id;
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.search) {
      const orderNumber = Number(req.query.search);
      where.OR = Number.isNaN(orderNumber) ? [] : [{ orderNumber }];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: orderInclude(),
      }),
      prisma.order.count({ where }),
    ]);

    return sendList(res, orders.map(serializeOrder), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.validated.params.id },
      include: orderInclude(),
    });

    if (!order) throw new AppError('NOT_FOUND', 'Order not found.');
    return sendSuccess(res, 200, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin', 'employee'), validate(orderWriteSchema), async (req, res, next) => {
  try {
    const session = await getOpenSession();
    const calculation = await calculateOrder(req.validated.body);
    const tableId = req.validated.body.tableId || null;
    const order = await prisma.$transaction(async (tx) => {
      if (tableId) {
        const existing = await tx.order.findFirst({
          where: { tableId, status: 'draft' },
          select: { id: true },
        });

        if (existing) {
          throw new AppError('TABLE_OCCUPIED', 'Table already has a draft order.');
        }
      }

      return tx.order.create({
        data: {
          sessionId: session.id,
          tableId,
          customerId: req.validated.body.customerId || null,
          couponId: calculation.couponId,
          employeeId: req.user.sub,
          status: 'draft',
          subtotal: calculation.subtotal,
          taxAmount: calculation.taxAmount,
          discountAmount: calculation.discountAmount,
          total: calculation.total,
          items: { create: calculation.items },
        },
        include: orderInclude(),
      });
    });

    broadcastTable(order.tableId, true, order.id);
    return sendSuccess(res, 201, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), validate(orderWriteSchema), async (req, res, next) => {
  try {
    await getOpenSession();
    const existing = await getDraftOrder(req.validated.params.id);
    const calculation = await calculateOrder(req.validated.body);
    const order = await prisma.$transaction(async (tx) => {
      const existingItemsByProduct = new Map(existing.items.map(i => [i.productId, i]));
      const newItems = [];
      const updateItems = [];
      const keepItemIds = new Set();

      for (const item of calculation.items) {
        const ext = existingItemsByProduct.get(item.productId);
        if (ext) {
          keepItemIds.add(ext.id);
          updateItems.push({ id: ext.id, data: item });
        } else {
          newItems.push(item);
        }
      }

      const itemsToDelete = existing.items.filter(i => !keepItemIds.has(i.id)).map(i => i.id);

      if (itemsToDelete.length > 0) {
        await tx.orderItem.deleteMany({ where: { id: { in: itemsToDelete } } });
      }
      for (const updateItem of updateItems) {
        await tx.orderItem.update({ where: { id: updateItem.id }, data: updateItem.data });
      }
      if (newItems.length > 0) {
        await tx.orderItem.createMany({ data: newItems.map(item => ({ ...item, orderId: existing.id })) });
      }

      return tx.order.update({
        where: { id: existing.id },
        data: {
          tableId: req.validated.body.tableId || null,
          customerId: req.validated.body.customerId || null,
          couponId: calculation.couponId,
          subtotal: calculation.subtotal,
          taxAmount: calculation.taxAmount,
          discountAmount: calculation.discountAmount,
          total: calculation.total,
        },
        include: orderInclude(),
      });
    });

    if (existing.tableId && existing.tableId !== order.tableId) broadcastTable(existing.tableId, false, null);
    broadcastTable(order.tableId, true, order.id);
    return sendSuccess(res, 200, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/pay', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), validate(paymentSchema), async (req, res, next) => {
  try {
    await getOpenSession();
    const order = await getDraftOrder(req.validated.params.id);
    const { paymentMethod, paymentReference, cashReceived } = req.validated.body;

    if (paymentMethod === 'cash' && Number(cashReceived || 0) < Number(order.total)) {
      throw new AppError('BAD_REQUEST', 'Cash received cannot be less than order total.');
    }
    if ((paymentMethod === 'card' || paymentMethod === 'upi') && !paymentReference) {
      throw new AppError('BAD_REQUEST', 'Payment reference is required for card and UPI payments.');
    }

    const paid = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: order.id, status: 'draft' },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod,
          paymentReference: paymentReference || null,
        },
      });

      if (result.count !== 1) {
        throw new AppError('PAYMENT_ALREADY_PROCESSED', 'Order payment has already been processed.');
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: orderInclude(),
      });
    });

    broadcastTable(paid.tableId, false, paid.id);
    return sendSuccess(res, 200, {
      ...serializeOrder(paid),
      changeAmount: paymentMethod === 'cash' ? money(Number(cashReceived) - Number(order.total)) : undefined,
    });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/cancel', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const order = await getDraftOrder(req.validated.params.id);
    const cancelled = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
      include: orderInclude(),
    });

    broadcastTable(cancelled.tableId, false, cancelled.id);
    return sendSuccess(res, 200, serializeOrder(cancelled));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const order = await getDraftOrder(req.validated.params.id);
    await prisma.order.delete({ where: { id: order.id } });
    broadcastTable(order.tableId, false, null);
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/send-kitchen', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.validated.params.id },
      include: {
        ...orderInclude(),
        items: { include: { product: true } },
      },
    });

    if (!order) throw new AppError('NOT_FOUND', 'Order not found.');
    const items = order.items
      .filter((item) => item.product.showOnKds)
      .map((item) => serializeItem(item));

    broadcast('kds:order_received', { orderId: order.id, tableId: order.tableId, items });
    return sendSuccess(res, 200, { sent: true, orderId: order.id, items });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/send-receipt', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), validate(receiptSchema), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.validated.params.id },
      include: orderInclude(),
    });

    if (!order) throw new AppError('NOT_FOUND', 'Order not found.');
    const to = req.validated.body.email || order.customer?.email;
    if (!to) throw new AppError('BAD_REQUEST', 'Receipt email address is required.');

    const rows = order.items.map((item) => `
      <tr><td>${escapeHtml(item.productName)}</td><td>${item.quantity}</td><td>${Number(item.unitPrice).toFixed(2)}</td><td>${Number(item.lineTotal).toFixed(2)}</td></tr>
    `).join('');
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h2>${escapeHtml(env.CAFE_NAME)}</h2>
        <p><strong>Order:</strong> #${order.orderNumber}</p>
        <p><strong>Date:</strong> ${order.createdAt.toISOString()}</p>
        <p><strong>Table:</strong> ${escapeHtml(order.table?.tableNumber ?? 'N/A')}</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customer?.name ?? 'Guest')}</p>
        <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">
          <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p>Subtotal: ${Number(order.subtotal).toFixed(2)}</p>
        <p>Tax: ${Number(order.taxAmount).toFixed(2)}</p>
        <p>Discount: ${Number(order.discountAmount).toFixed(2)}</p>
        <h3>Total: ${Number(order.total).toFixed(2)}</h3>
        <p>Payment: ${order.paymentMethod ?? 'Unpaid'}</p>
      </div>
    `;

    const sent = await sendMail({ to, subject: `${env.CAFE_NAME} receipt #${order.orderNumber}`, html });
    let updated = order;
    
    if (sent) {
      updated = await prisma.order.update({
        where: { id: order.id },
        data: { receiptSentAt: new Date() },
        include: orderInclude(),
      });
    }

    return sendSuccess(res, 200, { sent, order: serializeOrder(updated) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
