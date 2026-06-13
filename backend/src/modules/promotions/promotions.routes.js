'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sendSuccess, sendList } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid promotion id.'),
});

const promotionBaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  appliedTo: z.enum(['product', 'order']),
  productId: z.string().uuid('Invalid product id.').optional().nullable(),
  minQuantity: z.coerce.number().int().positive('Minimum quantity must be positive.').optional().nullable(),
  minOrderAmount: z.coerce.number().min(0, 'Minimum order amount cannot be negative.').optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be greater than zero.'),
  isActive: z.boolean().optional(),
});

function validatePromotionShape(data, ctx) {
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Percentage discount cannot exceed 100.',
    });
  }

  if (data.appliedTo === 'product') {
    if (!data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productId'],
        message: 'Product promotions require productId.',
      });
    }

    if (data.minOrderAmount !== undefined && data.minOrderAmount !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minOrderAmount'],
        message: 'Product promotions cannot use minOrderAmount.',
      });
    }
  }

  if (data.appliedTo === 'order') {
    if (data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productId'],
        message: 'Order promotions cannot use productId.',
      });
    }

    if (data.minQuantity !== undefined && data.minQuantity !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minQuantity'],
        message: 'Order promotions cannot use minQuantity.',
      });
    }
  }
}

const promotionCreateSchema = promotionBaseSchema.superRefine(validatePromotionShape);

const promotionUpdateSchema = promotionBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

const promotionEvaluateSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product id.'),
    qty: z.coerce.number().int().positive('Quantity must be positive.'),
  })).default([]),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative.'),
});

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function calculateDiscount(discountType, discountValue, amount) {
  if (discountType === 'percentage') {
    return money(amount * (Number(discountValue) / 100));
  }

  return money(Math.min(Number(discountValue), amount));
}

function serializePromotion(promotion) {
  return {
    id: promotion.id,
    name: promotion.name,
    appliedTo: promotion.appliedTo,
    productId: promotion.productId,
    minQuantity: promotion.minQuantity,
    minOrderAmount: promotion.minOrderAmount === null ? null : Number(promotion.minOrderAmount),
    discountType: promotion.discountType,
    discountValue: Number(promotion.discountValue),
    isActive: promotion.isActive,
    product: promotion.product
      ? {
          id: promotion.product.id,
          name: promotion.product.name,
          price: Number(promotion.product.price),
        }
      : undefined,
  };
}

async function buildPromotionUpdateData(id, patch) {
  const existing = await prisma.promotion.findUniqueOrThrow({ where: { id } });
  const merged = { ...existing, ...patch };

  const check = promotionBaseSchema.superRefine(validatePromotionShape).safeParse({
    name: merged.name,
    appliedTo: merged.appliedTo,
    productId: merged.productId,
    minQuantity: merged.minQuantity,
    minOrderAmount: merged.minOrderAmount === null ? null : Number(merged.minOrderAmount),
    discountType: merged.discountType,
    discountValue: Number(merged.discountValue),
    isActive: merged.isActive,
  });

  if (!check.success) {
    const error = check.error;
    error.name = 'ZodError';
    throw error;
  }

  return patch;
}

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
        include: { product: true },
      }),
      prisma.promotion.count(),
    ]);

    return sendList(res, promotions.map(serializePromotion), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin'), validate(promotionCreateSchema), async (req, res, next) => {
  try {
    const promotion = await prisma.promotion.create({
      data: {
        ...req.validated.body,
        isActive: req.validated.body.isActive ?? true,
      },
      include: { product: true },
    });

    return sendSuccess(res, 201, serializePromotion(promotion));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(promotionUpdateSchema),
  async (req, res, next) => {
    try {
      const data = await buildPromotionUpdateData(req.validated.params.id, req.validated.body);
      const promotion = await prisma.promotion.update({
        where: { id: req.validated.params.id },
        data,
        include: { product: true },
      });

      return sendSuccess(res, 200, serializePromotion(promotion));
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    await prisma.promotion.delete({ where: { id: req.validated.params.id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/evaluate', requireAuth, requireRole('admin', 'employee'), validate(promotionEvaluateSchema), async (req, res, next) => {
  try {
    const { items, subtotal } = req.validated.body;
    const cartByProduct = new Map(items.map((item) => [item.productId, item.qty]));
    const productIds = [...cartByProduct.keys()];

    const [promotions, products] = await Promise.all([
      prisma.promotion.findMany({
        where: { isActive: true },
        include: { product: true },
      }),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, name: true },
      }),
    ]);

    const productsById = new Map(products.map((product) => [product.id, product]));
    const applicableDiscounts = [];

    for (const promotion of promotions) {
      if (promotion.appliedTo === 'product') {
        const qty = cartByProduct.get(promotion.productId);
        if (!qty) continue;
        if (promotion.minQuantity && qty < promotion.minQuantity) continue;

        const product = productsById.get(promotion.productId);
        if (!product) continue;

        const lineAmount = Number(product.price) * qty;
        applicableDiscounts.push({
          promotionId: promotion.id,
          name: promotion.name,
          appliedTo: promotion.appliedTo,
          productId: promotion.productId,
          productName: product.name,
          discountType: promotion.discountType,
          discountValue: Number(promotion.discountValue),
          discountAmount: calculateDiscount(promotion.discountType, promotion.discountValue, lineAmount),
        });
      }

      if (promotion.appliedTo === 'order') {
        if (promotion.minOrderAmount !== null && Number(subtotal) < Number(promotion.minOrderAmount)) continue;

        applicableDiscounts.push({
          promotionId: promotion.id,
          name: promotion.name,
          appliedTo: promotion.appliedTo,
          discountType: promotion.discountType,
          discountValue: Number(promotion.discountValue),
          discountAmount: calculateDiscount(promotion.discountType, promotion.discountValue, subtotal),
        });
      }
    }

    return sendSuccess(res, 200, { applicableDiscounts });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
