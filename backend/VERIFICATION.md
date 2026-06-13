# Verification

## Database Schema & Seed

- `npx.cmd prisma validate` - passed.
- `npm.cmd run migrate` - passed; no pending migrations.
- `npm.cmd run seed` - passed.
- Schema enhancements migration - passed.
- `npx.cmd prisma generate` - passed after schema enhancements.

Schema enhancements applied:

- `orders.order_number` is unique.
- `sessions.is_open` tracks open/closed state.
- `customers.email` is unique when present.
- `orders.receipt_sent_at` tracks receipt email delivery.
- `orders.coupon_id` relates orders to applied coupons.
- `bookings` table added with customer, table, booking date, guest count, status, notes, and timestamps.

## Authentication & Authorization

- `node -e "require('./src/app')(); console.log('app ok')"` - passed.
- `node src/server.js` - passed startup; command was intentionally stopped by timeout after the server printed the HTTP and WS URLs.

Implemented behavior:

- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/logout`
- `PATCH /api/auth/change-password`
- JWT payload `{ sub, role, email, name }` with configured 8 hour expiry.
- `requireAuth` and `requireRole(...roles)`.
- In-memory logout blacklist.
- `/api/auth/*` rate limit of 10 requests per 15 minutes per IP.
- Archived user login guard returning `ACCOUNT_ARCHIVED`.

## Catalog & Payment Methods

- Login with seeded admin - passed.
- `POST /api/categories` - passed.
- `GET /api/categories` - passed.
- `PATCH /api/categories/:id` - passed.
- `DELETE /api/categories/:id` while a product references it - passed with `409`.
- `DELETE /api/categories/:id` after product cleanup - passed.
- `POST /api/products` - passed.
- `GET /api/products/:id` - passed with nested category.
- `GET /api/products?categoryId=&search=` - passed.
- `PATCH /api/products/:id` - passed.
- `DELETE /api/products/:id` - passed.
- `GET /api/payment-methods` - passed, returned three methods.
- `PATCH /api/payment-methods/:id` for UPI - passed, persisted `isEnabled` and `upiId`.
