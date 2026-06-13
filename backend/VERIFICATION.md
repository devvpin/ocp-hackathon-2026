# Verification

## Static Checks

- `node -e "require('./src/app')(); console.log('app ok')"` - passed.
- `npx.cmd prisma validate` - passed.
- `npm.cmd run migrate` - passed with no pending migrations.
- `npm.cmd run seed` - passed.
- Frontend `npm.cmd run build` - passed.
- Password hash audit - no response serialization sites found; matches are limited to hashing/comparison/update code.

## Runtime Smoke Checks

The backend was smoke-tested on a separate local port before the server was stopped manually.

- Admin login - passed.
- Open POS session - passed.
- Create draft order - passed.
- Table occupied after draft order - passed.
- Send order to kitchen - passed.
- KDS order list - passed.
- KDS order stage change to `preparing` - passed.
- KDS item done toggle - passed.
- Cash payment with change calculation - passed.
- Receipt send endpoint - passed in no-SMTP dev mode.
- Reports summary - passed.
- Reports top products - passed.
- Close POS session - passed.

## Implemented Areas

- Auth, logout, current user, password change, self-signup disabled after bootstrap.
- Admin employee provisioning.
- Categories, products, payment methods.
- Floors, tables, table status.
- Users and archive login guard.
- Customers.
- Coupons and coupon validation.
- Promotions and promotion evaluation.
- Sessions.
- Orders, pricing, coupon/promotion discounts, payment, cancellation, receipt email, kitchen send.
- KDS and WebSocket broadcasts.
- Reports.
- README setup and environment documentation.
