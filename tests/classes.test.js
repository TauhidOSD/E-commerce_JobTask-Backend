const OrderEntity = require('../src/classes/OrderEntity');
const ProductEntity = require('../src/classes/ProductEntity');
const PaymentEntity = require('../src/classes/PaymentEntity');
const UserEntity = require('../src/classes/UserEntity');

describe('OOP Classes', () => {
  describe('UserEntity', () => {
    it('should validate correct user data', () => {
      const user = new UserEntity({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const validation = user.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid email', () => {
      const user = new UserEntity({
        name: 'John',
        email: 'invalid',
        password: 'password123',
      });

      const validation = user.validate();
      expect(validation.isValid).toBe(false);
    });

    it('should reject short password', () => {
      const user = new UserEntity({
        name: 'John',
        email: 'john@example.com',
        password: '123',
      });

      const validation = user.validate();
      expect(validation.isValid).toBe(false);
    });

    it('should strip password from public representation', () => {
      const publicUser = UserEntity.toPublic({
        name: 'John',
        email: 'john@example.com',
        password: 'hashed_password',
        toObject: function () {
          return { name: this.name, email: this.email, password: this.password };
        },
      });

      expect(publicUser.password).toBeUndefined();
    });
  });

  describe('ProductEntity', () => {
    it('should check availability correctly', () => {
      const product = new ProductEntity({ stock: 10, status: 'active' });
      expect(product.isAvailable(5)).toBe(true);
      expect(product.isAvailable(15)).toBe(false);
    });

    it('should calculate subtotal deterministically', () => {
      const product = new ProductEntity({ price: 29.99 });
      expect(product.calculateSubtotal(3)).toBe(89.97);
    });

    it('should reduce stock safely', () => {
      const product = new ProductEntity({ name: 'Test', stock: 10 });
      const newStock = product.reduceStock(3);
      expect(newStock).toBe(7);
    });

    it('should throw on insufficient stock', () => {
      const product = new ProductEntity({ name: 'Test', stock: 2 });
      expect(() => product.reduceStock(5)).toThrow('Insufficient stock');
    });

    it('should restore stock', () => {
      const product = new ProductEntity({ stock: 5 });
      const newStock = product.restoreStock(3);
      expect(newStock).toBe(8);
    });

    it('should generate SKU', () => {
      const sku = ProductEntity.generateSku('Test Product');
      expect(sku).toMatch(/^TEST-\d{4}$/);
    });
  });

  describe('OrderEntity', () => {
    it('should calculate total deterministically', () => {
      const order = new OrderEntity({
        user: 'user123',
        items: [
          { price: 100, quantity: 2, subtotal: 200 },
          { price: 50, quantity: 3, subtotal: 150 },
        ],
      });

      const total = order.recalculateTotal();
      expect(total).toBe(350);
    });

    it('should validate status transitions', () => {
      const order = new OrderEntity({ status: 'pending' });
      expect(order.canTransitionTo('paid')).toBe(true);
      expect(order.canTransitionTo('canceled')).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      const order = new OrderEntity({ status: 'canceled' });
      expect(order.canTransitionTo('paid')).toBe(false);
    });

    it('should transition status', () => {
      const order = new OrderEntity({ status: 'pending' });
      order.transitionTo('paid');
      expect(order.status).toBe('paid');
    });

    it('should throw on invalid transition', () => {
      const order = new OrderEntity({ status: 'canceled' });
      expect(() => order.transitionTo('paid')).toThrow();
    });

    it('should validate order', () => {
      const order = new OrderEntity({ user: 'user1', items: [], totalAmount: 0 });
      const validation = order.validate();
      expect(validation.isValid).toBe(false);
    });
  });

  describe('PaymentEntity', () => {
    it('should validate providers', () => {
      expect(PaymentEntity.isValidProvider('stripe')).toBe(true);
      expect(PaymentEntity.isValidProvider('bkash')).toBe(true);
      expect(PaymentEntity.isValidProvider('paypal')).toBe(false);
    });

    it('should validate status transitions', () => {
      const payment = new PaymentEntity({ status: 'pending' });
      expect(payment.canTransitionTo('success')).toBe(true);
      expect(payment.canTransitionTo('failed')).toBe(true);
    });

    it('should prevent invalid transitions', () => {
      const payment = new PaymentEntity({ status: 'success' });
      expect(payment.canTransitionTo('pending')).toBe(false);
    });

    it('should check if payment is successful', () => {
      const payment = new PaymentEntity({ status: 'success' });
      expect(payment.isSuccessful()).toBe(true);
    });

    it('should validate payment data', () => {
      const payment = new PaymentEntity({
        order: null,
        provider: 'invalid',
        amount: -10,
      });

      const validation = payment.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
