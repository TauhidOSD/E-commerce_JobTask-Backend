const Payment = require('../models/Payment');
const Order = require('../models/Order');
const paymentContext = require('../strategies/PaymentContext');
const PaymentEntity = require('../classes/PaymentEntity');
const ProductService = require('./ProductService');
const logger = require('../utils/logger');

/**
 * PaymentService - Orchestrates payment flow using Strategy Pattern
 */
class PaymentService {
  /**
   * Initiate payment for an order
   * @param {string} orderId
   * @param {string} provider - 'stripe' or 'bkash'
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Payment initiation result
   */
  static async initiatePayment(orderId, provider, options = {}) {
    // Validate provider
    if (!PaymentEntity.isValidProvider(provider)) {
      const error = new Error(`Invalid payment provider: ${provider}`);
      error.statusCode = 400;
      throw error;
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.status !== 'pending') {
      const error = new Error(`Cannot pay for order with status: ${order.status}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({
      order: orderId,
      status: { $in: ['pending', 'success'] },
    });

    if (existingPayment && existingPayment.status === 'success') {
      const error = new Error('Order already paid');
      error.statusCode = 400;
      throw error;
    }

    // Use Strategy Pattern to initiate payment
    const result = await paymentContext.initiatePayment(provider, order, options);

    // Create or update payment record
    let payment;
    if (existingPayment) {
      existingPayment.provider = provider;
      existingPayment.transactionId = result.transactionId;
      existingPayment.status = 'pending';
      existingPayment.rawResponse = result.rawResponse;
      payment = await existingPayment.save();
    } else {
      const paymentEntity = new PaymentEntity({
        order: orderId,
        provider,
        transactionId: result.transactionId,
        status: 'pending',
        amount: order.totalAmount,
        rawResponse: result.rawResponse,
      });

      payment = await Payment.create(paymentEntity.toData());
    }

    logger.info(`Payment initiated for order ${orderId} via ${provider}`);

    return {
      payment,
      ...result,
    };
  }

  /**
   * Confirm payment
   * @param {string} paymentId - Our internal payment ID or transaction ID
   * @param {string} provider
   * @returns {Promise<Object>}
   */
  static async confirmPayment(paymentId, provider) {
    // Find payment by transaction ID or our internal ID
    let payment = await Payment.findOne({
      $or: [
        { transactionId: paymentId },
        { _id: paymentId.match(/^[0-9a-fA-F]{24}$/) ? paymentId : undefined },
      ].filter((q) => q !== undefined),
    });

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    // Use Strategy Pattern to confirm
    const result = await paymentContext.confirmPayment(
      provider || payment.provider,
      payment.transactionId
    );

    // Update payment status
    payment.status = result.status;
    payment.rawResponse = result.rawResponse;
    if (result.trxID) {
      payment.metadata = { ...payment.metadata, trxID: result.trxID };
    }
    await payment.save();

    // If payment succeeded, update order status and reduce stock
    if (result.status === 'success') {
      const order = await Order.findById(payment.order);
      if (order && order.status === 'pending') {
        // Reduce stock atomically
        await ProductService.reduceStock(
          order.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          }))
        );

        order.status = 'paid';
        await order.save();
        logger.info(`Order ${order._id} marked as paid`);
      }
    }

    logger.info(`Payment ${payment._id} confirmed with status: ${result.status}`);

    return { payment, result };
  }

  /**
   * Process Stripe webhook
   * @param {Buffer} payload - Raw body
   * @param {Object} headers
   * @returns {Promise<Object>}
   */
  static async processStripeWebhook(payload, headers) {
    const result = await paymentContext.handleWebhook('stripe', payload, headers);

    if (result.transactionId && result.status) {
      const payment = await Payment.findOne({
        transactionId: result.transactionId,
      });

      if (payment) {
        payment.status = result.status;
        payment.rawResponse = result.rawResponse;
        await payment.save();

        // Update order if payment succeeded
        if (result.status === 'success') {
          const order = await Order.findById(payment.order);
          if (order && order.status === 'pending') {
            await ProductService.reduceStock(
              order.items.map((item) => ({
                product: item.product,
                quantity: item.quantity,
              }))
            );
            order.status = 'paid';
            await order.save();
            logger.info(`Order ${order._id} paid via Stripe webhook`);
          }
        } else if (result.status === 'failed') {
          const order = await Order.findById(payment.order);
          if (order) {
            logger.info(`Payment failed for order ${order._id} via Stripe webhook`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Process bKash callback
   * @param {Object} payload - { paymentID, status }
   * @returns {Promise<Object>}
   */
  static async processBkashCallback(payload) {
    const result = await paymentContext.handleWebhook('bkash', payload);

    if (result.transactionId && result.status) {
      const payment = await Payment.findOne({
        transactionId: result.transactionId,
      });

      if (payment) {
        payment.status = result.status;
        payment.rawResponse = result.rawResponse;
        if (result.trxID) {
          payment.metadata = { ...payment.metadata, trxID: result.trxID };
        }
        await payment.save();

        // Update order if payment succeeded
        if (result.status === 'success') {
          const order = await Order.findById(payment.order);
          if (order && order.status === 'pending') {
            await ProductService.reduceStock(
              order.items.map((item) => ({
                product: item.product,
                quantity: item.quantity,
              }))
            );
            order.status = 'paid';
            await order.save();
            logger.info(`Order ${order._id} paid via bKash callback`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Get payment by order ID
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  static async getByOrderId(orderId) {
    const payment = await Payment.findOne({ order: orderId }).populate(
      'order',
      'totalAmount status'
    );
    return payment;
  }

  /**
   * Get user's payment history
   * @param {string} userId
   * @returns {Promise<Object[]>}
   */
  static async getUserPayments(userId) {
    const orders = await Order.find({ user: userId }).select('_id');
    const orderIds = orders.map((o) => o._id);

    const payments = await Payment.find({ order: { $in: orderIds } })
      .populate('order', 'totalAmount status items')
      .sort('-createdAt');

    return payments;
  }
}

module.exports = PaymentService;
