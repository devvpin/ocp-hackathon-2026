'use strict';
require('dotenv').config();

const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

const PASSWORD_COST = 12;

// ---------------------------------------------------------------------------
// Deterministic UUIDs – keeps the seed fully idempotent across re-runs
// ---------------------------------------------------------------------------
const ID = {
  // Users
  adminUser:    'a0000001-0000-0000-0000-000000000001',
  employeeUser: 'a0000001-0000-0000-0000-000000000002',

  // Categories
  catBeverages: 'c0000001-0000-0000-0000-000000000001',
  catCoffee:    'c0000001-0000-0000-0000-000000000002',
  catFood:      'c0000001-0000-0000-0000-000000000003',
  catDesserts:  'c0000001-0000-0000-0000-000000000004',
  catSnacks:    'c0000001-0000-0000-0000-000000000005',

  // Floors
  floorMain:    'f0000001-0000-0000-0000-000000000001',
  floorRooftop: 'f0000001-0000-0000-0000-000000000002',

  // Customers
  cust1: 'b0000001-0000-0000-0000-000000000001',
  cust2: 'b0000001-0000-0000-0000-000000000002',
  cust3: 'b0000001-0000-0000-0000-000000000003',
  cust4: 'b0000001-0000-0000-0000-000000000004',
  cust5: 'b0000001-0000-0000-0000-000000000005',
  cust6: 'b0000001-0000-0000-0000-000000000006',

  // Coupons
  couponWelcome: 'e0000001-0000-0000-0000-000000000001',
  couponHappy:   'e0000001-0000-0000-0000-000000000002',
  couponFlat50:  'e0000001-0000-0000-0000-000000000003',
};

