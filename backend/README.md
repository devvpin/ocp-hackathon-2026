# Odoo Cafe POS Backend

Express + Prisma backend for the cafe POS, admin panel, and kitchen display.

## Stack

- Node.js 20+
- Express 4
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Zod validation
- ws WebSocket server
- Nodemailer receipt email via Mailtrap

## Setup

```powershell
npm install
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev
```

The seeded admin is:

```text
admin@cafe.com
Admin@1234
```

## Environment

Copy `.env.example` to `.env` and adjust values:

```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/cafe_pos
JWT_SECRET=change_me
JWT_EXPIRY=8h
FRONTEND_URL=http://localhost:5173
# Mailtrap
MAILTRAP_TOKEN=
EMAIL_FROM=noreply@cafedemo.com
CAFE_NAME=Odoo Cafe
```

## URLs

- REST API: `http://localhost:4000/api`
- WebSocket: `ws://localhost:4000/ws`
- Health: `GET /api/health`

## Roles

- `admin`: full backend access, user provisioning, catalog, reporting.
- `employee`: POS workflows such as sessions, customers, orders, payments.
- KDS endpoints are open for the display surface.

Employees do not self-sign up. An admin creates employee accounts through `POST /api/users` and shares credentials with staff.

## Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/change-password`

`POST /api/auth/signup` is only for first-admin bootstrap. Once any user exists, self-signup returns `403`.

Tokens are JWT access tokens sent as:

```text
Authorization: Bearer <token>
```

## Implemented Areas

- Auth and RBAC
- Users and employee provisioning
- Categories, products, payment methods
- Floors, tables, table status
- Customers
- Coupons and promotions
- POS sessions
- Orders, pricing, payment, receipts
- KDS and WebSocket events
- Reports
