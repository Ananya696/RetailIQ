// Demo seed (Step 3). Run from backend/:  node seed.js
//  - roles Admin / Manager / Employee
//  - demo Admin, 1 Manager, 2 Employees
//  - 50 products with ids 1-50 (match Kaggle item ids 1-50 used by the demo ML model)
//  - 90 days of sales per product, ending yesterday
//      source: ../ml-service/data/train.csv (store 1) if present, else synthetic data
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_PATH = process.env.SEED_CSV || path.join(__dirname, '..', 'ml-service', 'data', 'train.csv');
const DAYS = 90;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@retailiq.demo';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Demo@12345';

const CATALOG = [
  ['Basmati Rice 1kg', 'Grocery', 95], ['Wheat Flour 5kg', 'Grocery', 240], ['Toor Dal 1kg', 'Grocery', 150],
  ['Sugar 1kg', 'Grocery', 48], ['Iodised Salt 1kg', 'Grocery', 22], ['Sunflower Oil 1L', 'Grocery', 135],
  ['Mustard Oil 1L', 'Grocery', 165], ['Tea Powder 500g', 'Beverages', 210], ['Instant Coffee 100g', 'Beverages', 260],
  ['Cola 750ml', 'Beverages', 40], ['Orange Juice 1L', 'Beverages', 110], ['Mineral Water 1L', 'Beverages', 20],
  ['Full Cream Milk 1L', 'Dairy', 66], ['Curd 400g', 'Dairy', 40], ['Paneer 200g', 'Dairy', 95],
  ['Butter 100g', 'Dairy', 58], ['Cheese Slices 200g', 'Dairy', 130], ['Eggs (12)', 'Dairy', 84],
  ['White Bread', 'Bakery', 40], ['Brown Bread', 'Bakery', 50], ['Buns (6)', 'Bakery', 35],
  ['Biscuits Family Pack', 'Snacks', 30], ['Potato Chips', 'Snacks', 20], ['Namkeen 400g', 'Snacks', 90],
  ['Chocolate Bar', 'Snacks', 50], ['Instant Noodles', 'Snacks', 14], ['Peanut Butter 340g', 'Snacks', 190],
  ['Tomato (1kg)', 'Vegetables', 40], ['Onion (1kg)', 'Vegetables', 35], ['Potato (1kg)', 'Vegetables', 30],
  ['Bananas (dozen)', 'Fruits', 60], ['Apples (1kg)', 'Fruits', 180], ['Soap Bar', 'Personal Care', 38],
  ['Shampoo 180ml', 'Personal Care', 150], ['Toothpaste 150g', 'Personal Care', 95], ['Toothbrush', 'Personal Care', 40],
  ['Hand Wash 250ml', 'Personal Care', 99], ['Detergent Powder 1kg', 'Household', 130], ['Dishwash Liquid 500ml', 'Household', 110],
  ['Floor Cleaner 1L', 'Household', 175], ['Toilet Cleaner 500ml', 'Household', 105], ['Garbage Bags (30)', 'Household', 85],
  ['Tissue Box', 'Household', 60], ['Batteries AA (4)', 'Electronics', 120], ['LED Bulb 9W', 'Electronics', 95],
  ['Notebook A4', 'Stationery', 55], ['Ball Pens (10)', 'Stationery', 70], ['Matchbox (10)', 'Household', 20],
  ['Pickle 400g', 'Grocery', 115],
];
const PERISHABLE = new Set(['Dairy', 'Bakery', 'Vegetables', 'Fruits']);
const SHELF_LIFE = { Dairy: 7, Bakery: 4, Vegetables: 6, Fruits: 7 };

