const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const prisma = require('../../config/db');
const env = require('../../config/env');
const { requireAuth } = require('../../middleware/auth');
const { AppError } = require('../../middleware/errorHandler');
const { broadcast } = require('../../websocket');
const { updateTableStatus } = require('../../services/tableService');
const { logActivity } = require('../../utils/activityLog');
const orderService = require('../../services/orderService');

const router = express.Router();

const razorpay = env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : null;

router.use(requireAuth);

router.post('/razorpay/create-order', async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new AppError('BAD_REQUEST', 'Order ID is required.');
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Order not found.');
    }

    if (order.status === 'paid' || order.status === 'completed') {
      throw new AppError('BAD_REQUEST', 'Order is already paid.');
    }

    if (!razorpay) {
      throw new AppError('BAD_REQUEST', 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment.');
    }

    const amount = Math.max(1, Math.round(Number(order.total) * 100));
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: order.id,
      notes: {
        orderId: order.id,
        orderNumber: String(order.orderNumber),
        tableId: order.tableId || '',
      },
    });

    return res.status(201).json({
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.id,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/razorpay/verify', async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('BAD_REQUEST', 'Missing Razorpay payment details.');
    }

    if (!env.RAZORPAY_KEY_SECRET) {
      throw new AppError('BAD_REQUEST', 'Razorpay secret is not configured.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new AppError('BAD_REQUEST', 'Invalid Razorpay signature.');
    }

    const result = await orderService.payOrder(orderId, {
      paymentMethod: 'card',
      paymentReference: razorpayPaymentId,
    }, req.user);

    return res.status(200).json({
      ok: true,
      orderId,
      paymentId: razorpayPaymentId,
      order: result.paid,
    });
  } catch (err) {
    next(err);
  }
});

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
