const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '1h';

describe('Order API', () => {
  let userToken;
  let adminToken;
  let product1Id;
  let product2Id;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'admin123' });
    await User.updateOne({ email: 'admin@test.com' }, { role: 'admin' });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminLogin.body.data.token;

    // Create user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@test.com', password: 'user123' });
    userToken = userRes.body.data.token;

    // Create category and products
    const category = await Category.create({ name: 'Test' });

    const p1 = await Product.create({
      name: 'Product A',
      sku: 'PA-001',
      description: 'Product A desc',
      price: 100.00,
      stock: 10,
      category: category._id,
    });
    product1Id = p1._id.toString();

    const p2 = await Product.create({
      name: 'Product B',
      sku: 'PB-002',
      description: 'Product B desc',
      price: 50.00,
      stock: 20,
      category: category._id,
    });
    product2Id = p2._id.toString();
  });

  describe('POST /api/orders', () => {
    it('should create an order with correct total calculation', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            { product: product1Id, quantity: 2 },
            { product: product2Id, quantity: 3 },
          ],
          paymentProvider: 'stripe',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.items).toHaveLength(2);
      // Deterministic total: (100 * 2) + (50 * 3) = 350
      expect(res.body.data.order.totalAmount).toBe(350);
      expect(res.body.data.order.status).toBe('pending');
    });

    it('should reject order with insufficient stock', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ product: product1Id, quantity: 999 }],
          paymentProvider: 'stripe',
        });

      expect(res.status).toBe(400);
    });

    it('should reject order without items', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [],
          paymentProvider: 'stripe',
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated order creation', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ product: product1Id, quantity: 1 }],
          paymentProvider: 'stripe',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ product: product1Id, quantity: 1 }],
          paymentProvider: 'stripe',
        });
    });

    it('should get user orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
    });

    it('should get all orders as admin', async () => {
      const res = await request(app)
        .get('/api/orders/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
    });
  });
});
