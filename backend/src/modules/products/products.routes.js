'use strict';

const { Router } = require('express');
const prisma = require('../../config/db');
const { requireAuth } = require('../../middleware/auth');
const { sendList } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const { limit, skip } = pagination;
    const where = {};

    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }

    if (req.query.search) {
      where.name = { contains: req.query.search, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return sendList(res, products, buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
