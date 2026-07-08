const Category = require('../models/Category');
const CategoryTree = require('../utils/categoryTree');
const logger = require('../utils/logger');

/**
 * CategoryService - CRUD operations and DFS-based tree management
 */
class CategoryService {
  /**
   * Create a new category
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const category = await Category.create(data);
    CategoryTree.invalidateCache();
    logger.info(`Category created: ${category.name}`);
    return category;
  }

  /**
   * Get all categories (flat list)
   * @returns {Promise<Object[]>}
   */
  static async getAll() {
    return await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort('name')
      .lean();
  }

  /**
   * Get full category tree (DFS-built, cached)
   * @returns {Promise<Object[]>}
   */
  static async getTree() {
    return await CategoryTree.buildTree();
  }

  /**
   * Get category by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async getById(id) {
    const category = await Category.findById(id).populate('parent', 'name slug');
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  /**
   * Update category
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async update(id, data) {
    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    CategoryTree.invalidateCache();
    logger.info(`Category updated: ${category.name}`);
    return category;
  }

  /**
   * Delete category
   * @param {string} id
   * @returns {Promise<void>}
   */
  static async delete(id) {
    // Check for child categories
    const children = await Category.find({ parent: id });
    if (children.length > 0) {
      const error = new Error('Cannot delete category with child categories');
      error.statusCode = 400;
      throw error;
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    CategoryTree.invalidateCache();
    logger.info(`Category deleted: ${category.name}`);
  }

  /**
   * Get descendant category IDs using DFS
   * @param {string} categoryId
   * @returns {Promise<string[]>}
   */
  static async getDescendants(categoryId) {
    return await CategoryTree.getDescendantIds(categoryId);
  }

  /**
   * Get ancestor path (breadcrumbs)
   * @param {string} categoryId
   * @returns {Promise<Object[]>}
   */
  static async getAncestors(categoryId) {
    return await CategoryTree.getAncestors(categoryId);
  }
}

module.exports = CategoryService;
