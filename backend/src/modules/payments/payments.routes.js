const express = require('express');
const prisma = require('../../config/db');
const { requireAuth } = require('../../middleware/auth');
const { AppError } = require('../../middleware/errorHandler');
const { broadcast } = require('../../websocket');
const { updateTableStatus } = require('../../services/tableService');
const { logActivity } = require('../../utils/activityLog');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const { orderId, amount, paymentMethod, transactionReference } = req.body;

    if (!orderId || !amount || !paymentMethod) {
      throw new AppError('BAD_REQUEST', 'Missing required fields');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 'Order not found');
    }

    if (order.status === 'paid' || order.status === 'completed') {
      throw new AppError('BAD_REQUEST', 'Order is already paid or completed');
    }

    // Process payment and update order
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount: Number(amount),
          paymentMethod,
          transactionReference: transactionReference || null,
        }
      });

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod,
          paymentReference: transactionReference || null,
        },
        include: { items: { include: { product: true } }, table: true, customer: true, coupon: true }
      });

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          oldStatus: order.status,
          newStatus: 'paid',
          changedBy: req.user.sub,
        }
      });

      return { payment, order: updatedOrder };
    });

    if (result.order.tableId) {
      if (order.kitchenCompleted) {
        // Auto free table if order was served
        await prisma.order.update({
          where: { id: orderId },
          data: { tableId: null }
        });
      }
      await updateTableStatus(result.order.tableId);
    }
    
    broadcast('order:paid', { orderId: result.order.id, tableId: result.order.tableId });
    logActivity({ userId: req.user.sub, action: 'order.paid', entityType: 'order', entityId: orderId, metadata: { paymentMethod, amount: Number(amount) } });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
