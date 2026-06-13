'use strict';

const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { z } = require('zod');

const reservationSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  tableId: z.string().uuid().optional().nullable(),
  bookingDate: z.string().datetime(),
  guestCount: z.number().int().min(1),
  status: z.enum(['pending', 'confirmed', 'arrived', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable()
});

const updateSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  tableId: z.string().uuid().optional().nullable(),
  bookingDate: z.string().datetime().optional(),
  guestCount: z.number().int().min(1).optional(),
  status: z.enum(['pending', 'confirmed', 'arrived', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable()
});

const idParamSchema = z.object({
  id: z.string().uuid()
});

// GET /api/reservations
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, date } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.bookingDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const reservations = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        table: true
      },
      orderBy: { bookingDate: 'asc' }
    });
    
    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

// POST /api/reservations
router.post('/', requireAuth, validate(reservationSchema, 'body'), async (req, res, next) => {
  try {
    const data = req.validated.body;
    
    // Check if table exists
    if (data.tableId) {
      const table = await prisma.diningTable.findUnique({ where: { id: data.tableId } });
      if (!table) return res.status(404).json({ error: { message: 'Table not found' } });
    }

    const reservation = await prisma.booking.create({
      data: {
        ...data,
        status: data.status || 'pending'
      },
      include: { customer: true, table: true }
    });
    
    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
});

// GET /api/reservations/:id
router.get('/:id', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const reservation = await prisma.booking.findUnique({
      where: { id: req.validated.params.id },
      include: { customer: true, table: true }
    });
    if (!reservation) return res.status(404).json({ error: { message: 'Reservation not found' } });
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

// PUT /api/reservations/:id
router.put('/:id', requireAuth, validate(idParamSchema, 'params'), validate(updateSchema, 'body'), async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const data = req.validated.body;
    
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Reservation not found' } });

    if (data.tableId) {
      const table = await prisma.diningTable.findUnique({ where: { id: data.tableId } });
      if (!table) return res.status(404).json({ error: { message: 'Table not found' } });
    }

    const reservation = await prisma.booking.update({
      where: { id },
      data,
      include: { customer: true, table: true }
    });
    
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Reservation not found' } });

    await prisma.booking.delete({ where: { id } });
    res.json({ success: true, message: 'Reservation deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
