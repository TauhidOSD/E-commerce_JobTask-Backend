const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderEntity = require('../classes/OrderEntity');
const ProductService = require('./ProductService');
const logger = require('../utils/logger');

/**
 * OrderService - Handles order creation, status management, and retrieval
 */
class OrderService {
  /**
   * Create a new order with deterministic total calculation
   * @param {string} userId
   * @param {Object} data - { items: [{product, quantity}], shippingAddress, paymentProvider }
   * @returns {Promise<Object>}
   */
  static async create(userId, data) {
    const orderEntity = new OrderEntity({
      user: userId,
      shippingAddress: data.shippingAddress,
      paymentProvider: data.paymentProvider,
    });

    // Validate and add items with deterministic calculation
    for (const item of data.items) {
      const product = await Product.findById(item.product);

      if (!product) {
        const error = new Error(`Product not found: ${item.product}`);
        error.statusCode = 404;
        throw error;
      }

      if (product.status !== 'active') {
        const error = new Error(`Product "${product.name}" is not available`);
        error.statusCode = 400;
        throw error;
      }

      if (product.stock < item.quantity) {
        const error = new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
        error.statusCode = 400;
        throw error;
      }

      orderEntity.addItem(product, item.quantity);
    }

    // Validate order
    const validation = orderEntity.validate();
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    // Create order in database
    const order = await Order.create(orderEntity.toData());
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name sku price images');

    logger.info(`Order created: ${order._id} by user ${userId}`);

    return populatedOrder;
  }

  /**
   * Get orders for a user
   * @param {string} userId
   * @param {Object} query - { page, limit, status }
   * @returns {Promise<Object>}
   */
  static async getUserOrders(userId, query = {}) {
    const { page = 1, limit = 10, status } = query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name sku price images')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    };
  }

  /**
   * Get all orders (Admin)
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  static async getAllOrders(query = {}) {
    const { page = 1, limit = 20, status } = query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .populate('items.product', 'name sku price images')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    };
  }

  /**
   * Get order by ID
   * @param {string} orderId
   * @param {string} userId - Optional, for user-specific access check
   * @returns {Promise<Object>}
   */
  static async getById(orderId, userId = null) {
    const filter = { _id: orderId };
    if (userId) filter.user = userId;

    const order = await Order.findOne(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name sku price images')
      .populate({
        path: 'payment',
        select: 'provider transactionId status amount createdAt',
      });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    return order;
  }

  /**
   * Update order status with stock management
   * @param {string} orderId
   * @param {string} newStatus
   * @returns {Promise<Object>}
   */
  static async updateStatus(orderId, newStatus) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    const orderEntity = new OrderEntity(order.toObject());

    // Validate transition
    if (!orderEntity.canTransitionTo(newStatus)) {
      const error = new Error(
        `Cannot transition order from "${order.status}" to "${newStatus}"`
      );
      error.statusCode = 400;
      throw error;
    }

    // If transitioning to 'paid', reduce stock
    if (newStatus === 'paid') {
      await ProductService.reduceStock(
        order.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }))
      );
    }

    // If canceling a paid order, restore stock
    if (newStatus === 'canceled' && order.status === 'paid') {
      await ProductService.restoreStock(
        order.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }))
      );
    }

    order.status = newStatus;
    await order.save();

    logger.info(`Order ${orderId} status updated to ${newStatus}`);

    return order;
  }
}

module.exports = OrderService;
