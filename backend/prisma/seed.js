/**
 * seed.js — Database seed script.
 *
 * Phase 0: stub (no-op). Prints a placeholder message.
 * Phase 1: implements full seed (admin user, payment methods,
 *           categories, products, floor, tables).
 *
 * Run with: npm run seed
 */

async function main() {
  console.log('[Seed] Phase 0 stub — seed logic implemented in Phase 1.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
