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
  id: z.string().uuid('Invalid payment method id.'),
});

const paymentMethodUpdateSchema = z.object({
  isEnabled: z.boolean().optional(),
  upiId: z.string().trim().min(1, 'UPI ID cannot be empty.').optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

function serializePaymentMethod(paymentMethod) {
  return {
    id: paymentMethod.id,
    method: paymentMethod.method,
    isEnabled: paymentMethod.isEnabled,
    upiId: paymentMethod.upiId,
  };
}

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { method: 'asc' },
    });

    return sendSuccess(res, 200, paymentMethods.map(serializePaymentMethod));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(paymentMethodUpdateSchema),
  async (req, res, next) => {
    try {
      const id = req.validated.params.id;
      const existing = await prisma.paymentMethod.findUnique({ where: { id } });

      if (!existing) {
        throw new AppError('NOT_FOUND', 'Payment method not found.');
      }

      const data = { ...req.validated.body };
      if (existing.method !== 'upi' && Object.prototype.hasOwnProperty.call(data, 'upiId')) {
        throw new AppError('BAD_REQUEST', 'UPI ID can only be set on the UPI payment method.');
      }

      const paymentMethod = await prisma.paymentMethod.update({
        where: { id },
        data,
      });

      return sendSuccess(res, 200, serializePaymentMethod(paymentMethod));
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
