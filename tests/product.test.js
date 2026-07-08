const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Category = require('../src/models/Category');

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '1h';

describe('Product API', () => {
  let adminToken;
  let userToken;
  let categoryId;

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
    adminToken = adminRes.body.data.token;

    // Set admin role directly
    const User = require('../src/models/User');
    await User.updateOne({ email: 'admin@test.com' }, { role: 'admin' });

    // Re-login to get updated token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = loginRes.body.data.token;

    // Create regular user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@test.com', password: 'user123' });
    userToken = userRes.body.data.token;

    // Create category
    const category = await Category.create({ name: 'Test Category' });
    categoryId = category._id.toString();
  });

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          sku: 'TEST-001',
          description: 'A test product',
          price: 99.99,
          stock: 10,
          category: categoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.product.name).toBe('Test Product');
      expect(res.body.data.product.sku).toBe('TEST-001');
    });

    it('should not create product as regular user', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Product',
          sku: 'TEST-001',
          description: 'A test product',
          price: 99.99,
          stock: 10,
          category: categoryId,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product 1',
          sku: 'PRD-001',
          description: 'Product 1 description',
          price: 29.99,
          stock: 100,
          category: categoryId,
        });

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product 2',
          sku: 'PRD-002',
          description: 'Product 2 description',
          price: 49.99,
          stock: 50,
          category: categoryId,
        });
    });

    it('should list all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter by search', async () => {
      const res = await request(app).get('/api/products?search=Product 1');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product as admin', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Original Product',
          sku: 'UPD-001',
          description: 'Original description',
          price: 19.99,
          stock: 20,
          category: categoryId,
        });

      const productId = createRes.body.data.product._id;

      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 24.99, stock: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data.product.price).toBe(24.99);
      expect(res.body.data.product.stock).toBe(30);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product as admin', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Delete Me',
          sku: 'DEL-001',
          description: 'To be deleted',
          price: 9.99,
          stock: 5,
          category: categoryId,
        });

      const productId = createRes.body.data.product._id;

      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