// small deterministic PRNG so synthetic data is reproducible
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// returns Map<item, number[]> with the last DAYS values per item (oldest first)
async function loadSalesSeries() {
  const series = new Map();
  if (fs.existsSync(CSV_PATH)) {
    console.log(`Reading ${CSV_PATH} (store 1)...`);
    const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH) });
    let header = null;
    for await (const line of rl) {
      const cols = line.trim().split(',');
      if (!header) { header = cols; continue; }
      const row = Object.fromEntries(header.map((h, i) => [h, cols[i]]));
      if (Number(row.store) !== 1) continue;
      const item = Number(row.item);
      if (item < 1 || item > 50) continue;
      if (!series.has(item)) series.set(item, []);
      series.get(item).push([row.date, Number(row.sales)]);
    }
    for (const [item, rows] of series) {
      rows.sort((a, b) => (a[0] < b[0] ? -1 : 1));
      series.set(item, rows.slice(-DAYS).map((r) => r[1]));
    }
    if (series.size > 0) return series;
    console.warn('CSV had no store-1 rows for items 1-50. Falling back to synthetic data.');
  } else {
    console.warn(`${CSV_PATH} not found. Using synthetic sales data.`);
  }
  const rand = mulberry32(42);
  for (let item = 1; item <= 50; item++) {
    const base = 3 + Math.floor(rand() * 20);
    const vals = [];
    for (let d = 0; d < DAYS; d++) {
      const weekend = [5, 6].includes(d % 7) ? 1.3 : 1;
      vals.push(Math.max(0, Math.round(base * weekend + (rand() - 0.5) * base * 0.6)));
    }
    series.set(item, vals);
  }
  return series;
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production');
  if ((await prisma.user.count()) > 0 || (await prisma.product.count()) > 0) {
    throw new Error('Database is not empty. Seed only works on a fresh database (npx prisma migrate reset to start over).');
  }

  const roles = {};
  for (const name of ['Admin', 'Manager', 'Employee']) {
    roles[name] = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  const mk = (name, email, role, code) => prisma.user.create({
    data: { name, email, password: hash, roleId: roles[role].id, isActive: true, employeeCode: code },
  });
  const admin = await mk('Demo Admin', ADMIN_EMAIL, 'Admin', null);
  const manager = await mk('Demo Manager', 'manager@retailiq.demo', 'Manager', 'S1_E01');
  const emp1 = await mk('Demo Employee 1', 'employee1@retailiq.demo', 'Employee', 'S1_E02');
  const emp2 = await mk('Demo Employee 2', 'employee2@retailiq.demo', 'Employee', 'S1_E03');
  const sellers = [manager, emp1, emp2];

  const rand = mulberry32(7);
  await prisma.product.createMany({
    data: CATALOG.map(([name, category, price], i) => ({
      id: i + 1,
      name,
      category,
      supplier: `${category} Supplier Co.`,
      price,
      cost: Math.round(price * 0.7 * 100) / 100,
      isPerishable: PERISHABLE.has(category),
      shelfLifeDays: SHELF_LIFE[category] || null,
    })),
  });
  await prisma.stock.createMany({
    data: CATALOG.map(([, category], i) => ({
      productId: i + 1,
      quantity: 40 + Math.floor(rand() * 160),
      lowStockThreshold: 20,
      expiryDate: PERISHABLE.has(category) ? new Date(Date.now() + (2 + Math.floor(rand() * 6)) * 86400000) : null,
    })),
  });
  // Product ids were set explicitly, so move the id sequence past 50
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Product"', 'id'), 50)`);
  } catch (e) {
    console.warn('Could not reset the Product id sequence. New products may clash with ids 1-50:', e.message);
  }

  const series = await loadSalesSeries();
  const yesterday = new Date(); yesterday.setHours(0, 0, 0, 0); yesterday.setDate(yesterday.getDate() - 1);

  const rows = [];
  for (let item = 1; item <= 50; item++) {
    const vals = series.get(item) || [];
    const price = CATALOG[item - 1][2];
    vals.forEach((qty, idx) => {
      if (!(qty > 0)) return;
      const d = new Date(yesterday);
      d.setDate(yesterday.getDate() - (vals.length - 1 - idx)); // last value = yesterday
      d.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      rows.push({
        productId: item,
        soldById: sellers[(item + idx) % sellers.length].id,
        quantitySold: Math.round(qty),
        salePrice: price,
        saleDate: d,
        paymentMethod: ['Cash', 'UPI', 'Card'][Math.floor(rand() * 3)],
      });
    });
  }
  for (let i = 0; i < rows.length; i += 2000) {
    await prisma.sale.createMany({ data: rows.slice(i, i + 2000) });
  }

  console.log(`Seeded 4 users, ${CATALOG.length} products, ${rows.length} sales.`);
  console.log(`Login: ${ADMIN_EMAIL} / ${SEED_PASSWORD}  (also manager@, employee1@, employee2@retailiq.demo)`);
  void admin;
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
