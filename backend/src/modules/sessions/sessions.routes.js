'use strict';

const { Router } = require('express');
const { Prisma } = require('@prisma/client');
const { z } = require('zod');

const prisma = require('../../config/db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess } = require('../../utils/response');
const { logActivity } = require('../../utils/activityLog');

const router = Router();

const idParamSchema = z.object({
  id: z.string().uuid('Invalid session id.'),
});

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function serializeSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    openedBy: session.openedBy,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    isOpen: session.isOpen,
    closingRevenue: session.closingRevenue === null ? null : Number(session.closingRevenue),
  };
}

async function computeRevenue(sessionId) {
  const paidOrders = await prisma.order.findMany({
    where: { sessionId, status: 'paid' },
    select: { total: true },
  });

  return money(paidOrders.reduce((sum, order) => sum + Number(order.total), 0));
}

router.get('/current', requireAuth, async (_req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: { isOpen: true },
      orderBy: { openedAt: 'desc' },
    });

    return sendSuccess(res, 200, serializeSession(session));
  } catch (err) {
    return next(err);
  }
});

router.get('/latest', requireAuth, async (_req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: { isOpen: false },
      orderBy: { closedAt: 'desc' },
    });

    return sendSuccess(res, 200, serializeSession(session));
  } catch (err) {
    return next(err);
  }
});

router.post('/open', requireAuth, requireRole('admin', 'employee'), async (req, res, next) => {
  try {
    const session = await prisma.$transaction(async (tx) => {
      const openSession = await tx.session.findFirst({
        where: { isOpen: true },
        select: { id: true },
      });

      if (openSession) {
        throw new AppError('SESSION_ALREADY_OPEN', 'A POS session is already open.');
      }

      return tx.session.create({
        data: {
          openedBy: req.user.sub,
          isOpen: true,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    logActivity({ userId: req.user.sub, action: 'session.opened', entityType: 'session', entityId: session.id });
    return sendSuccess(res, 201, serializeSession(session));
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/close', requireAuth, requireRole('admin', 'employee'), validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const session = await prisma.session.findUnique({ where: { id } });

    if (!session) {
      throw new AppError('NOT_FOUND', 'Session not found.');
    }

    if (!session.isOpen) {
      throw new AppError('BAD_REQUEST', 'Session is already closed.');
    }

    const closingRevenue = await computeRevenue(id);
    const closed = await prisma.session.update({
      where: { id },
      data: {
        isOpen: false,
        closedAt: new Date(),
        closingRevenue,
      },
    });

    const orderCount = await prisma.order.count({ where: { sessionId: id, status: 'paid' } });

    logActivity({ userId: req.user.sub, action: 'session.closed', entityType: 'session', entityId: id, metadata: { revenue: closingRevenue, orderCount } });
    return sendSuccess(res, 200, {
      ...serializeSession(closed),
      orderCount,
      revenue: closingRevenue,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
