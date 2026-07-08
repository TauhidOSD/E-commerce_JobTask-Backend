const PaymentStrategy = require('./PaymentStrategy');
const stripe = require('../config/stripe');
const logger = require('../utils/logger');

/**
 * StripeStrategy - Concrete implementation of PaymentStrategy for Stripe
 * Handles PaymentIntent creation, confirmation, and webhook processing
 */
class StripeStrategy extends PaymentStrategy {
  constructor() {
    super('stripe');
  }

  /**
   * Create a Stripe PaymentIntent
   * @param {Object} order - Order document
   * @param {Object} options - { currency }
   * @returns {Promise<Object>} { transactionId, clientSecret, status }
   */
  async initiatePayment(order, options = {}) {
    try {
      const amountInCents = Math.round(order.totalAmount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: options.currency || 'usd',
        metadata: {
          orderId: order._id.toString(),
          userId: order.user.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Stripe PaymentIntent created: ${paymentIntent.id} for order ${order._id}`);

      return {
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: 'pending',
        rawResponse: paymentIntent,
      };
    } catch (error) {
      logger.error(`Stripe initiatePayment error: ${error.message}`);
      throw new Error(`Stripe payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Confirm Stripe payment (usually handled client-side, this is for verification)
   * @param {string} transactionId - PaymentIntent ID
   * @returns {Promise<Object>}
   */
  async confirmPayment(transactionId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

      const status = paymentIntent.status === 'succeeded' ? 'success'
        : paymentIntent.status === 'requires_payment_method' ? 'failed'
        : 'pending';

      logger.info(`Stripe payment ${transactionId} status: ${status}`);

      return {
        transactionId: paymentIntent.id,
        status,
        rawResponse: paymentIntent,
      };
    } catch (error) {
      logger.error(`Stripe confirmPayment error: ${error.message}`);
      throw new Error(`Stripe payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Process Stripe webhook events
   * @param {Buffer} payload - Raw request body
   * @param {Object} headers - Request headers with stripe-signature
   * @returns {Promise<Object>} { eventType, transactionId, status, orderId }
   */
  async handleWebhook(payload, headers = {}) {
    try {
      let event;

      if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_test_secret') {
        const sig = headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        // For development/testing without webhook secret
        event = JSON.parse(payload.toString());
      }

      logger.info(`Stripe webhook received: ${event.type}`);

      let result = {
        eventType: event.type,
        transactionId: null,
        status: null,
        orderId: null,
        rawResponse: event,
      };

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          result.transactionId = paymentIntent.id;
          result.status = 'success';
          result.orderId = paymentIntent.metadata?.orderId;
          break;
        }
        case 'payment_intent.payment_failed': {
          const failedIntent = event.data.object;
          result.transactionId = failedIntent.id;
          result.status = 'failed';
          result.orderId = failedIntent.metadata?.orderId;
          break;
        }
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      return result;
    } catch (error) {
      logger.error(`Stripe webhook error: ${error.message}`);
      throw new Error(`Stripe webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Query Stripe payment status
   * @param {string} transactionId - PaymentIntent ID
   * @returns {Promise<Object>}
   */
  async queryPayment(transactionId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

      return {
        transactionId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'success'
          : paymentIntent.status === 'canceled' ? 'failed'
          : 'pending',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        rawResponse: paymentIntent,
      };
    } catch (error) {
      logger.error(`Stripe queryPayment error: ${error.message}`);
      throw new Error(`Stripe payment query failed: ${error.message}`);
    }
  }
}

module.exports = StripeStrategy;
