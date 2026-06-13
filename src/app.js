'use strict';

const express = require('express');
const morgan = require('morgan');

const corsMiddleware = require('./config/cors');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// ── Routes ────────────────────────────────────────────────────────────────────
const healthRoutes = require('./modules/health/health.routes');

// Phase 2
const authRoutes = require('./modules/auth/auth.routes');

// Phase 3
const productsRoutes = require('./modules/products/products.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const paymentMethodsRoutes = require('./modules/payment-methods/payment-methods.routes');

// Phase 4
const floorsRoutes = require('./modules/floors/floors.routes');
const tablesRoutes = require('./modules/tables/tables.routes');
const usersRoutes = require('./modules/users/users.routes');
const customersRoutes = require('./modules/customers/customers.routes');

// Phase 5
const couponsRoutes = require('./modules/coupons/coupons.routes');
const promotionsRoutes = require('./modules/promotions/promotions.routes');

// Phase 6
const sessionsRoutes = require('./modules/sessions/sessions.routes');
const ordersRoutes = require('./modules/orders/orders.routes');

// Phase 8
const kdsRoutes = require('./modules/kds/kds.routes');

// Phase 9
const reportsRoutes = require('./modules/reports/reports.routes');

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

  // Auth (Phase 2)
  app.use('/api/auth', authRoutes);

  // Catalogue (Phase 3)
  app.use('/api/products', productsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/payment-methods', paymentMethodsRoutes);

  // Floor plan & Users & Customers (Phase 4)
  app.use('/api/floors', floorsRoutes);
  app.use('/api/tables', tablesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/customers', customersRoutes);

  // Promotions & Coupons (Phase 5)
  app.use('/api/coupons', couponsRoutes);
  app.use('/api/promotions', promotionsRoutes);

  // POS Engine (Phase 6)
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/orders', ordersRoutes);

  // KDS (Phase 8)
  app.use('/api/kds', kdsRoutes);

  // Reports (Phase 9)
  app.use('/api/reports', reportsRoutes);

  // ── Error handling (must come last) ───────────────────────────────────────

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
