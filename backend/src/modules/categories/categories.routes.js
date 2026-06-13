'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess, sendList } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid category id.'),
});

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #3B82F6.'),
});

const categoryUpdateSchema = categoryCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

function serializeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    createdAt: category.createdAt,
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      prisma.category.count(),
    ]);

    return sendList(res, categories.map(serializeCategory), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin'), validate(categoryCreateSchema), async (req, res, next) => {
  try {
    const category = await prisma.category.create({ data: req.validated.body });
    return sendSuccess(res, 201, serializeCategory(category));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(categoryUpdateSchema),
  async (req, res, next) => {
    try {
      const category = await prisma.category.update({
        where: { id: req.validated.params.id },
        data: req.validated.body,
      });

      return sendSuccess(res, 200, serializeCategory(category));
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const productCount = await prisma.product.count({ where: { categoryId: id } });

    if (productCount > 0) {
      throw new AppError('CONFLICT', 'Category cannot be deleted while products reference it.');
    }

    await prisma.category.delete({ where: { id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
