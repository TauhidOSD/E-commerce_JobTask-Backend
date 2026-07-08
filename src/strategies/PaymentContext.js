const StripeStrategy = require('./StripeStrategy');
const BkashStrategy = require('./BkashStrategy');
const logger = require('../utils/logger');

/**
 * PaymentContext - Context class for Strategy Pattern
 * Selects and delegates to the appropriate payment strategy
 * based on the provider string. New providers can be added
 * by creating a new Strategy class and registering it here.
 */
class PaymentContext {
  constructor() {
    // Registry of available strategies
    this.strategies = {
      stripe: new StripeStrategy(),
      bkash: new BkashStrategy(),
    };
  }

  /**
   * Factory method: Get strategy by provider name
   * @param {string} provider - 'stripe' or 'bkash'
   * @returns {PaymentStrategy}
   * @throws {Error} If provider is not supported
   */
  getStrategy(provider) {
    const strategy = this.strategies[provider];

    if (!strategy) {
      const supported = Object.keys(this.strategies).join(', ');
      throw new Error(`Unsupported payment provider: "${provider}". Supported: ${supported}`);
    }

    logger.info(`Payment strategy selected: ${provider}`);
    return strategy;
  }

  /**
   * Register a new payment strategy (extensibility)
   * @param {string} name - Provider name
   * @param {PaymentStrategy} strategy - Strategy instance
   */
  registerStrategy(name, strategy) {
    this.strategies[name] = strategy;
    logger.info(`New payment strategy registered: ${name}`);
  }

  /**
   * Get list of available providers
   * @returns {string[]}
   */
  getAvailableProviders() {
    return Object.keys(this.strategies);
  }

  /**
   * Initiate payment using the specified provider
   * @param {string} provider
   * @param {Object} order
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async initiatePayment(provider, order, options = {}) {
    const strategy = this.getStrategy(provider);
    return await strategy.initiatePayment(order, options);
  }

  /**
   * Confirm payment using the specified provider
   * @param {string} provider
   * @param {string} transactionId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async confirmPayment(provider, transactionId, options = {}) {
    const strategy = this.getStrategy(provider);
    return await strategy.confirmPayment(transactionId, options);
  }

  /**
   * Handle webhook from the specified provider
   * @param {string} provider
   * @param {Object} payload
   * @param {Object} headers
   * @returns {Promise<Object>}
   */
  async handleWebhook(provider, payload, headers = {}) {
    const strategy = this.getStrategy(provider);
    return await strategy.handleWebhook(payload, headers);
  }

  /**
   * Query payment from the specified provider
   * @param {string} provider
   * @param {string} transactionId
   * @returns {Promise<Object>}
   */
  async queryPayment(provider, transactionId) {
    const strategy = this.getStrategy(provider);
    return await strategy.queryPayment(transactionId);
  }
}

// Singleton instance
const paymentContext = new PaymentContext();

module.exports = paymentContext;
