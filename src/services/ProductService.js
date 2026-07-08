const Product = require('../models/Product');
const ProductEntity = require('../classes/ProductEntity');
const CategoryTree = require('../utils/categoryTree');
const logger = require('../utils/logger');

/**
 * ProductService - Handles product CRUD and stock management
 */
class ProductService {
  /**
   * Create a new product (Admin)
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const entity = new ProductEntity(data);
    const product = await Product.create(entity.toData());
    logger.info(`Product created: ${product.sku}`);
    return product;
  }

  /**
   * Get all products with filtering and pagination
   * @param {Object} query - { page, limit, category, status, search, minPrice, maxPrice, sortBy }
   * @returns {Promise<Object>} { products, pagination }
   */
  static async getAll(query = {}) {
    const {
      page = 1,
      limit = 12,
      category,
      status = 'active',
      search,
      minPrice,
      maxPrice,
      sortBy = '-createdAt',
    } = query;

    const filter = {};

    if (status) filter.status = status;

    if (category) {
      // Use DFS to include products from subcategories
      const categoryIds = await CategoryTree.getDescendantIds(category);
      filter.category = { $in: categoryIds };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    };
  }

  /**
   * Get product by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async getById(id) {
    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  /**
   * Update product (Admin)
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async update(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Product updated: ${product.sku}`);
    return product;
  }

  /**
   * Delete product (Admin)
   * @param {string} id
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    logger.info(`Product deleted: ${product.sku}`);
  }

  /**
   * Get recommended products based on category DFS
   * Finds products in the same category tree branch
   * @param {string} productId
   * @param {number} limit
   * @returns {Promise<Object[]>}
   */
  static async getRecommendations(productId, limit = 8) {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // DFS to find all categories in the same branch
    const categoryIds = await CategoryTree.getDescendantIds(
      product.category.toString()
    );

    // Also get parent's descendants for broader recommendations
    const category = await require('../models/Category').findById(product.category);
    if (category && category.parent) {
      const parentDescendants = await CategoryTree.getDescendantIds(
        category.parent.toString()
      );
      categoryIds.push(...parentDescendants);
    }

    // Unique category IDs
    const uniqueCategoryIds = [...new Set(categoryIds)];

    const recommendations = await Product.find({
      _id: { $ne: productId },
      category: { $in: uniqueCategoryIds },
      status: 'active',
      stock: { $gt: 0 },
    })
      .populate('category', 'name slug')
      .limit(limit)
      .lean();

    return recommendations;
  }

  /**
   * Atomically reduce stock after successful payment
   * Uses MongoDB's $inc operator for concurrency-safe updates
   * @param {Array} items - [{product: id, quantity: n}]
   * @returns {Promise<void>}
   */
  static async reduceStock(items) {
    const operations = items.map((item) => ({
      updateOne: {
        filter: {
          _id: item.product,
          stock: { $gte: item.quantity },
        },
        update: {
          $inc: { stock: -item.quantity },
        },
      },
    }));

    const result = await Product.bulkWrite(operations);

    if (result.modifiedCount !== items.length) {
      throw new Error('Some products have insufficient stock');
    }

    logger.info(`Stock reduced for ${items.length} products`);
  }

  /**
   * Restore stock for canceled orders
   * @param {Array} items
   * @returns {Promise<void>}
   */
  static async restoreStock(items) {
    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    }));

    await Product.bulkWrite(operations);
    logger.info(`Stock restored for ${items.length} products`);
  }
}

module.exports = ProductService;
