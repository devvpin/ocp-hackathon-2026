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
  id: z.string().uuid('Invalid product id.'),
});

const productCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  categoryId: z.string().uuid('Invalid category id.'),
  price: z.coerce.number().positive('Price must be greater than zero.'),
  unitOfMeasure: z.enum(['per_piece', 'per_kg', 'per_litre']),
  taxPercent: z.coerce.number().min(0, 'Tax percent cannot be negative.').max(100, 'Tax percent cannot exceed 100.'),
  description: z.string().trim().optional().nullable(),
  showOnKds: z.boolean().optional(),
});

const productUpdateSchema = productCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

function serializeCategory(category) {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    color: category.color,
  };
}

function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    price: Number(product.price),
    unitOfMeasure: product.unitOfMeasure,
    taxPercent: Number(product.taxPercent),
    description: product.description,
    showOnKds: product.showOnKds,
    createdAt: product.createdAt,
    category: serializeCategory(product.category),
  };
}

function productInclude() {
  return {
    category: {
      select: { id: true, name: true, color: true },
    },
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const where = {};

    if (req.query.categoryId) {
      where.categoryId = String(req.query.categoryId);
    }

    if (req.query.search) {
      where.name = { contains: String(req.query.search), mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: productInclude(),
      }),
      prisma.product.count({ where }),
    ]);

    return sendList(res, products.map(serializeProduct), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.validated.params.id },
      include: productInclude(),
    });

    if (!product) {
      throw new AppError('NOT_FOUND', 'Product not found.');
    }

    return sendSuccess(res, 200, serializeProduct(product));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin'), validate(productCreateSchema), async (req, res, next) => {
  try {
    const product = await prisma.product.create({
      data: req.validated.body,
      include: productInclude(),
    });

    return sendSuccess(res, 201, serializeProduct(product));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(productUpdateSchema),
  async (req, res, next) => {
    try {
      const product = await prisma.product.update({
        where: { id: req.validated.params.id },
        data: req.validated.body,
        include: productInclude(),
      });

      return sendSuccess(res, 200, serializeProduct(product));
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const draftItemCount = await prisma.orderItem.count({
      where: {
        productId: id,
        order: { status: 'draft' },
      },
    });

    if (draftItemCount > 0) {
      throw new AppError('CONFLICT', 'Product cannot be deleted while referenced by draft orders.');
    }

    await prisma.product.delete({ where: { id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
