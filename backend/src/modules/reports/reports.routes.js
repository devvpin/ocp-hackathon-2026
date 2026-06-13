'use strict';

const { Router } = require('express');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess } = require('../../utils/response');

const router = Router();

router.use(requireAuth, requireRole('admin'));

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function dateRange(query) {
  const now = new Date();
  const period = query.period || 'today';
  let from;
  let to = new Date(now);

  if (period === 'custom') {
    if (!query.from || !query.to) {
      throw new AppError('VALIDATION_ERROR', 'from and to are required for custom reports.');
    }
    from = new Date(query.from);
    to = new Date(query.to);
  } else if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 1);
  } else {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  }

  return { from, to };
}

function paidOrderWhere(query) {
  const { from, to } = dateRange(query);
  const where = {
    status: 'paid',
    paidAt: { gte: from, lte: to },
  };

  if (query.employeeId) where.employeeId = String(query.employeeId);
  if (query.sessionId) where.sessionId = String(query.sessionId);
  if (query.productId) where.items = { some: { productId: String(query.productId) } };

  return where;
}

function bucketKey(date, groupBy) {
  const d = new Date(date);
  if (groupBy === 'hour') return d.toISOString().slice(0, 13) + ':00:00.000Z';
  if (groupBy === 'week') {
    const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const days = Math.floor((d - first) / 86400000);
    const week = Math.ceil((days + first.getUTCDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return d.toISOString().slice(0, 10);
}

router.get('/summary', async (req, res, next) => {
  try {
    const where = paidOrderWhere(req.query);
    const [totalOrders, aggregate] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { total: true } }),
    ]);
    const revenue = money(aggregate._sum.total);

    return sendSuccess(res, 200, {
      totalOrders,
      revenue,
      avgOrderValue: totalOrders ? money(revenue / totalOrders) : 0,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/sales-trend', async (req, res, next) => {
  try {
    const groupBy = req.query.groupBy || 'day';
    const orders = await prisma.order.findMany({
      where: paidOrderWhere(req.query),
      select: { paidAt: true, total: true },
      orderBy: { paidAt: 'asc' },
    });
    const buckets = new Map();

    for (const order of orders) {
      const key = bucketKey(order.paidAt, groupBy);
      const current = buckets.get(key) || { period: key, totalOrders: 0, revenue: 0 };
      current.totalOrders += 1;
      current.revenue = money(current.revenue + Number(order.total));
      buckets.set(key, current);
    }

    return sendSuccess(res, 200, [...buckets.values()]);
  } catch (err) {
    return next(err);
  }
});

router.get('/top-products', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const items = await prisma.orderItem.findMany({
      where: { order: paidOrderWhere(req.query) },
      include: { product: true },
    });
    const grouped = new Map();

    for (const item of items) {
      const current = grouped.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue = money(current.revenue + Number(item.lineTotal));
      grouped.set(item.productId, current);
    }

    return sendSuccess(res, 200, [...grouped.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit));
  } catch (err) {
    return next(err);
  }
});

router.get('/top-categories', async (req, res, next) => {
  try {
    const items = await prisma.orderItem.findMany({
      where: { order: paidOrderWhere(req.query) },
      include: { product: { include: { category: true } } },
    });
    const grouped = new Map();

    for (const item of items) {
      const category = item.product.category;
      const current = grouped.get(category.id) || {
        categoryId: category.id,
        categoryName: category.name,
        revenue: 0,
        quantity: 0,
      };
      current.revenue = money(current.revenue + Number(item.lineTotal));
      current.quantity += item.quantity;
      grouped.set(category.id, current);
    }

    return sendSuccess(res, 200, [...grouped.values()].sort((a, b) => b.revenue - a.revenue));
  } catch (err) {
    return next(err);
  }
});

router.get('/top-orders', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: paidOrderWhere(req.query),
      orderBy: { total: 'desc' },
      take: 10,
      include: { customer: true, table: true },
    });

    return sendSuccess(res, 200, orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      paidAt: order.paidAt,
      customer: order.customer,
      table: order.table,
    })));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
