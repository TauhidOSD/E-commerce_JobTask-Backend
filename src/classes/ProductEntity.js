/**
 * ProductEntity - OOP class encapsulating product business logic
 * Handles stock management, price calculations, and status
 */
class ProductEntity {
  constructor(data = {}) {
    this.name = data.name;
    this.sku = data.sku;
    this.description = data.description;
    this.price = data.price;
    this.stock = data.stock || 0;
    this.status = data.status || 'active';
    this.category = data.category;
    this.images = data.images || [];
    this.tags = data.tags || [];
  }

  /**
   * Check if product is available for purchase
   * @param {number} requestedQuantity
   * @returns {boolean}
   */
  isAvailable(requestedQuantity = 1) {
    return this.status === 'active' && this.stock >= requestedQuantity;
  }

  /**
   * Calculate subtotal for a given quantity
   * @param {number} quantity
   * @returns {number} Deterministic subtotal
   */
  calculateSubtotal(quantity) {
    // Deterministic calculation: price * quantity, rounded to 2 decimal places
    return Math.round(this.price * quantity * 100) / 100;
  }

  /**
   * Safely reduce stock after successful payment
   * @param {number} quantity - Amount to reduce
   * @returns {number} New stock level
   * @throws {Error} If insufficient stock
   */
  reduceStock(quantity) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (this.stock < quantity) {
      throw new Error(`Insufficient stock for ${this.name}. Available: ${this.stock}, Requested: ${quantity}`);
    }
    this.stock -= quantity;
    return this.stock;
  }

  /**
   * Restore stock (for canceled orders)
   * @param {number} quantity
   * @returns {number} New stock level
   */
  restoreStock(quantity) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.stock += quantity;
    return this.stock;
  }

  /**
   * Generate SKU from name if not provided
   * @param {string} name
   * @returns {string}
   */
  static generateSku(name) {
    const prefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${prefix}-${random}`;
  }

  /**
   * Transform to creation data
   * @returns {Object}
   */
  toData() {
    return {
      name: this.name,
      sku: this.sku?.toUpperCase(),
      description: this.description,
      price: this.price,
      stock: this.stock,
      status: this.status,
      category: this.category,
      images: this.images,
      tags: this.tags,
    };
  }
}

module.exports = ProductEntity;
