require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ===== STARTUP CHECKS (B9) =====
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Set it in backend/.env');
  process.exit(1);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const GENAI_URL = process.env.GENAI_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_KEY = process.env.INTERNAL_KEY || '';
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ===== HELPERS =====
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// All roles that may work with products, stock and sales (B2)
const STAFF = ['Admin', 'Manager', 'Employee'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card'];
const DAY_MS = 24 * 60 * 60 * 1000;
const INVITE_VALID_DAYS = 7;
const EXPIRY_RISK_LEFTOVER_RATIO = 0.2; // at risk if > 20% of stock is predicted to be left at expiry

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPassword = (p) => typeof p === 'string' && p.length >= 8;

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

function parseId(value, label = 'id') {
  const n = toInt(value);
  if (!(n > 0)) throw httpError(400, `Invalid ${label}`);
  return n;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Local-date key (YYYY-MM-DD). Set TZ=Asia/Kolkata in .env so "today" matches the shop.
function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function signToken(userId, roleName) {
  return jwt.sign({ userId, role: roleName }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

// ===== RATE LIMIT (B9) =====
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

// ===== PUBLIC ROUTES =====
app.get('/', (req, res) => {
  res.send('RetailIQ backend is running ✅');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ===== MIDDLEWARE: token check =====
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing. Please log in first.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}

// ===== MIDDLEWARE: role check =====
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Only ${allowedRoles.join(' or ')} can do this.`,
      });
    }
    next();
  };
}

// ===== 1. SIGNUP (only the first user, who becomes Admin) =====
app.post('/api/signup', authLimiter, async (req, res) => {
  const { name, password } = req.body || {};
  const email = normalizeEmail(req.body?.email);
  // NOTE: the signup form also sends storeName. There is no Settings table yet, so it is ignored.

  if (!name || !email || !password) {
    throw httpError(400, 'Name, email and password are required');
  }
  if (!isValidEmail(email)) throw httpError(400, 'Invalid email address');
  if (!isValidPassword(password)) throw httpError(400, 'Password must be at least 8 characters');

  const hashedPassword = await bcrypt.hash(password, 10);

  // Count + create inside one serializable transaction so two simultaneous
  // signups cannot both become Admin (B7).
  const admin = await prisma.$transaction(async (tx) => {
    if ((await tx.user.count()) > 0) {
      throw httpError(403, 'Signup is closed. Only the Admin can invite new staff.');
    }

    const adminRole = await tx.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin' } });
    await tx.role.upsert({ where: { name: 'Manager' }, update: {}, create: { name: 'Manager' } });
    await tx.role.upsert({ where: { name: 'Employee' }, update: {}, create: { name: 'Employee' } });

    return tx.user.create({
      data: { name: String(name).trim(), email, password: hashedPassword, roleId: adminRole.id, isActive: true },
    });
  }, { isolationLevel: 'Serializable' });

  res.status(201).json({
    message: 'Admin account created',
    token: signToken(admin.id, 'Admin'),
    user: { id: admin.id, name: admin.name, email: admin.email, role: 'Admin' },
  });
});

// ===== 2. ADMIN: INVITE STAFF =====
app.post('/api/invite-staff', authenticate, authorize('Admin'), async (req, res) => {
  const { name, roleName } = req.body || {};
  const email = normalizeEmail(req.body?.email);

  if (!name || !email || !roleName) throw httpError(400, 'Name, email and role are required');
  if (!isValidEmail(email)) throw httpError(400, 'Invalid email address');
  if (!['Manager', 'Employee'].includes(roleName)) {
    throw httpError(400, 'Role must be Manager or Employee');
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    throw httpError(409, 'An account with this email already exists');
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw httpError(500, `Role ${roleName} is not set up. Sign up the Admin first.`);

  const inviteToken = crypto.randomBytes(32).toString('hex');

  await prisma.user.create({
    data: {
      name: String(name).trim(),
      email,
      roleId: role.id,
      isActive: false,
      inviteToken,
      inviteExpiresAt: new Date(Date.now() + INVITE_VALID_DAYS * DAY_MS), // B6
      invitedById: req.user.userId,                                        // B6
      password: null,
    },
  });

  const inviteLink = `${FRONTEND_URL}/set-password?token=${inviteToken}`; // B5
  if (!IS_PROD) console.log(`Invite link for ${email}: ${inviteLink}`);

  res.status(201).json({ message: `${roleName} invited`, inviteLink });
});

// ===== 3. SET PASSWORD (invited staff) =====
app.post('/api/set-password', authLimiter, async (req, res) => {
  const { token, password } = req.body || {};

  if (!token || !password) throw httpError(400, 'Token and password are required');
  if (!isValidPassword(password)) throw httpError(400, 'Password must be at least 8 characters');

  const user = await prisma.user.findUnique({ where: { inviteToken: String(token) } });
  if (!user) throw httpError(400, 'Invalid or expired invite link');
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    throw httpError(400, 'Invite link has expired. Ask the Admin for a new one.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 10), isActive: true, inviteToken: null, inviteExpiresAt: null },
  });

  res.json({ message: 'Password set. You can now log in.' });
});

// ===== 4. LOGIN =====
app.post('/api/login', authLimiter, async (req, res) => {
  const { password } = req.body || {};
  const email = normalizeEmail(req.body?.email);

  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

  // Same message for unknown user, inactive account and wrong password
  if (!user || !user.isActive || !user.password || !(await bcrypt.compare(String(password), user.password))) {
    throw httpError(401, 'Invalid credentials or account not active');
  }

  res.json({
    message: 'Login successful',
    token: signToken(user.id, user.role.name),
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  });
});

// ===== STAFF LIST (F7) =====
app.get('/api/staff', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: 'asc' },
  });
  res.json(users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    isActive: u.isActive,
    employeeCode: u.employeeCode ?? null,
  })));
});

// ===== PRODUCT ROUTES =====

app.post('/api/products', authenticate, authorize(...STAFF), async (req, res) => {
  const { name, category, supplier, isPerishable, shelfLifeDays } = req.body || {};
  const price = Number(req.body?.price);
  const cost = req.body?.cost === undefined || req.body?.cost === null || req.body?.cost === '' ? null : Number(req.body.cost);
  const initialStock = req.body?.initialStock ?? 0;
  const lowStockThreshold = req.body?.lowStockThreshold ?? 10;

  if (!name || !(price > 0)) throw httpError(400, 'Name and a valid price are required');
  if (cost !== null && !(cost >= 0)) throw httpError(400, 'Cost must be a non-negative number');
  if (!(toInt(initialStock) >= 0)) throw httpError(400, 'initialStock must be a non-negative integer');
  if (!(toInt(lowStockThreshold) >= 0)) throw httpError(400, 'lowStockThreshold must be a non-negative integer');

  let shelfDays = null;
  let expiryDate = null;
  if (isPerishable && shelfLifeDays) {
    shelfDays = toInt(shelfLifeDays);
    if (!(shelfDays > 0)) throw httpError(400, 'shelfLifeDays must be a positive integer');
    expiryDate = addDays(new Date(), shelfDays);
  }

  const product = await prisma.product.create({
    data: {
      name: String(name).trim(),
      category: category || null,
      supplier: supplier || null,
      price,
      cost,
      isPerishable: Boolean(isPerishable),
      shelfLifeDays: shelfDays,
      stock: {
        create: { quantity: Number(initialStock), lowStockThreshold: Number(lowStockThreshold), expiryDate },
      },
    },
    include: { stock: true },
  });

  res.status(201).json({ message: 'Product created', product });
});

// All active (non-archived) products
app.get('/api/products', authenticate, async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    include: { stock: true },
    orderBy: { id: 'asc' },
  });
  res.json(products);
});

// ===== EXPIRY RISK (B10) =====
async function computeExpiryRisk() {
  const now = new Date();
  const sevenDaysAgo = addDays(now, -7);

  const products = await prisma.product.findMany({
    where: { isPerishable: true, isArchived: false },
    include: { stock: true },
  });
  const tracked = products.filter((p) => p.stock && p.stock.expiryDate);
  if (tracked.length === 0) return [];

  // One grouped query instead of one query per product
  const grouped = await prisma.sale.groupBy({
    by: ['productId'],
    where: { productId: { in: tracked.map((p) => p.id) }, saleDate: { gte: sevenDaysAgo } },
    _sum: { quantitySold: true },
  });
  const soldByProduct = new Map(grouped.map((g) => [g.productId, g._sum.quantitySold || 0]));

  return tracked.map((p) => {
    const currentStock = p.stock.quantity;
    const daysLeft = Math.ceil((new Date(p.stock.expiryDate) - now) / DAY_MS);
    const expired = daysLeft <= 0;
    const avgDailySaleRate = (soldByProduct.get(p.id) || 0) / 7;

    const predictedSalesTillExpiry = expired ? 0 : Math.round(avgDailySaleRate * daysLeft);
    const expectedLeftover = Math.max(0, currentStock - predictedSalesTillExpiry);

    let status = 'ok';
    if (expired) status = currentStock > 0 ? 'expired' : 'ok';
    else if (expectedLeftover > currentStock * EXPIRY_RISK_LEFTOVER_RATIO && expectedLeftover > 0) status = 'at_risk';

    return {
      productId: p.id,
      productName: p.name,
      currentStock,
      expiryDate: p.stock.expiryDate,
      daysLeftToExpiry: Math.max(daysLeft, 0),
      expired,
      avgDailySaleRate: Math.round(avgDailySaleRate * 10) / 10,
      predictedSalesTillExpiry,
      expectedLeftover,
      isAtRisk: status !== 'ok',
      status,
    };
  });
}

// IMPORTANT: keep this above "/api/products/:id", or Express reads "expiry-risk" as an :id.
app.get('/api/products/expiry-risk', authenticate, async (req, res) => {
  res.json(await computeExpiryRisk());
});

app.get('/api/products/:id', authenticate, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: parseId(req.params.id) },
    include: { stock: true },
  });
  if (!product || product.isArchived) throw httpError(404, 'Product not found');
  res.json(product);
});

app.put('/api/products/:id', authenticate, authorize(...STAFF), async (req, res) => {
  const id = parseId(req.params.id);
  const { name, category, supplier, isPerishable, shelfLifeDays, lowStockThreshold } = req.body || {};
  const data = {};

  if (name !== undefined) {
    if (!String(name).trim()) throw httpError(400, 'Name cannot be empty');
    data.name = String(name).trim();
  }
  if (category !== undefined) data.category = category || null;
  if (supplier !== undefined) data.supplier = supplier || null;
  if (req.body?.price !== undefined) {
    if (!(Number(req.body.price) > 0)) throw httpError(400, 'Price must be a positive number');
    data.price = Number(req.body.price);
  }
  if (req.body?.cost !== undefined) {
    if (req.body.cost === null || req.body.cost === '') data.cost = null;
    else if (Number(req.body.cost) >= 0) data.cost = Number(req.body.cost);
    else throw httpError(400, 'Cost must be a non-negative number');
  }
  if (isPerishable !== undefined) data.isPerishable = Boolean(isPerishable);
  if (shelfLifeDays !== undefined) {
    if (shelfLifeDays === null) data.shelfLifeDays = null;
    else if (toInt(shelfLifeDays) > 0) data.shelfLifeDays = toInt(shelfLifeDays);
    else throw httpError(400, 'shelfLifeDays must be a positive integer');
  }
  if (lowStockThreshold !== undefined) {
    if (!(toInt(lowStockThreshold) >= 0)) throw httpError(400, 'lowStockThreshold must be a non-negative integer');
    data.stock = { update: { lowStockThreshold: Number(lowStockThreshold) } };
  }

  if (Object.keys(data).length === 0) throw httpError(400, 'Nothing to update');

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.isArchived) throw httpError(404, 'Product not found');

  const product = await prisma.product.update({ where: { id }, data, include: { stock: true } });
  res.json({ message: 'Product updated', product });
});

// Soft delete (B4): sales history is kept for forecasting and reports.
app.delete('/api/products/:id', authenticate, authorize('Admin'), async (req, res) => {
  const id = parseId(req.params.id);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.isArchived) throw httpError(404, 'Product not found');

  await prisma.product.update({ where: { id }, data: { isArchived: true } });
  res.json({ message: 'Product archived. Sales history is kept.' });
});

// ===== STOCK ROUTES =====

// Set stock to an exact quantity (stock count correction)
app.put('/api/stock/:productId', authenticate, authorize(...STAFF), async (req, res) => {
  const productId = parseId(req.params.productId, 'productId');
  const quantity = req.body?.quantity;

  if (quantity === undefined) throw httpError(400, 'Quantity is required');
  if (!(toInt(quantity) >= 0)) throw httpError(400, 'Quantity must be a non-negative integer');

  const stock = await prisma.stock.update({ where: { productId }, data: { quantity: Number(quantity) } });
  res.json({ message: 'Stock updated', stock });
});

// New goods arrived: add to stock. Optional expiryDate records the new batch's expiry (B10).
app.post('/api/stock/:productId/restock', authenticate, authorize(...STAFF), async (req, res) => {
  const productId = parseId(req.params.productId, 'productId');
  const quantityAdded = toInt(req.body?.quantityAdded);

  if (!(quantityAdded > 0)) throw httpError(400, 'A valid positive quantity is required');

  const data = { quantity: { increment: quantityAdded } }; // atomic, no read-then-write
  if (req.body?.expiryDate) {
    const exp = new Date(req.body.expiryDate);
    if (Number.isNaN(exp.getTime())) throw httpError(400, 'Invalid expiryDate');
    data.expiryDate = exp;
  }

  const updated = await prisma.stock.update({ where: { productId }, data });

  res.json({ message: `${quantityAdded} units added`, newQuantity: updated.quantity, expiryDate: updated.expiryDate });
});

// Products below their low-stock threshold
app.get('/api/stock/low-stock', authenticate, async (req, res) => {
  const allStock = await prisma.stock.findMany({
    where: { product: { isArchived: false } },
    include: { product: true },
  });
  res.json(allStock.filter((s) => s.quantity < s.lowStockThreshold));
});

// ===== SALE ROUTES =====

app.post('/api/sales', authenticate, authorize(...STAFF), async (req, res) => {
  const productId = parseId(req.body?.productId, 'productId');
  const quantitySold = toInt(req.body?.quantitySold);
  const { salePrice, paymentMethod } = req.body || {};

  if (!(quantitySold > 0)) throw httpError(400, 'quantitySold must be a positive integer');
  if (salePrice !== undefined && salePrice !== null && !(Number(salePrice) > 0)) {
    throw httpError(400, 'salePrice must be a positive number');
  }
  if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod)) {
    throw httpError(400, `paymentMethod must be one of ${PAYMENT_METHODS.join(', ')}`);
  }

  const sale = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || product.isArchived) throw httpError(404, 'Product not found');

    // Atomic decrement: succeeds only if enough stock is left, so two
    // simultaneous sales of the last unit cannot both go through (B3).
    const dec = await tx.stock.updateMany({
      where: { productId: product.id, quantity: { gte: quantitySold } },
      data: { quantity: { decrement: quantitySold } },
    });
    if (dec.count === 0) throw httpError(409, 'Insufficient stock');

    return tx.sale.create({
      data: {
        productId: product.id,
        soldById: req.user.userId,
        quantitySold,
        salePrice: salePrice != null ? Number(salePrice) : product.price, // default to catalogue price
        paymentMethod: paymentMethod || 'Cash',
      },
    });
  });

  res.status(201).json({ message: 'Sale recorded', sale });
});

app.get('/api/sales', authenticate, async (req, res) => {
  const where = {};
  if (req.query.from || req.query.to) {
    where.saleDate = {};
    if (req.query.from) {
      const d = new Date(req.query.from);
      if (Number.isNaN(d.getTime())) throw httpError(400, 'Invalid from date');
      where.saleDate.gte = d;
    }
    if (req.query.to) {
      const d = new Date(req.query.to);
      if (Number.isNaN(d.getTime())) throw httpError(400, 'Invalid to date');
      where.saleDate.lte = d;
    }
  }
  const limit = Math.min(Math.max(toInt(req.query.limit) || 500, 1), 5000);

  const sales = await prisma.sale.findMany({
    where,
    include: { product: true, soldBy: { select: { name: true, email: true } } },
    orderBy: { saleDate: 'desc' },
    take: limit,
  });
  res.json(sales);
});

// ===== DASHBOARD (F9) =====
app.get('/api/dashboard', authenticate, async (req, res) => {
  const todayStart = startOfDay();
  const weekStart = addDays(todayStart, -6);

  const [sales, stocks, productCount, employeeCount] = await Promise.all([
    prisma.sale.findMany({
      where: { saleDate: { gte: weekStart } },
      select: { saleDate: true, quantitySold: true, salePrice: true },
    }),
    prisma.stock.findMany({
      where: { product: { isArchived: false } },
      select: { quantity: true, lowStockThreshold: true },
    }),
    prisma.product.count({ where: { isArchived: false } }),
    prisma.user.count({ where: { isActive: true, role: { name: { in: ['Manager', 'Employee'] } } } }),
  ]);

  const buckets = new Map();
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    buckets.set(dayKey(d), {
      date: dayKey(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: 0, units: 0, transactions: 0,
    });
  }
  for (const s of sales) {
    const b = buckets.get(dayKey(s.saleDate));
    if (!b) continue;
    b.revenue += s.quantitySold * s.salePrice;
    b.units += s.quantitySold;
    b.transactions += 1;
  }
  const daily = [...buckets.values()].map((b) => ({ ...b, revenue: Math.round(b.revenue * 100) / 100 }));
  const today = daily[daily.length - 1];

  res.json({
    today: { revenue: today.revenue, units: today.units, transactions: today.transactions },
    week: {
      revenue: Math.round(daily.reduce((a, b) => a + b.revenue, 0) * 100) / 100,
      units: daily.reduce((a, b) => a + b.units, 0),
      transactions: daily.reduce((a, b) => a + b.transactions, 0),
    },
    daily,
    productCount,
    lowStockCount: stocks.filter((s) => s.quantity < s.lowStockThreshold).length,
    employeeCount,
  });
});

// ===== PYTHON SERVICE PROXY (ML + GenAI) =====
const JSON_HEADERS = { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_KEY };

async function callService(base, path, body, timeoutMs = 30000) {
  let r;
  try {
    r = await fetch(base + path, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw httpError(503, 'The analytics service is unavailable right now. Please try again later.');
  }
  if (!r.ok) {
    let detail = '';
    try { const j = await r.json(); if (typeof j.detail === 'string') detail = j.detail; } catch { /* ignore */ }
    // 422 from the ML service means "not enough history" and is safe to show
    const err = httpError(r.status === 422 && detail ? 422 : 502, r.status === 422 && detail ? detail : `${path} failed (${r.status})`);
    err.upstreamStatus = r.status;
    throw err;
  }
  return r.json();
}

// One row per day for the last N days, zero-filled (the model needs 30+ days)
async function dailyHistory(productId, days = 60) {
  const since = addDays(startOfDay(), -(days - 1));
  const sales = await prisma.sale.findMany({
    where: { productId, saleDate: { gte: since } },
    select: { saleDate: true, quantitySold: true },
  });
  const byDay = {};
  for (const s of sales) {
    const k = dayKey(s.saleDate);
    byDay[k] = (byDay[k] || 0) + s.quantitySold;
  }
  return Array.from({ length: days }, (_, i) => {
    const k = dayKey(addDays(since, i));
    return { date: k, sales: byDay[k] || 0 };
  });
}

app.get('/api/forecast/:productId', authenticate, async (req, res) => {
  const productId = parseId(req.params.productId, 'productId');
  const days = Math.min(Math.max(toInt(req.query.days) || 7, 1), 30);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.isArchived) throw httpError(404, 'Product not found');

  const history = await dailyHistory(productId);
  res.json(await callService(ML_URL, '/forecast', { store: 1, item: productId, days, history }));
});

app.get('/api/restock-recommendations', authenticate, async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    include: { stock: true },
    orderBy: { id: 'asc' },
  });

  async function recommend(p) {
    try {
      const f = await callService(ML_URL, '/forecast', { store: 1, item: p.id, days: 7, history: await dailyHistory(p.id) });
      const r = await callService(ML_URL, '/restock', {
        predicted_demand: f.total_demand,
        current_stock: p.stock?.quantity || 0,
        low_stock_threshold: p.stock?.lowStockThreshold || 0,
        product_id: p.id,
      });
      return { name: p.name, ...r };
    } catch (e) {
      if (e.upstreamStatus === 422) return null; // too little history: skip this product
      throw e;                                    // service down etc.: fail the whole request
    }
  }

  const out = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = await Promise.all(products.slice(i, i + CONCURRENCY).map(recommend));
    out.push(...batch.filter(Boolean));
  }
  res.json(out);
});

// Anomaly detection: the detection code is not in the repo yet (A1).
// Once ml-service exposes POST /anomalies this route starts working with no change.
app.get('/api/anomalies', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  const since = addDays(startOfDay(), -89);
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: since } },
    include: { soldBy: { select: { employeeCode: true } } },
  });
  const rows = sales.map((s) => ({
    date: dayKey(s.saleDate),
    hour: s.saleDate.getHours(),
    product_id: s.productId,
    employee_code: s.soldBy?.employeeCode ?? null,
    sales: s.quantitySold,
  }));

  try {
    res.json(await callService(ML_URL, '/anomalies', { store: 1, history: rows }, 60000));
  } catch (e) {
    if (e.upstreamStatus === 404) throw httpError(501, 'Anomaly detection is not available yet');
    throw e;
  }
});

// ---- GenAI: compact business summary built from the database (G5) ----
async function buildBusinessData() {
  const since = addDays(new Date(), -7);
  const [products, sales, expiryRisk] = await Promise.all([
    prisma.product.findMany({ where: { isArchived: false }, include: { stock: true } }),
    prisma.sale.findMany({ where: { saleDate: { gte: since } }, include: { product: true } }),
    computeExpiryRisk(),
  ]);

  const revenue = sales.reduce((a, s) => a + s.quantitySold * s.salePrice, 0);

  const unitsByProduct = new Map();
  for (const s of sales) {
    unitsByProduct.set(s.product.name, (unitsByProduct.get(s.product.name) || 0) + s.quantitySold);
  }
  const topProducts = [...unitsByProduct.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, units]) => ({ name, units }));

  return {
    sales: { last7DaysRevenue: Math.round(revenue * 100) / 100, transactions: sales.length, topProducts },
    inventory: {
      totalProducts: products.length,
      lowStock: products
        .filter((p) => p.stock && p.stock.quantity < p.stock.lowStockThreshold)
        .slice(0, 50)
        .map((p) => ({ name: p.name, quantity: p.stock.quantity, threshold: p.stock.lowStockThreshold })),
    },
    expiryRisk: expiryRisk.filter((e) => e.isAtRisk).slice(0, 25).map((e) => ({
      name: e.productName, stock: e.currentStock, daysLeft: e.daysLeftToExpiry,
      expectedLeftover: e.expectedLeftover, status: e.status,
    })),
  };
}

app.post('/api/assistant', authenticate, async (req, res) => {
  const question = String(req.body?.question || '').trim();
  if (!question) throw httpError(400, 'Question is required');
  if (question.length > 1000) throw httpError(400, 'Question is too long (max 1000 characters)');

  res.json(await callService(GENAI_URL, '/assistant',
    { question, business_data: await buildBusinessData() }, 60000));
});

app.post('/api/report', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  const period = req.body?.period || 'weekly';
  if (!['daily', 'weekly', 'monthly'].includes(period)) throw httpError(400, 'period must be daily, weekly or monthly');

  res.json(await callService(GENAI_URL, '/report',
    { period, business_data: await buildBusinessData() }, 60000));
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/voice', authenticate, upload.single('audio'), async (req, res) => {
  if (!req.file) throw httpError(400, 'Audio file is required (field name: audio)');

  const fd = new FormData();
  fd.append('audio', new Blob([req.file.buffer]), req.file.originalname || 'audio.webm');
  fd.append('business_data', JSON.stringify(await buildBusinessData()));
  fd.append('language', req.body?.language || 'hi');

  let r;
  try {
    r = await fetch(`${GENAI_URL}/voice`, {
      method: 'POST',
      headers: { 'X-Internal-Key': INTERNAL_KEY },
      body: fd,
      signal: AbortSignal.timeout(120000),
    });
  } catch (e) {
    throw httpError(503, 'The voice service is unavailable right now. Please try again later.');
  }
  if (!r.ok) throw httpError(502, `Voice service failed (${r.status})`);
  res.json(await r.json()); // { question_text, answer_text, audio_base64 }
});

// ===== 404 + CENTRAL ERROR HANDLER (B8) =====
// Must be the LAST middleware. Express 5 forwards errors from async handlers here.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Known Prisma errors -> proper HTTP codes without leaking internals
  if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'A record with this value already exists' });
  if (err.code === 'P2003') return res.status(409).json({ error: 'This record is referenced by other data' });
  if (err.code === 'P2034') return res.status(409).json({ error: 'Conflicting request, please try again' });

  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10 MB)' });

  // httpError(...) and body-parser errors carry a status and a safe message
  if (err.status) return res.status(err.status).json({ error: err.message });

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== SERVER START (keep at the very end of the file) =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
