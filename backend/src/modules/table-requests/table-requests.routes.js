'use strict';

const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');
const { broadcast } = require('../../websocket');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid request id.'),
});

// GET /api/table-requests (active requests only by default)
router.get('/', requireAuth, requireRole('admin', 'employee'), async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    
    const requests = await prisma.tableRequest.findMany({
      where: status === 'all' ? {} : { status },
      include: {
        table: {
          include: { floor: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 200, requests.map(r => ({
      id: r.id,
      tableId: r.tableId,
      tableNumber: r.table.tableNumber,
      floorName: r.table.floor?.name,
      type: r.type,
      status: r.status,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/table-requests/:id/resolve
router.patch('/:id/resolve', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const tableRequest = await prisma.tableRequest.findUnique({
      where: { id: req.validated.params.id },
      include: { table: true }
    });

    if (!tableRequest) throw new AppError('NOT_FOUND', 'Table request not found.');
    if (tableRequest.status === 'resolved') {
      return sendSuccess(res, 200, { resolved: true, alreadyResolved: true });
    }

    const updated = await prisma.tableRequest.update({
      where: { id: tableRequest.id },
      data: { status: 'resolved' },
      include: {
        table: {
          include: { floor: true }
        }
      }
    });

    // Broadcast that request was resolved
    broadcast('table:request_resolved', {
      requestId: updated.id,
      tableId: updated.tableId,
    });

    return sendSuccess(res, 200, {
      id: updated.id,
      status: updated.status,
      resolved: true
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
