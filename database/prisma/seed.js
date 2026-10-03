/**
 * RetailIQ — Database Seed Script
 * ---------------------------------
 * Generates demo data for a fresh database:
 *   - 3 roles (Admin, Manager, Employee)
 *   - 3 demo users (one per role)
 *   - 50 products across 7 categories, with stock
 *   - 120 days of realistic historical sales (weekend boost, slight
 *     upward trend, occasional spikes for anomaly-detection testing)
 *
 * This is a STANDALONE script — it uses this folder's own
 * node_modules (@prisma/client, bcrypt), not the backend's.
 *
 * HOW TO RUN:
 *   npm run seed
 *   npm run seed -- --reset      (wipes existing products/sales first)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const DAYS = 120;
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

// Seeded random so everyone running this gets the same demo data
let seedValue = 42;
function rand() {
  seedValue |= 0;
  seedValue = (seedValue + 0x6d2b79f5) | 0;
  let t = Math.imul(seedValue ^ (seedValue >>> 15), 1 | seedValue);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (a, b) => Math.floor(rand() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// [name, category, price, supplier, shelfLifeDays (0 = not perishable), avg units/day]
const PRODUCTS = [
  ['Full Cream Milk 1L', 'Dairy', 66, 'Amul Distributors', 5, 40],
  ['Toned Milk 500ml', 'Dairy', 28, 'Amul Distributors', 5, 55],
  ['Curd 400g', 'Dairy', 40, 'Amul Distributors', 7, 25],
  ['Paneer 200g', 'Dairy', 90, 'Mother Dairy', 10, 14],
  ['Butter 100g', 'Dairy', 58, 'Amul Distributors', 60, 12],
  ['Cheese Slices 200g', 'Dairy', 140, 'Amul Distributors', 120, 8],
  ['Ghee 500ml', 'Dairy', 330, 'Amul Distributors', 0, 6],
  ['Sweet Lassi 200ml', 'Dairy', 25, 'Mother Dairy', 10, 18],
  ['White Bread 400g', 'Bakery', 40, 'City Bakers', 4, 30],
  ['Brown Bread 400g', 'Bakery', 50, 'City Bakers', 4, 18],
  ['Pav Buns 6pc', 'Bakery', 30, 'City Bakers', 3, 20],
  ['Rusk 200g', 'Bakery', 45, 'City Bakers', 0, 11],
  ['Tomato 1kg', 'Produce', 40, 'Mandi Fresh', 6, 22],
  ['Onion 1kg', 'Produce', 35, 'Mandi Fresh', 30, 28],
  ['Potato 1kg', 'Produce', 30, 'Mandi Fresh', 30, 30],
  ['Banana 1 Dozen', 'Produce', 60, 'Mandi Fresh', 5, 16],
  ['Apple 1kg', 'Produce', 180, 'Mandi Fresh', 14, 9],
  ['Spinach Bunch', 'Produce', 20, 'Mandi Fresh', 3, 15],
  ['Cola 750ml', 'Beverages', 40, 'Metro Beverages', 0, 26],
  ['Orange Juice 1L', 'Beverages', 110, 'Metro Beverages', 0, 10],
  ['Mineral Water 1L', 'Beverages', 20, 'Metro Beverages', 0, 38],
  ['Green Tea 25 Bags', 'Beverages', 150, 'Metro Beverages', 0, 5],
  ['Instant Coffee 100g', 'Beverages', 280, 'Metro Beverages', 0, 6],
  ['Energy Drink 250ml', 'Beverages', 125, 'Metro Beverages', 0, 7],
  ['Potato Chips 52g', 'Snacks', 20, 'Snack Hub', 0, 45],
  ['Namkeen Mix 200g', 'Snacks', 55, 'Snack Hub', 0, 18],
  ['Cream Biscuits 100g', 'Snacks', 20, 'Snack Hub', 0, 40],
  ['Chocolate Bar 40g', 'Snacks', 50, 'Snack Hub', 0, 22],
  ['Instant Noodles 70g', 'Snacks', 14, 'Snack Hub', 0, 50],
  ['Salted Peanuts 150g', 'Snacks', 40, 'Snack Hub', 0, 12],
  ['Butter Cookies 150g', 'Snacks', 45, 'Snack Hub', 0, 15],
  ['Popcorn 80g', 'Snacks', 30, 'Snack Hub', 0, 9],
  ['Basmati Rice 5kg', 'Staples', 520, 'Agra Grain Co', 0, 8],
  ['Wheat Flour 5kg', 'Staples', 260, 'Agra Grain Co', 0, 12],
  ['Toor Dal 1kg', 'Staples', 165, 'Agra Grain Co', 0, 10],
  ['Sugar 1kg', 'Staples', 48, 'Agra Grain Co', 0, 16],
  ['Salt 1kg', 'Staples', 24, 'Agra Grain Co', 0, 20],
  ['Sunflower Oil 1L', 'Staples', 145, 'Agra Grain Co', 0, 14],
  ['Mustard Oil 1L', 'Staples', 170, 'Agra Grain Co', 0, 7],
  ['Tea Leaves 250g', 'Staples', 130, 'Agra Grain Co', 0, 11],
  ['Turmeric Powder 100g', 'Staples', 38, 'Agra Grain Co', 0, 9],
  ['Red Chilli Powder 100g', 'Staples', 55, 'Agra Grain Co', 0, 8],
  ['Detergent Powder 1kg', 'Household', 130, 'CleanCo', 0, 9],
  ['Dishwash Liquid 500ml', 'Household', 99, 'CleanCo', 0, 10],
  ['Floor Cleaner 1L', 'Household', 175, 'CleanCo', 0, 5],
  ['Toilet Cleaner 500ml', 'Household', 95, 'CleanCo', 0, 5],
  ['Bath Soap 4-Pack', 'Personal Care', 150, 'CleanCo', 0, 12],
  ['Shampoo 340ml', 'Personal Care', 280, 'CleanCo', 0, 7],
  ['Toothpaste 150g', 'Personal Care', 98, 'CleanCo', 0, 14],
  ['Hand Wash 250ml', 'Personal Care', 85, 'CleanCo', 0, 8],
];

async function main() {
  console.log('--- RetailIQ Seed Script ---\n');

  // 1. Roles (safe to re-run — upsert)
  const roles = {};
  for (const name of ['Admin', 'Manager', 'Employee']) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Roles ready: Admin, Manager, Employee');

  // 2. Demo users (safe to re-run — upsert by email)
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const users = [];
  const demoUsers = [
    ['Admin', 'admin@retailiq.demo', 'ADM001'],
    ['Manager', 'manager@retailiq.demo', 'MGR001'],
    ['Employee', 'employee@retailiq.demo', 'EMP001'],
  ];
  for (const [roleName, email, code] of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `Demo ${roleName}`,
        email,
        password: hashedPassword,
        roleId: roles[roleName].id,
        employeeCode: code,
        isActive: true,
      },
    });
    users.push(user);
  }
  console.log(`Demo users ready. Login with any of:`);
  demoUsers.forEach(([role, email]) => console.log(`   ${email} / ${PASSWORD}  (${role})`));

  // 3. Optional reset
  if (process.argv.includes('--reset')) {
    console.log('\n--reset flag detected: clearing existing products/sales/stock...');
    await prisma.$transaction([
      prisma.prediction.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.stock.deleteMany(),
      prisma.product.deleteMany(),
    ]);
  }

  // 4. Skip product creation if products already exist (avoid duplicates)
  const existingProductCount = await prisma.product.count();
  if (existingProductCount > 0) {
    console.log(`\n${existingProductCount} product(s) already exist — skipping product/sales creation.`);
    console.log('To regenerate fresh data, run: npm run seed -- --reset');
    return;
  }

  // 5. Create 50 products with stock
  console.log('\nCreating products...');
  const products = [];
  for (const [name, category, price, supplier, shelfLifeDays, baseDailySales] of PRODUCTS) {
    const isPerishable = shelfLifeDays > 0;
    const product = await prisma.product.create({
      data: {
        name,
        category,
        supplier,
        price: price.toFixed(2),
        cost: (price * 0.8).toFixed(2), // assume ~20% margin
        isPerishable,
        shelfLifeDays: isPerishable ? shelfLifeDays : null,
        stock: {
          create: {
            quantity: Math.round(baseDailySales * (3 + rand() * 9)),
            lowStockThreshold: Math.max(5, Math.round(baseDailySales * 3)),
            expiryDate: isPerishable
              ? new Date(Date.now() + randInt(2, Math.min(shelfLifeDays, 14)) * 86400000)
              : null,
          },
        },
      },
    });
    products.push({ id: product.id, price, baseDailySales });
  }
  console.log(`${products.length} products created.`);

  // A few products get deliberately low stock, for the low-stock-alert demo
  for (const [i, p] of products.entries()) {
    if (i % 9 === 0) {
      await prisma.stock.update({
        where: { productId: p.id },
        data: { quantity: randInt(0, 4) },
      });
    }
  }

  // 6. Generate 120 days of sales history
  console.log(`\nGenerating ${DAYS} days of sales history (this may take a moment)...`);
  const paymentMethods = ['UPI', 'UPI', 'UPI', 'UPI', 'CASH', 'CASH', 'CASH', 'CARD', 'CARD'];
  const salesToInsert = [];

  for (let daysAgo = DAYS; daysAgo >= 1; daysAgo--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - daysAgo);

    const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : dayOfWeek === 5 ? 1.15 : 1;
    const trendFactor = 1 + (DAYS - daysAgo) * 0.0015; // gentle upward trend over time

    for (const product of products) {
      let units = product.baseDailySales * weekendBoost * trendFactor * (0.75 + rand() * 0.5);

      // Occasional spike (useful for anomaly-detection demo)
      if (rand() < 0.012) units *= 3;

      units = Math.round(units);
      if (units <= 0) continue;

      // Split the day's total into 1-3 separate sale transactions (more realistic)
      const numTransactions = Math.min(units, randInt(1, 3));
      let remaining = units;

      for (let t = 0; t < numTransactions; t++) {
        const qty = t === numTransactions - 1 ? remaining : Math.max(1, Math.floor(remaining / (numTransactions - t)));
        remaining -= qty;

        const saleTime = new Date(day);
        saleTime.setHours(randInt(8, 21), randInt(0, 59), randInt(0, 59));

        salesToInsert.push({
          productId: product.id,
          soldById: pick(users).id,
          quantitySold: qty,
          salePrice: (rand() < 0.05 ? product.price * 0.95 : product.price).toFixed(2), // occasional small discount
          paymentMethod: pick(paymentMethods),
          saleDate: saleTime,
        });
      }
    }
  }

  // Insert in batches of 2000 (faster and avoids payload limits)
  for (let i = 0; i < salesToInsert.length; i += 2000) {
    await prisma.sale.createMany({ data: salesToInsert.slice(i, i + 2000) });
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${products.length} products created`);
  console.log(`   ${salesToInsert.length} sales records created (spanning ${DAYS} days)`);
  console.log(`\nLogin as: admin@retailiq.demo / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });