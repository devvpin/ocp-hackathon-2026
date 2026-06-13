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
  id: z.string().uuid('Invalid customer id.'),
});

const customerCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('Email must be valid.').toLowerCase().optional().nullable(),
  phone: z.string().trim().min(1, 'Phone cannot be empty.').optional().nullable(),
});

const customerUpdateSchema = customerCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

function serializeCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    createdAt: customer.createdAt,
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const where = {};

    if (req.query.search) {
      const search = String(req.query.search);
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return sendList(res, customers.map(serializeCustomer), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin', 'employee'), validate(customerCreateSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.create({ data: req.validated.body });
    return sendSuccess(res, 201, serializeCustomer(customer));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin', 'employee'),
  validate(idParamSchema, 'params'),
  validate(customerUpdateSchema),
  async (req, res, next) => {
    try {
      const customer = await prisma.customer.update({
        where: { id: req.validated.params.id },
        data: req.validated.body,
      });

      return sendSuccess(res, 200, serializeCustomer(customer));
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: req.validated.params.id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
