# ☕ OCP Café POS — Hackathon 2026

A full-stack **Restaurant Point-of-Sale** system built for the OCP Hackathon 2026.
It covers the entire table-service lifecycle — from seating guests through kitchen display, payment, and reporting — in a single monorepo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Vanilla CSS |
| **Backend** | Node.js 20+, Express 4, Prisma 5 (ORM) |
| **Database** | PostgreSQL |
| **Real-time** | WebSocket (`ws`) — live table & KDS updates |
| **Auth** | JWT (access token), bcryptjs password hashing |
| **Payments** | Cash · Card · UPI (Razorpay integration) |

---

## Features

### 🧾 Point of Sale (POS)
- **Floor Map** – visual table grid across multiple floors; live status badges (Available / Occupied / Preparing / Ready)
- **Order management** – add / edit / remove items, apply coupons & promotions, split or merge items
- **Seat guests** – guest-count modal before opening a new order
- **Customer lookup** – attach a customer profile to any order
- **Pickup orders** – support for walk-in / counter orders without a table
- **Payment** – cash, card, and UPI checkout with optional payment reference

### 🍳 Kitchen Display System (KDS)
- Live order queue with per-item stage tracking (To Cook → Preparing → Ready → Done)
- Real-time updates pushed via WebSocket — no polling

### 🪑 Reservations
- Create, confirm, and manage future table bookings
- Reservation badges shown directly on the floor map
- Guest notes (dietary preferences, occasion, etc.)

### 📊 Admin Dashboard
- **Dashboard** – today's revenue, orders, active tables, and top products at a glance
- **Products & Categories** – full CRUD with colour tags and KDS visibility toggle
- **Tables & Floors** – multi-floor layout management
- **Promotions** – product-level and order-level discounts (percentage or fixed)
- **Coupons** – reusable discount codes
- **Users** – create/archive staff accounts with role-based access (admin / employee)
- **POS Sessions** – open / close cash-register sessions; view session revenue
- **Reports** – sales by date range, payment method breakdown, top-selling items
- **Payment Methods** – enable cash, card, UPI, and configure UPI ID

### 🔔 Real-time & Misc
- WebSocket hub broadcasts table status changes and order updates instantly
- Activity log for all significant actions
- In-app notifications

---

## Project Structure

```
ocp/
├── backend/                  # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Demo seed data
│   └── src/
│       ├── modules/          # Feature modules (auth, orders, kds, …)
│       ├── middleware/        # Auth, error handling, rate limiting
│       ├── services/          # Email, Razorpay, etc.
│       ├── websocket/         # WS hub
│       └── server.js
└── frontend/                 # Vite + React app
    └── src/
        ├── api/              # Axios-based API clients
        ├── components/       # Shared UI components
        ├── context/          # Auth, Cart, Session, Toast contexts
        ├── hooks/            # useSocket, etc.
        ├── layout/           # AuthLayout, AdminLayout, EmployeeLayout, KDSLayout
        └── pages/
            ├── auth/         # Login
            ├── admin/        # Dashboard, Products, Reports, …
            ├── pos/          # TableView, Order, Customers, Reservations
            ├── kds/          # Kitchen Display
            └── customer/     # Public customer menu (QR-code flow)
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- PostgreSQL database (local or cloud)

### 1. Clone & install

```bash
git clone <repo-url>
cd ocp

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, etc.
```

### 3. Run database migrations & seed

```bash
cd backend
npx prisma migrate deploy   # or: npm run migrate:dev (for development)
npm run seed
```

### 4. Start the servers

```bash
# Terminal 1 – API (port 4000 by default)
cd backend && npm run dev

# Terminal 2 – Frontend dev server (port 5173 by default)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Default Credentials (Seed)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@cafe.com` | `Admin@1234` |
| **Employee** | `staff@cafe.com` | `Employee@1234` |

---

## Seed Data Overview

Running `npm run seed` (inside `backend/`) populates the database with:

| Entity | Details |
|---|---|
| **Users** | 1 admin, 1 employee |
| **Payment Methods** | Cash, Card, UPI — all enabled |
| **Categories** | Coffee · Beverages · Food · Snacks · Desserts |
| **Products** | 22 menu items with prices and descriptions |
| **Floors** | Main Floor (8 tables) · Rooftop (4 tables) |
| **Customers** | 6 demo customer profiles |
| **Coupons** | `WELCOME10` (10%) · `HAPPY15` (15%) · `FLAT50` (₹50 flat) |
| **Promotions** | Cappuccino Triple Deal · Big Order Discount · Happy Hours Latte |
| **Reservations** | 6 upcoming bookings spread over the next 4 days |

The seed is **fully idempotent** — running it multiple times will not create duplicates.

---

## Key API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/floors` | List floors with tables |
| `GET` | `/api/tables` | List all tables |
| `GET/POST` | `/api/orders` | List / create orders |
| `PATCH` | `/api/orders/:id` | Update order (items, status) |
| `POST` | `/api/orders/:id/pay` | Mark order as paid |
| `GET` | `/api/kds/orders` | KDS order queue |
| `PATCH` | `/api/kds/items/:id` | Advance KDS item stage |
| `GET/POST` | `/api/reservations` | List / create reservations |
| `GET` | `/api/reports/sales` | Sales report |
| `WS` | `ws://host/ws` | Real-time event stream |

---

## Routes (Frontend)

| Path | Access | Description |
|---|---|---|
| `/auth/login` | Public | Login page |
| `/pos/tables` | Employee+ | Floor map |
| `/pos/order/:tableId` | Employee+ | Order page |
| `/pos/orders` | Employee+ | All active orders |
| `/pos/customers` | Employee+ | Customer list |
| `/pos/reservations` | Employee+ | Reservation list |
| `/backend/dashboard` | Admin | Analytics dashboard |
| `/backend/products` | Admin | Product management |
| `/backend/tables` | Admin | Floor/table setup |
| `/backend/reports` | Admin | Sales reports |
| `/kds` | Public (internal) | Kitchen display |
| `/menu/:tableId` | Public | QR customer menu |

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ocp_cafe
JWT_SECRET=your_jwt_secret_here
PORT=4000
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```
