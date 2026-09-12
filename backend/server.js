const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET);

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());


// ===== TEST ROUTE =====
app.get('/', (req, res) => {
  res.send('RetailIQ backend is running ✅');
});

// ===== MIDDLEWARE: Token Check Karo =====
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nahi mila. Login karo pehle.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { userId, role } — yeh aage ke functions mein use hoga
    next();  // sab sahi hai, aage badho
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid ya expire ho gaya' });
  }
}

// ===== MIDDLEWARE: Role Check Karo =====
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Sirf ${allowedRoles.join(' ya ')} yeh kar sakte hain.`
      });
    }
    next();
  };
}

// ===== 1. SIGNUP (Sirf Pehla User = Admin) =====
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Naam, email, aur password zaroori hai' });
    }

    const existingUserCount = await prisma.user.count();

    if (existingUserCount > 0) {
      return res.status(403).json({
        error: 'Signup band hai. Sirf Admin naye staff members invite kar sakta hai.'
      });
    }

    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: { name: 'Admin' }
    });
    await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: { name: 'Manager' }
    });
    await prisma.role.upsert({
      where: { name: 'Employee' },
      update: {},
      create: { name: 'Employee' }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Admin account ban gaya!',
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'Admin' }
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== 2. ADMIN — INVITE STAFF =====
app.post('/api/invite-staff', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, roleName } = req.body;

    if (!name || !email || !roleName) {
      return res.status(400).json({ error: 'Naam, email, aur role zaroori hai' });
    }

    if (!['Manager', 'Employee'].includes(roleName)) {
      return res.status(400).json({ error: 'Role sirf Manager ya Employee ho sakta hai' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Is email se pehle se account hai' });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });

    const inviteToken = crypto.randomBytes(32).toString('hex');

    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        roleId: role.id,
        isActive: false,
        inviteToken,
        password: null
      }
    });

    console.log(`Invite link for ${email}: http://localhost:3000/set-password?token=${inviteToken}`);

    res.status(201).json({
      message: `${roleName} ko invite kar diya gaya`,
      inviteLink: `http://localhost:3000/set-password?token=${inviteToken}`
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== 3. SET PASSWORD (Invited Staff Ke Liye) =====
app.post('/api/set-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token aur password zaroori hai' });
    }

    const user = await prisma.user.findUnique({ where: { inviteToken: token } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid ya expired invite link' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isActive: true,
        inviteToken: null
      }
    });

    res.json({ message: 'Password set ho gaya! Ab aap login kar sakte hain.' });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== 4. LOGIN =====
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials ya account abhi active nahi hai' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.name }
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== PRODUCT ROUTES =====

// Naya product add karo (Stock ke saath)
app.post('/api/products', authenticate, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const { name, category, price, cost, initialStock, lowStockThreshold, isPerishable, shelfLifeDays } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Naam aur price zaroori hai' });
    }

    let expiryDate = null;
    if (isPerishable && shelfLifeDays) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    }

    const product = await prisma.product.create({
      data: {
        name,
        category: category || null,
        price,
        cost: cost || null,
        isPerishable: isPerishable || false,
        shelfLifeDays: shelfLifeDays || null,
        stock: {
          create: {
            quantity: initialStock || 0,
            lowStockThreshold: lowStockThreshold || 10,
            expiryDate
          }
        }
      },
      include: { stock: true }
    });

    res.status(201).json({ message: 'Product ban gaya', product });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Sab products dekho (Admin, Manager, Employee sab dekh sakte hain)
app.get('/api/products', authenticate, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { stock: true }
    });
    res.json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== EXPIRY RISK CHECK =====
