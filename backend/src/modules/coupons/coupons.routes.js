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
  id: z.string().uuid('Invalid coupon id.'),
});

const couponBaseSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.').transform((value) => value.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be greater than zero.'),
  isActive: z.boolean().optional(),
});

function validateCouponShape(data, ctx) {
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Percentage discount cannot exceed 100.',
    });
  }
}

const couponCreateSchema = couponBaseSchema.superRefine(validateCouponShape);

const couponUpdateSchema = couponBaseSchema.partial().superRefine(validateCouponShape).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

const couponValidateSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.').transform((value) => value.toUpperCase()),
  orderSubtotal: z.coerce.number().min(0, 'Order subtotal cannot be negative.'),
});

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function calculateDiscount(discountType, discountValue, subtotal) {
  if (discountType === 'percentage') {
    return money(subtotal * (Number(discountValue) / 100));
  }

  return money(Math.min(Number(discountValue), subtotal));
}

function serializeCoupon(coupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    isActive: coupon.isActive,
  };
}

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { code: 'asc' },
      }),
      prisma.coupon.count(),
    ]);

    return sendList(res, coupons.map(serializeCoupon), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin'), validate(couponCreateSchema), async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        ...req.validated.body,
        isActive: req.validated.body.isActive ?? true,
      },
    });

    return sendSuccess(res, 201, serializeCoupon(coupon));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(couponUpdateSchema),
  async (req, res, next) => {
    try {
      const coupon = await prisma.coupon.update({
        where: { id: req.validated.params.id },
        data: req.validated.body,
      });

      return sendSuccess(res, 200, serializeCoupon(coupon));
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.validated.params.id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/validate', requireAuth, requireRole('admin', 'employee'), validate(couponValidateSchema), async (req, res, next) => {
  try {
    const { code, orderSubtotal } = req.validated.body;
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      return sendSuccess(res, 200, { valid: false, discountAmount: 0 });
    }

    return sendSuccess(res, 200, {
      valid: true,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: calculateDiscount(coupon.discountType, coupon.discountValue, orderSubtotal),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
