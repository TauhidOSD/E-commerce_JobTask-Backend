/**
 * PaymentStrategy - Abstract base class for the Strategy Pattern
 * All payment providers must extend this class and implement its methods.
 * This enables adding new providers without modifying core order logic.
 */
class PaymentStrategy {
  /**
   * @param {string} providerName - Name of the payment provider
   */
  constructor(providerName) {
    if (new.target === PaymentStrategy) {
      throw new Error('PaymentStrategy is abstract and cannot be instantiated directly');
    }
    this.providerName = providerName;
  }

  /**
   * Initiate a payment with the provider
   * @param {Object} order - Order document
   * @param {Object} options - Additional payment options
   * @returns {Promise<Object>} Payment initiation result
   */
  async initiatePayment(order, options = {}) {
    throw new Error('initiatePayment() must be implemented by subclass');
  }

  /**
   * Confirm/execute a payment with the provider
   * @param {string} transactionId - Provider-specific transaction ID
   * @param {Object} options - Additional confirmation data
   * @returns {Promise<Object>} Payment confirmation result
   */
  async confirmPayment(transactionId, options = {}) {
    throw new Error('confirmPayment() must be implemented by subclass');
  }

  /**
   * Handle webhook events from the provider
   * @param {Object} payload - Webhook payload
   * @param {Object} headers - Request headers
   * @returns {Promise<Object>} Processed webhook data
   */
  async handleWebhook(payload, headers = {}) {
    throw new Error('handleWebhook() must be implemented by subclass');
  }

  /**
   * Query payment status from the provider
   * @param {string} transactionId
   * @returns {Promise<Object>} Payment status
   */
  async queryPayment(transactionId) {
    throw new Error('queryPayment() must be implemented by subclass');
  }

  /**
   * Get the provider name
   * @returns {string}
   */
  getProviderName() {
    return this.providerName;
  }
}

module.exports = PaymentStrategy;