// IMPORTANT: Yeh route "/api/products/:id" se UPAR hona chahiye,
// warna Express "expiry-risk" ko :id samajh lega!
app.get('/api/products/expiry-risk', authenticate, async (req, res) => {
  try {
    // Sirf perishable products lo, jinki expiry date set hai
    const perishableProducts = await prisma.product.findMany({
      where: { isPerishable: true },
      include: { stock: true }
    });

    const riskReport = [];

    for (const product of perishableProducts) {
      if (!product.stock || !product.stock.expiryDate) continue;

      const today = new Date();
      const expiry = new Date(product.stock.expiryDate);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      // Pichle 7 din ka sales data nikalo, average daily rate ke liye
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSales = await prisma.sale.findMany({
        where: {
          productId: product.id,
          saleDate: { gte: sevenDaysAgo }
        }
      });

      const totalSoldRecently = recentSales.reduce((sum, s) => sum + s.quantitySold, 0);
      const avgDailySaleRate = totalSoldRecently / 7;

      const predictedSalesTillExpiry = Math.round(avgDailySaleRate * daysLeft);
      const currentStock = product.stock.quantity;
      const expectedLeftover = currentStock - predictedSalesTillExpiry;

      riskReport.push({
        productName: product.name,
        currentStock,
        daysLeftToExpiry: daysLeft,
        avgDailySaleRate: avgDailySaleRate.toFixed(1),
        predictedSalesTillExpiry,
        expectedLeftover,
        isAtRisk: expectedLeftover > 0
      });
    }

    res.json(riskReport);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Ek specific product dekho
// IMPORTANT: Yeh route hamesha "expiry-risk" jaise specific routes ke NICHE hona chahiye
app.get('/api/products/:id', authenticate, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { stock: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Product update karo (naam, price, category)
app.put('/api/products/:id', authenticate, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const { name, category, price, cost } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { name, category, price, cost }
    });

    res.json({ message: 'Product update ho gaya', product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Product delete karo (SIRF Admin)
app.delete('/api/products/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const productId = Number(req.params.id);

    // Pehle related Stock record delete karo (agar hai)
    await prisma.stock.deleteMany({
      where: { productId }
    });

    // Ab Product delete karo
    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({ message: 'Product delete ho gaya' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== STOCK ROUTES =====

// Stock quantity update karo (jaise naya maal aaya, ya sale hone pe kam hua)
app.put('/api/stock/:productId', authenticate, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity zaroori hai' });
    }

    const stock = await prisma.stock.update({
      where: { productId: Number(req.params.productId) },
      data: { quantity }
    });

    res.json({ message: 'Stock update ho gaya', stock });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Naya maal aaye toh stock add karo (restock)
app.post('/api/stock/:productId/restock', authenticate, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const { quantityAdded } = req.body;

    if (!quantityAdded || quantityAdded <= 0) {
      return res.status(400).json({ error: 'Valid quantity zaroori hai' });
    }

    const stock = await prisma.stock.findUnique({
      where: { productId: Number(req.params.productId) }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock record nahi mila' });
    }

    const updatedStock = await prisma.stock.update({
      where: { productId: Number(req.params.productId) },
      data: { quantity: stock.quantity + quantityAdded }
    });

    res.json({
      message: `${quantityAdded} units add ho gaye`,
      newQuantity: updatedStock.quantity
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Low-stock products dekho (jo threshold se neeche hain)
app.get('/api/stock/low-stock', authenticate, async (req, res) => {
  try {
    const allStock = await prisma.stock.findMany({
      include: { product: true }
    });

    const lowStock = allStock.filter(s => s.quantity < s.lowStockThreshold);

    res.json(lowStock);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== SALE ROUTES =====

// Naya sale record karo
app.post('/api/sales', authenticate, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const { productId, quantitySold, salePrice } = req.body;

    if (!productId || !quantitySold || !salePrice) {
      return res.status(400).json({ error: 'Product, quantity, aur price zaroori hai' });
    }

    // Transaction — dono operations ek saath hongi, ya dono fail
    const result = await prisma.$transaction(async (tx) => {

      const stock = await tx.stock.findUnique({
        where: { productId: Number(productId) }
      });

      if (!stock) {
        throw new Error('Is product ka stock record nahi mila');
      }

      if (stock.quantity < quantitySold) {
        throw new Error(`Sirf ${stock.quantity} units available hain, ${quantitySold} nahi ho sakta`);
      }

      // Sale create karo
      const sale = await tx.sale.create({
        data: {
          productId: Number(productId),
          soldById: req.user.userId,
          quantitySold,
          salePrice
        }
      });

      // Stock automatically kam karo
      await tx.stock.update({
        where: { productId: Number(productId) },
        data: { quantity: stock.quantity - quantitySold }
      });

      return sale;
    });

    res.status(201).json({ message: 'Sale record ho gaya', sale: result });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Sab sales dekho
app.get('/api/sales', authenticate, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { product: true, soldBy: { select: { name: true, email: true } } },
      orderBy: { saleDate: 'desc' }
    });
    res.json(sales);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ===== SERVER START (SABSE NICHE — YEH HAMESHA FILE KE END MEIN HONA CHAHIYE) =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});