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

/**
 * Verifies that the requesting user owns the order or is an admin.
 * Prevents URL manipulation attacks where a user changes the orderId in the URL.
 */
function assertOrderOwner(order, reqUser) {
  if (reqUser.role === 'admin') return;
  if (order.employeeId !== reqUser.sub) {
    throw new AppError('FORBIDDEN', 'You do not have permission to modify this order.');
  }
}

function broadcastTable(tableId, occupied, orderId = null) {
  if (!tableId) return;
  broadcast('table:status_changed', { tableId, occupied, orderId });
}

async function updateTableStatus(tableId) {
  if (!tableId) return;
  const draftOrder = await prisma.order.findFirst({
    where: { tableId, status: 'draft' },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });

  if (draftOrder) {
    broadcastTable(tableId, true, draftOrder.id);
  } else {
    broadcastTable(tableId, false, null);
  }
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
      // Removed check for existing draft order to allow multiple transactions per table

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
    assertOrderOwner(existing, req.user);
    const calculation = await calculateOrder(req.validated.body);
    const order = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
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
          items: { create: calculation.items },
        },
        include: orderInclude(),
      });
    });

    if (existing.tableId && existing.tableId !== order.tableId) await updateTableStatus(existing.tableId);
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
    assertOrderOwner(order, req.user);
    let { paymentMethod, paymentReference, cashReceived } = req.validated.body;

    if (paymentMethod === 'cash') {
      if (cashReceived === undefined || cashReceived === null) {
        cashReceived = Number(order.total);
      }
      if (Number(cashReceived) < Number(order.total) - 0.01) {
        throw new AppError('BAD_REQUEST', 'Cash received cannot be less than order total.');
      }
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

    await updateTableStatus(paid.tableId);
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
    assertOrderOwner(order, req.user);
    const cancelled = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
      include: orderInclude(),
    });

    await updateTableStatus(cancelled.tableId);
    return sendSuccess(res, 200, serializeOrder(cancelled));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const order = await getDraftOrder(req.validated.params.id);
    assertOrderOwner(order, req.user);
    await prisma.order.delete({ where: { id: order.id } });
    await updateTableStatus(order.tableId);
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

    function inr(val) { return '₹' + Number(val || 0).toFixed(2); }
    const rows = order.items.map((item) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#334155">${escapeHtml(item.productName)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center;color:#475569">${item.quantity}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#475569">${inr(item.unitPrice)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#1e293b">${inr(item.lineTotal)}</td>
      </tr>
    `).join('');
    const dateStr = order.createdAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 24px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">${escapeHtml(env.CAFE_NAME)}</h1>
          <p style="margin:6px 0 0;color:#c7d2fe;font-size:13px">Order Receipt</p>
        </div>
        <div style="padding:24px">
          <div style="display:flex;justify-content:space-between;margin-bottom:16px">
            <div>
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em">Order Number</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#1e293b">#${order.orderNumber}</p>
            </div>
            <div style="text-align:right">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em">Date</p>
              <p style="margin:0;font-size:13px;color:#475569">${dateStr}</p>
            </div>
          </div>
          <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;margin-bottom:18px">
            <table style="width:100%;font-size:13px;color:#64748b" cellpadding="0" cellspacing="0">
              <tr><td style="padding:3px 0"><strong>Table:</strong></td><td style="text-align:right">${escapeHtml(order.table?.tableNumber ?? 'N/A')}</td></tr>
              <tr><td style="padding:3px 0"><strong>Customer:</strong></td><td style="text-align:right">${escapeHtml(order.customer?.name ?? 'Guest')}</td></tr>
              <tr><td style="padding:3px 0"><strong>Payment:</strong></td><td style="text-align:right;text-transform:capitalize">${order.paymentMethod ?? 'Unpaid'}</td></tr>
            </table>
          </div>
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:10px 14px;text-align:left;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Item</th>
                <th style="padding:10px 14px;text-align:center;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Qty</th>
                <th style="padding:10px 14px;text-align:right;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Unit Price</th>
                <th style="padding:10px 14px;text-align:right;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="border-top:2px solid #e2e8f0;margin-top:12px;padding-top:12px">
            <table style="width:100%;font-size:13px" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;color:#64748b">Subtotal</td><td style="text-align:right;color:#475569">${inr(order.subtotal)}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Tax</td><td style="text-align:right;color:#475569">${inr(order.taxAmount)}</td></tr>
              ${Number(order.discountAmount) > 0 ? `<tr><td style="padding:4px 0;color:#16a34a">Discount</td><td style="text-align:right;color:#16a34a">-${inr(order.discountAmount)}</td></tr>` : ''}
              <tr><td style="padding:10px 0 4px;font-size:18px;font-weight:700;color:#1e293b;border-top:2px solid #e2e8f0">Total</td><td style="padding:10px 0 4px;text-align:right;font-size:18px;font-weight:700;color:#1e293b;border-top:2px solid #e2e8f0">${inr(order.total)}</td></tr>
            </table>
          </div>
        </div>
        <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#94a3b8">Thank you for dining with us! 🙏</p>
          <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1">${escapeHtml(env.CAFE_NAME)}</p>
        </div>
      </div>
    `;

    await sendMail({ to, subject: `${env.CAFE_NAME} receipt #${order.orderNumber}`, html });
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { receiptSentAt: new Date() },
      include: orderInclude(),
    });

    return sendSuccess(res, 200, { sent: true, order: serializeOrder(updated) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
