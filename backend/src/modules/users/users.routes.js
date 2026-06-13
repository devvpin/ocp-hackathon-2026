'use strict';

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sendSuccess, sendList } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const router = Router();
const PASSWORD_COST = 12;

const idParamSchema = z.object({
  id: z.string().uuid('Invalid user id.'),
});

const userCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('Email must be valid.').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['admin', 'employee']),
});

const userUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').optional(),
  email: z.string().trim().email('Email must be valid.').toLowerCase().optional(),
  role: z.enum(['admin', 'employee']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required.' }
);

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isArchived: user.isArchived,
    createdAt: user.createdAt,
  };
}

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const where = {};

    if (req.query.role) {
      where.role = String(req.query.role);
    }

    if (req.query.archived !== undefined) {
      where.isArchived = String(req.query.archived).toLowerCase() === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return sendList(res, users.map(serializeUser), buildMeta(pagination, total));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin'), validate(userCreateSchema), async (req, res, next) => {
  try {
    const { password, ...data } = req.validated.body;
    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash: await bcrypt.hash(password, PASSWORD_COST),
      },
    });

    return sendSuccess(res, 201, serializeUser(user));
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(userUpdateSchema),
  async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.validated.params.id },
        data: req.validated.body,
      });

      return sendSuccess(res, 200, serializeUser(user));
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id/password',
  requireAuth,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(passwordSchema),
  async (req, res, next) => {
    try {
      await prisma.user.update({
        where: { id: req.validated.params.id },
        data: {
          passwordHash: await bcrypt.hash(req.validated.body.password, PASSWORD_COST),
        },
      });

      return sendSuccess(res, 200, { changed: true });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch('/:id/archive', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const existing = await prisma.user.findUniqueOrThrow({ where: { id: req.validated.params.id } });
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { isArchived: !existing.isArchived },
    });

    return sendSuccess(res, 200, serializeUser(user));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.validated.params.id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
