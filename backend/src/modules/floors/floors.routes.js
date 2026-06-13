'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sendSuccess } = require('../../utils/response');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid floor id.'),
});

const floorTableParamSchema = z.object({
  floorId: z.string().uuid('Invalid floor id.'),
});

const floorCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
});

const tableCreateSchema = z.object({
  tableNumber: z.coerce.number().int().positive('Table number must be positive.'),
  seatCount: z.coerce.number().int().positive('Seat count must be positive.'),
  isActive: z.boolean().optional(),
});

function serializeTable(table) {
  return {
    id: table.id,
    floorId: table.floorId,
    tableNumber: table.tableNumber,
    seatCount: table.seatCount,
    isActive: table.isActive,
  };
}

function serializeFloor(floor) {
  return {
    id: floor.id,
    name: floor.name,
    tables: Array.isArray(floor.tables) ? floor.tables.map(serializeTable) : undefined,
  };
}

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const floors = await prisma.floor.findMany({
      orderBy: { name: 'asc' },
      include: {
        tables: {
          orderBy: { tableNumber: 'asc' },
        },
      },
    });

    return sendSuccess(res, 200, floors.map(serializeFloor));
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireRole('admin'), validate(floorCreateSchema), async (req, res, next) => {
  try {
    const floor = await prisma.floor.create({
      data: req.validated.body,
      include: { tables: true },
    });

    return sendSuccess(res, 201, serializeFloor(floor));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    await prisma.floor.delete({ where: { id: req.validated.params.id } });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/:floorId/tables',
  requireAuth,
  validate(floorTableParamSchema, 'params'),
  validate(tableCreateSchema),
  async (req, res, next) => {
    try {
      const table = await prisma.diningTable.create({
        data: {
          floorId: req.validated.params.floorId,
          tableNumber: req.validated.body.tableNumber,
          seatCount: req.validated.body.seatCount,
          isActive: req.validated.body.isActive ?? true,
        },
      });

      return sendSuccess(res, 201, serializeTable(table));
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
