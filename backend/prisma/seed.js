'use strict';
require('dotenv').config();

const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

const PASSWORD_COST = 12;

async function main() {
  const passwordHash = await bcrypt.hash('Admin@1234', PASSWORD_COST);

  await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {
      name: 'Seed Admin',
      passwordHash,
      role: 'admin',
      isArchived: false,
    },
    create: {
      name: 'Seed Admin',
      email: 'admin@cafe.com',
      passwordHash,
      role: 'admin',
    },
  });

  for (const method of ['cash', 'card', 'upi']) {
    await prisma.paymentMethod.upsert({
      where: { method },
      update: {
        isEnabled: false,
        upiId: method === 'upi' ? null : undefined,
      },
      create: {
        method,
        isEnabled: false,
      },
    });
  }

  const categories = {
    beverages: await prisma.category.upsert({
      where: { name: 'Beverages' },
      update: { color: '#2563EB' },
      create: { name: 'Beverages', color: '#2563EB' },
    }),
    food: await prisma.category.upsert({
      where: { name: 'Food' },
      update: { color: '#16A34A' },
      create: { name: 'Food', color: '#16A34A' },
    }),
    desserts: await prisma.category.upsert({
      where: { name: 'Desserts' },
      update: { color: '#DB2777' },
      create: { name: 'Desserts', color: '#DB2777' },
    }),
  };

  const products = [
    {
      name: 'Espresso',
      categoryId: categories.beverages.id,
      price: 90,
      unitOfMeasure: 'per_piece',
      taxPercent: 5,
      description: 'Single shot espresso.',
      showOnKds: true,
    },
    {
      name: 'Cappuccino',
      categoryId: categories.beverages.id,
      price: 120,
      unitOfMeasure: 'per_piece',
      taxPercent: 5,
      description: 'Espresso with steamed milk foam.',
      showOnKds: true,
    },
    {
      name: 'Veg Sandwich',
      categoryId: categories.food.id,
      price: 180,
      unitOfMeasure: 'per_piece',
      taxPercent: 5,
      description: 'Grilled vegetable sandwich.',
      showOnKds: true,
    },
    {
      name: 'Masala Fries',
      categoryId: categories.food.id,
      price: 140,
      unitOfMeasure: 'per_piece',
      taxPercent: 5,
      description: 'Crisp fries with house spice blend.',
      showOnKds: true,
    },
    {
      name: 'Chocolate Brownie',
      categoryId: categories.desserts.id,
      price: 160,
      unitOfMeasure: 'per_piece',
      taxPercent: 5,
      description: 'Warm chocolate brownie.',
      showOnKds: true,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: product });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  const mainFloor = await prisma.floor.findFirst({ where: { name: 'Main Floor' } });
  const floor =
    mainFloor || (await prisma.floor.create({ data: { name: 'Main Floor' } }));

  for (const table of [
    { tableNumber: 1, seatCount: 2 },
    { tableNumber: 2, seatCount: 4 },
    { tableNumber: 3, seatCount: 6 },
  ]) {
    await prisma.diningTable.upsert({
      where: {
        floorId_tableNumber: {
          floorId: floor.id,
          tableNumber: table.tableNumber,
        },
      },
      update: {
        seatCount: table.seatCount,
        isActive: true,
      },
      create: {
        floorId: floor.id,
        ...table,
      },
    });
  }

  console.log('[Seed] Complete: admin, payment methods, categories, products, floor, tables.');
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
