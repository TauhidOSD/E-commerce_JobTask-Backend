const ProductEntity = require('./ProductEntity');

/**
 * OrderEntity - OOP class encapsulating order business logic
 * Handles deterministic total/subtotal calculation and status transitions
 */
class OrderEntity {
  constructor(data = {}) {
    this.user = data.user;
    this.items = data.items || [];
    this.totalAmount = data.totalAmount || 0;
    this.status = data.status || 'pending';
    this.shippingAddress = data.shippingAddress || {};
    this.paymentProvider = data.paymentProvider;
  }

  /**
   * Add item to order with deterministic calculation
   * @param {Object} product - Product document
   * @param {number} quantity
   */
  addItem(product, quantity) {
    const productEntity = new ProductEntity(product);

    if (!productEntity.isAvailable(quantity)) {
      throw new Error(`Product "${product.name}" is not available in the requested quantity`);
    }

    const subtotal = productEntity.calculateSubtotal(quantity);

    this.items.push({
      product: product._id,
      productName: product.name,
      quantity,
      price: product.price,
      subtotal,
    });

    this.recalculateTotal();
  }

  /**
   * Deterministic algorithm to calculate order total
   * Iterates through all items, computing subtotals and summing them
   * @returns {number} Calculated total amount
   */
  recalculateTotal() {
    this.totalAmount = this.items.reduce((total, item) => {
      // Deterministic: each subtotal = price * quantity
      const subtotal = Math.round(item.price * item.quantity * 100) / 100;
      item.subtotal = subtotal;
      return Math.round((total + subtotal) * 100) / 100;
    }, 0);

    return this.totalAmount;
  }

  /**
   * Valid status transitions for order lifecycle
   */
  static get STATUS_TRANSITIONS() {
    return {
      pending: ['paid', 'canceled'],
      paid: ['canceled'],
      canceled: [],
    };
  }

  /**
   * Check if status transition is valid
   * @param {string} newStatus
   * @returns {boolean}
   */
  canTransitionTo(newStatus) {
    const allowedTransitions = OrderEntity.STATUS_TRANSITIONS[this.status];
    return allowedTransitions && allowedTransitions.includes(newStatus);
  }

  /**
   * Transition order to a new status
   * @param {string} newStatus
   * @throws {Error} If transition is invalid
   */
  transitionTo(newStatus) {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition order from "${this.status}" to "${newStatus}"`);
    }
    this.status = newStatus;
  }

  /**
   * Get order data for database creation
   * @returns {Object}
   */
  toData() {
    return {
      user: this.user,
      items: this.items,
      totalAmount: this.totalAmount,
      status: this.status,
      shippingAddress: this.shippingAddress,
      paymentProvider: this.paymentProvider,
    };
  }

  /**
   * Validate order has items
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.user) {
      errors.push('User is required');
    }

    if (!this.items || this.items.length === 0) {
      errors.push('Order must have at least one item');
    }

    if (this.totalAmount <= 0) {
      errors.push('Order total must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = OrderEntity;
