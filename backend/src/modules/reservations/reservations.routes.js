'use strict';

const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');
const { logActivity } = require('../../utils/activityLog');
const { z } = require('zod');

const reservationSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  tableId: z.string().uuid().optional().nullable(),
  bookingDate: z.string().datetime(),
  guestCount: z.coerce.number().int().min(1),
  status: z.enum(['pending', 'confirmed', 'arrived', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
});

const updateSchema = reservationSchema.partial();

const idParamSchema = z.object({ id: z.string().uuid() });

function serialize(r) {
  return {
    id: r.id,
    customerId: r.customerId,
    tableId: r.tableId,
    bookingDate: r.bookingDate,
    guestCount: r.guestCount,
    status: r.status,
    notes: r.notes,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    customer: r.customer ? { id: r.customer.id, name: r.customer.name, phone: r.customer.phone } : null,
    table: r.table
      ? {
          id: r.table.id,
          tableNumber: r.table.tableNumber,
          seatCount: r.table.seatCount,
          floorId: r.table.floorId,
          floorName: r.table.floor?.name ?? null,
        }
      : null,
  };
}

async function checkConflict(tableId, bookingDate, excludeId = null) {
  if (!tableId) return;
  // Block bookings within 90 minutes of each other on the same table
  const window = 90 * 60 * 1000;
  const from = new Date(new Date(bookingDate).getTime() - window);
  const to = new Date(new Date(bookingDate).getTime() + window);

  const conflict = await prisma.booking.findFirst({
    where: {
      tableId,
      bookingDate: { gte: from, lte: to },
      status: { notIn: ['cancelled', 'completed'] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (conflict) {
    throw new AppError('CONFLICT', `Table is already booked at ${new Date(conflict.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
  }
}

async function checkSeatCount(tableId, guestCount) {
  if (!tableId) return;
  const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
  if (!table) throw new AppError('NOT_FOUND', 'Table not found.');
  if (guestCount > table.seatCount) {
    throw new AppError('BAD_REQUEST', `Table only has ${table.seatCount} seats but ${guestCount} guests requested.`);
  }
}

// GET /api/reservations
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, date, dateTo, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;

    // Legacy date params (timezone sensitive)
    if (date || dateTo) {
      const from = date ? new Date(new Date(date).setHours(0, 0, 0, 0)) : undefined;
      const to   = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : (date ? new Date(new Date(date).setHours(23, 59, 59, 999)) : undefined);
      where.bookingDate = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    }

    // Exact ISO timestamp filtering (robust against timezones)
    if (startDate || endDate) {
      const from = startDate ? new Date(startDate) : undefined;
      const to   = endDate ? new Date(endDate) : undefined;
      where.bookingDate = { 
        ...(where.bookingDate || {}),
        ...(from ? { gte: from } : {}), 
        ...(to ? { lte: to } : {}) 
      };
    }

    const reservations = await prisma.booking.findMany({
      where,
      include: { customer: true, table: { include: { floor: true } } },
      orderBy: { bookingDate: 'asc' },
    });

    return sendSuccess(res, 200, reservations.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/reservations
router.post('/', requireAuth, validate(reservationSchema, 'body'), async (req, res, next) => {
  try {
    const data = req.validated.body;

    await checkSeatCount(data.tableId, data.guestCount);
    await checkConflict(data.tableId, data.bookingDate);

    const reservation = await prisma.booking.create({
      data: {
        ...data,
        status: data.status || 'pending',
        createdBy: req.user.sub,
      },
      include: { customer: true, table: { include: { floor: true } } },
    });

    logActivity({ userId: req.user.sub, action: 'reservation.created', entityType: 'booking', entityId: reservation.id, metadata: { guestCount: data.guestCount, tableId: data.tableId } });
    return sendSuccess(res, 201, serialize(reservation));
  } catch (err) {
    next(err);
  }
});

// GET /api/reservations/:id
router.get('/:id', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const reservation = await prisma.booking.findUnique({
      where: { id: req.validated.params.id },
      include: { customer: true, table: { include: { floor: true } } },
    });
    if (!reservation) throw new AppError('NOT_FOUND', 'Reservation not found.');
    return sendSuccess(res, 200, serialize(reservation));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reservations/:id
router.patch('/:id', requireAuth, validate(idParamSchema, 'params'), validate(updateSchema, 'body'), async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const data = req.validated.body;

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Reservation not found.');

    const tableId = data.tableId !== undefined ? data.tableId : existing.tableId;
    const guestCount = data.guestCount !== undefined ? data.guestCount : existing.guestCount;
    const bookingDate = data.bookingDate !== undefined ? data.bookingDate : existing.bookingDate;

    await checkSeatCount(tableId, guestCount);
    await checkConflict(tableId, bookingDate, id);

    const reservation = await prisma.booking.update({
      where: { id },
      data,
      include: { customer: true, table: { include: { floor: true } } },
    });

    logActivity({ userId: req.user.sub, action: 'reservation.updated', entityType: 'booking', entityId: id, metadata: { status: data.status } });
    return sendSuccess(res, 200, serialize(reservation));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Reservation not found.');

    await prisma.booking.delete({ where: { id } });
    logActivity({ userId: req.user.sub, action: 'reservation.deleted', entityType: 'booking', entityId: id });
    return sendSuccess(res, 200, { deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
