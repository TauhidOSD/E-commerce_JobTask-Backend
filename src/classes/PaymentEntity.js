/**
 * PaymentEntity - OOP class encapsulating payment business logic
 * Handles payment lifecycle management
 */
class PaymentEntity {
  constructor(data = {}) {
    this.order = data.order;
    this.provider = data.provider;
    this.transactionId = data.transactionId;
    this.status = data.status || 'pending';
    this.amount = data.amount || 0;
    this.currency = data.currency || 'BDT';
    this.rawResponse = data.rawResponse || {};
    this.metadata = data.metadata || {};
  }

  /**
   * Valid status transitions for payment lifecycle
   */
  static get STATUS_TRANSITIONS() {
    return {
      pending: ['success', 'failed'],
      success: [],
      failed: ['pending'], // Allow retry
    };
  }

  /**
   * Supported payment providers
   */
  static get PROVIDERS() {
    return ['stripe', 'bkash'];
  }

  /**
   * Check if provider is supported
   * @param {string} provider
   * @returns {boolean}
   */
  static isValidProvider(provider) {
    return PaymentEntity.PROVIDERS.includes(provider);
  }

  /**
   * Check if status transition is valid
   * @param {string} newStatus
   * @returns {boolean}
   */
  canTransitionTo(newStatus) {
    const allowedTransitions = PaymentEntity.STATUS_TRANSITIONS[this.status];
    return allowedTransitions && allowedTransitions.includes(newStatus);
  }

  /**
   * Transition payment to new status
   * @param {string} newStatus
   * @param {Object} rawResponse - Provider raw response
   * @throws {Error} If transition is invalid
   */
  transitionTo(newStatus, rawResponse = {}) {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition payment from "${this.status}" to "${newStatus}"`);
    }
    this.status = newStatus;
    this.rawResponse = rawResponse;
  }

  /**
   * Check if payment was successful
   * @returns {boolean}
   */
  isSuccessful() {
    return this.status === 'success';
  }

  /**
   * Check if payment is pending
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Get payment data for database creation
   * @returns {Object}
   */
  toData() {
    return {
      order: this.order,
      provider: this.provider,
      transactionId: this.transactionId,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      rawResponse: this.rawResponse,
      metadata: this.metadata,
    };
  }

  /**
   * Validate payment data
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.order) {
      errors.push('Order is required');
    }

    if (!PaymentEntity.isValidProvider(this.provider)) {
      errors.push(`Invalid provider. Must be one of: ${PaymentEntity.PROVIDERS.join(', ')}`);
    }

    if (this.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PaymentEntity;
