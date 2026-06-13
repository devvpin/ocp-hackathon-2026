/**
 * app.js — Express application factory.
 *
 * Wires together:
 *   - Global middleware (CORS, JSON body parser, request logger)
 *   - API routes (health + all modules)
 *   - 404 not-found handler
 *   - Global error handler
 *
 * The HTTP server is created in server.js (so the WebSocket server
 * can share the same underlying http.Server instance).
 */

'use strict';

const express = require('express');
const morgan = require('morgan');

const corsMiddleware = require('./config/cors');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// ── Routes ────────────────────────────────────────────────────────────────────
const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const productsRoutes = require('./modules/products/products.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const paymentMethodsRoutes = require('./modules/payment-methods/payment-methods.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const floorsRoutes = require('./modules/floors/floors.routes');
const tablesRoutes = require('./modules/tables/tables.routes');
const tableRequestsRoutes = require('./modules/table-requests/table-requests.routes');
const usersRoutes = require('./modules/users/users.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const couponsRoutes = require('./modules/coupons/coupons.routes');
const promotionsRoutes = require('./modules/promotions/promotions.routes');
const sessionsRoutes = require('./modules/sessions/sessions.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const kdsRoutes = require('./modules/kds/kds.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const publicRoutes = require('./modules/public/public.routes');
const reservationsRoutes = require('./modules/reservations/reservations.routes');

// ── App factory ───────────────────────────────────────────────────────────────

function createApp() {
  const app = express();

  // ── Global middleware ──────────────────────────────────────────────────────

  // CORS — must be first so pre-flight OPTIONS requests are handled
  app.use(corsMiddleware);

  // Parse JSON bodies
  app.use(express.json());

  // HTTP request logger (skip in test environments)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // ── API Routes ─────────────────────────────────────────────────────────────

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/payment-methods', paymentMethodsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/floors', floorsRoutes);
  app.use('/api/tables', tablesRoutes);
  app.use('/api/table-requests', tableRequestsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/coupons', couponsRoutes);
  app.use('/api/promotions', promotionsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/kds', kdsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/reservations', reservationsRoutes);

  // ── Error handling (must come last) ───────────────────────────────────────

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