async function main() {
  console.log('[Seed] Starting…');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash    = await bcrypt.hash('Admin@1234',    PASSWORD_COST);
  const employeeHash = await bcrypt.hash('Employee@1234', PASSWORD_COST);

  await prisma.user.upsert({
    where:  { email: 'admin@cafe.com' },
    update: { name: 'Seed Admin', passwordHash: adminHash, role: 'admin', isArchived: false },
    create: { id: ID.adminUser, name: 'Seed Admin', email: 'admin@cafe.com', passwordHash: adminHash, role: 'admin' },
  });

  await prisma.user.upsert({
    where:  { email: 'staff@cafe.com' },
    update: { name: 'Arjun Mehta', passwordHash: employeeHash, role: 'employee', isArchived: false },
    create: { id: ID.employeeUser, name: 'Arjun Mehta', email: 'staff@cafe.com', passwordHash: employeeHash, role: 'employee' },
  });

  // ── Payment Methods ────────────────────────────────────────────────────────
  await prisma.paymentMethod.upsert({
    where:  { method: 'cash' },
    update: { isEnabled: true },
    create: { method: 'cash', isEnabled: true },
  });
  await prisma.paymentMethod.upsert({
    where:  { method: 'card' },
    update: { isEnabled: true },
    create: { method: 'card', isEnabled: true },
  });
  await prisma.paymentMethod.upsert({
    where:  { method: 'upi' },
    update: { isEnabled: true, upiId: 'cafe@upi' },
    create: { method: 'upi', isEnabled: true, upiId: 'cafe@upi' },
  });

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = {
    beverages: await prisma.category.upsert({
      where:  { name: 'Beverages' },
      update: { color: '#2563EB' },
      create: { id: ID.catBeverages, name: 'Beverages', color: '#2563EB' },
    }),
    coffee: await prisma.category.upsert({
      where:  { name: 'Coffee' },
      update: { color: '#92400E' },
      create: { id: ID.catCoffee, name: 'Coffee', color: '#92400E' },
    }),
    food: await prisma.category.upsert({
      where:  { name: 'Food' },
      update: { color: '#16A34A' },
      create: { id: ID.catFood, name: 'Food', color: '#16A34A' },
    }),
    desserts: await prisma.category.upsert({
      where:  { name: 'Desserts' },
      update: { color: '#DB2777' },
      create: { id: ID.catDesserts, name: 'Desserts', color: '#DB2777' },
    }),
    snacks: await prisma.category.upsert({
      where:  { name: 'Snacks' },
      update: { color: '#EA580C' },
      create: { id: ID.catSnacks, name: 'Snacks', color: '#EA580C' },
    }),
  };

  // ── Products ───────────────────────────────────────────────────────────────
  const products = [
    // Coffee
    { name: 'Espresso',          categoryId: categories.coffee.id,    price: 90,  taxPercent: 5,  description: 'Single shot espresso.' },
    { name: 'Double Espresso',   categoryId: categories.coffee.id,    price: 140, taxPercent: 5,  description: 'Double shot espresso for those who need an extra kick.' },
    { name: 'Cappuccino',        categoryId: categories.coffee.id,    price: 120, taxPercent: 5,  description: 'Espresso with velvety steamed milk foam.' },
    { name: 'Flat White',        categoryId: categories.coffee.id,    price: 130, taxPercent: 5,  description: 'Ristretto shots with micro-foamed whole milk.' },
    { name: 'Café Latte',        categoryId: categories.coffee.id,    price: 125, taxPercent: 5,  description: 'Smooth espresso with steamed milk.' },
    { name: 'Cold Brew',         categoryId: categories.coffee.id,    price: 160, taxPercent: 5,  description: 'Slow-steeped 18-hour cold brew.' },
    { name: 'Mocha',             categoryId: categories.coffee.id,    price: 145, taxPercent: 5,  description: 'Espresso, dark chocolate, and steamed milk.' },
    // Beverages (non-coffee)
    { name: 'Masala Chai',       categoryId: categories.beverages.id, price: 70,  taxPercent: 5,  description: 'Traditional spiced tea with ginger and cardamom.' },
    { name: 'Mango Smoothie',    categoryId: categories.beverages.id, price: 150, taxPercent: 5,  description: 'Fresh mango blended with yoghurt.' },
    { name: 'Fresh Lime Soda',   categoryId: categories.beverages.id, price: 80,  taxPercent: 5,  description: 'Chilled lime soda, sweet or salted.' },
    { name: 'Sparkling Water',   categoryId: categories.beverages.id, price: 60,  taxPercent: 5,  description: '330 ml chilled sparkling water.',               showOnKds: false },
    // Food
    { name: 'Veg Sandwich',      categoryId: categories.food.id,      price: 180, taxPercent: 5,  description: 'Grilled seasonal vegetables in multigrain bread.' },
    { name: 'Chicken Club',      categoryId: categories.food.id,      price: 250, taxPercent: 5,  description: 'Grilled chicken, lettuce, tomato, and mayo.' },
    { name: 'Paneer Wrap',       categoryId: categories.food.id,      price: 220, taxPercent: 5,  description: 'Spiced paneer in a whole-wheat tortilla.' },
    { name: 'Avocado Toast',     categoryId: categories.food.id,      price: 200, taxPercent: 5,  description: 'Smashed avocado, chilli flakes, sourdough.' },
    { name: 'Eggs Benedict',     categoryId: categories.food.id,      price: 270, taxPercent: 5,  description: 'Poached eggs, hollandaise sauce, English muffin.' },
    // Snacks
    { name: 'Masala Fries',      categoryId: categories.snacks.id,    price: 140, taxPercent: 5,  description: 'Crisp fries with our house spice blend.' },
    { name: 'Garlic Bread',      categoryId: categories.snacks.id,    price: 110, taxPercent: 5,  description: 'Toasted baguette with garlic butter.' },
    { name: 'Nachos & Salsa',    categoryId: categories.snacks.id,    price: 160, taxPercent: 5,  description: 'Tortilla chips with house-made tomato salsa.' },
    // Desserts
    { name: 'Chocolate Brownie', categoryId: categories.desserts.id,  price: 160, taxPercent: 5,  description: 'Warm dark-chocolate brownie with vanilla ice cream.' },
    { name: 'NY Cheesecake',     categoryId: categories.desserts.id,  price: 190, taxPercent: 5,  description: 'Classic New York-style baked cheesecake.' },
    { name: 'Belgian Waffle',    categoryId: categories.desserts.id,  price: 175, taxPercent: 5,  description: 'Crispy waffle with honey, berries, and cream.' },
  ];

  for (const p of products) {
    const row = { unitOfMeasure: 'per_piece', showOnKds: true, ...p };
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: row });
    } else {
      await prisma.product.create({ data: row });
    }
  }

  // ── Floors & Tables ────────────────────────────────────────────────────────
  const mainFloor = await prisma.floor.upsert({
    where:  { id: ID.floorMain },
    update: { name: 'Main Floor' },
    create: { id: ID.floorMain, name: 'Main Floor' },
  });

  const rooftopFloor = await prisma.floor.upsert({
    where:  { id: ID.floorRooftop },
    update: { name: 'Rooftop' },
    create: { id: ID.floorRooftop, name: 'Rooftop' },
  });

  // Main floor – 8 tables
  for (const t of [
    { tableNumber: 1, seatCount: 2 },
    { tableNumber: 2, seatCount: 2 },
    { tableNumber: 3, seatCount: 4 },
    { tableNumber: 4, seatCount: 4 },
    { tableNumber: 5, seatCount: 4 },
    { tableNumber: 6, seatCount: 6 },
    { tableNumber: 7, seatCount: 6 },
    { tableNumber: 8, seatCount: 8 },
  ]) {
    await prisma.diningTable.upsert({
      where:  { floorId_tableNumber: { floorId: mainFloor.id, tableNumber: t.tableNumber } },
      update: { seatCount: t.seatCount, isActive: true },
      create: { floorId: mainFloor.id, ...t },
    });
  }

  // Rooftop – 4 tables
  for (const t of [
    { tableNumber: 1, seatCount: 2 },
    { tableNumber: 2, seatCount: 4 },
    { tableNumber: 3, seatCount: 4 },
    { tableNumber: 4, seatCount: 6 },
  ]) {
    await prisma.diningTable.upsert({
      where:  { floorId_tableNumber: { floorId: rooftopFloor.id, tableNumber: t.tableNumber } },
      update: { seatCount: t.seatCount, isActive: true },
      create: { floorId: rooftopFloor.id, ...t },
    });
  }

  // ── Customers ──────────────────────────────────────────────────────────────
  const customerData = [
    { id: ID.cust1, name: 'Priya Sharma',   email: 'priya@example.com',   phone: '9876543210' },
    { id: ID.cust2, name: 'Rahul Verma',    email: 'rahul@example.com',   phone: '9812345678' },
    { id: ID.cust3, name: 'Sneha Patel',    email: 'sneha@example.com',   phone: '9898765432' },
    { id: ID.cust4, name: 'Ankit Joshi',    email: 'ankit@example.com',   phone: '9765432109' },
    { id: ID.cust5, name: 'Meera Nair',     email: 'meera@example.com',   phone: '9741230987' },
    { id: ID.cust6, name: 'Dev Kapoor',     email: 'dev@example.com',     phone: '9632107654' },
  ];

  for (const c of customerData) {
    await prisma.customer.upsert({
      where:  { email: c.email },
      update: { name: c.name, phone: c.phone },
      create: c,
    });
  }

  // ── Coupons ────────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where:  { id: ID.couponWelcome },
    update: { discountType: 'percentage', discountValue: 10, isActive: true },
    create: { id: ID.couponWelcome, code: 'WELCOME10', discountType: 'percentage', discountValue: 10, isActive: true },
  });
  await prisma.coupon.upsert({
    where:  { id: ID.couponHappy },
    update: { discountType: 'percentage', discountValue: 15, isActive: true },
    create: { id: ID.couponHappy, code: 'HAPPY15', discountType: 'percentage', discountValue: 15, isActive: true },
  });
  await prisma.coupon.upsert({
    where:  { id: ID.couponFlat50 },
    update: { discountType: 'fixed', discountValue: 50, isActive: true },
    create: { id: ID.couponFlat50, code: 'FLAT50', discountType: 'fixed', discountValue: 50, isActive: true },
  });

  // ── Promotions ─────────────────────────────────────────────────────────────
  // "Buy 3 coffees get 10% off each" – product-level on Cappuccino
  const cappuccino = await prisma.product.findFirst({ where: { name: 'Cappuccino' } });
  if (cappuccino) {
    const existingPromo = await prisma.promotion.findFirst({ where: { name: 'Cappuccino Triple Deal' } });
    if (!existingPromo) {
      await prisma.promotion.create({
        data: {
          name: 'Cappuccino Triple Deal',
          appliedTo: 'product',
          productId: cappuccino.id,
          minQuantity: 3,
          discountType: 'percentage',
          discountValue: 10,
          isActive: true,
        },
      });
    }
  }

  // "10% off orders over ₹500"
  const existingOrderPromo = await prisma.promotion.findFirst({ where: { name: 'Big Order Discount' } });
  if (!existingOrderPromo) {
    await prisma.promotion.create({
      data: {
        name: 'Big Order Discount',
        appliedTo: 'order',
        minOrderAmount: 500,
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
      },
    });
  }

  // "Happy Hours – flat ₹20 off any Latte"
  const latte = await prisma.product.findFirst({ where: { name: 'Café Latte' } });
  if (latte) {
    const existingLattePromo = await prisma.promotion.findFirst({ where: { name: 'Happy Hours Latte' } });
    if (!existingLattePromo) {
      await prisma.promotion.create({
        data: {
          name: 'Happy Hours Latte',
          appliedTo: 'product',
          productId: latte.id,
          minQuantity: 1,
          discountType: 'fixed',
          discountValue: 20,
          isActive: true,
        },
      });
    }
  }

  // ── Reservations ───────────────────────────────────────────────────────────
  // Fetch a couple of seeded tables for realistic FK links
  const mainTables = await prisma.diningTable.findMany({
    where: { floorId: mainFloor.id },
    orderBy: { tableNumber: 'asc' },
    take: 4,
  });
  const rooftopTables = await prisma.diningTable.findMany({
    where: { floorId: rooftopFloor.id },
    orderBy: { tableNumber: 'asc' },
    take: 2,
  });

  const customers = await prisma.customer.findMany({ take: 6 });

  const today = new Date();
  const dayMs  = 86_400_000;

  const reservations = [
    { customerId: customers[0]?.id, tableId: mainTables[0]?.id,    bookingDate: new Date(today.getTime() + dayMs),     guestCount: 2, status: 'confirmed', notes: 'Anniversary dinner, please add a candle.' },
    { customerId: customers[1]?.id, tableId: mainTables[1]?.id,    bookingDate: new Date(today.getTime() + dayMs),     guestCount: 4, status: 'pending',   notes: null },
    { customerId: customers[2]?.id, tableId: mainTables[2]?.id,    bookingDate: new Date(today.getTime() + 2 * dayMs), guestCount: 4, status: 'confirmed', notes: 'Vegetarian menu preferred.' },
    { customerId: customers[3]?.id, tableId: mainTables[3]?.id,    bookingDate: new Date(today.getTime() + 3 * dayMs), guestCount: 6, status: 'pending',   notes: 'Birthday party, high-chair needed.' },
    { customerId: customers[4]?.id, tableId: rooftopTables[0]?.id, bookingDate: new Date(today.getTime() + 2 * dayMs), guestCount: 2, status: 'confirmed', notes: null },
    { customerId: customers[5]?.id, tableId: rooftopTables[1]?.id, bookingDate: new Date(today.getTime() + 4 * dayMs), guestCount: 4, status: 'pending',   notes: 'Corporate lunch, need projector.' },
  ];

  for (const r of reservations) {
    if (!r.customerId || !r.tableId) continue;
    // Only create if this customer doesn't already have a booking on that date
    const existingBooking = await prisma.booking.findFirst({
      where: {
        customerId: r.customerId,
        bookingDate: r.bookingDate,
      },
    });
    if (!existingBooking) {
      await prisma.booking.create({ data: r });
    }
  }

  console.log('[Seed] Complete.');
  console.log('  Users        : admin@cafe.com (Admin@1234) · staff@cafe.com (Employee@1234)');
  console.log('  Categories   : Coffee, Beverages, Food, Snacks, Desserts');
  console.log('  Products     : 22 items');
  console.log('  Floors       : Main Floor (8 tables), Rooftop (4 tables)');
  console.log('  Customers    : 6 demo customers');
  console.log('  Coupons      : WELCOME10, HAPPY15, FLAT50');
  console.log('  Promotions   : 3 active promotions');
  console.log('  Reservations : 6 upcoming bookings');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[Seed] Error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
