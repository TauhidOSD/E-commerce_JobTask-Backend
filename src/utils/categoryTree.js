const Category = require('../models/Category');
const cache = require('../config/cache');
const logger = require('./logger');

/**
 * DFS (Depth-First Search) traversal for category tree
 * Efficiently traverses the hierarchical category structure
 * and caches results to minimize database calls.
 */
class CategoryTree {
  /**
   * Build the full category tree from database
   * Caches the result for fast subsequent lookups
   * @returns {Promise<Object[]>} Tree structure
   */
  static async buildTree() {
    const cacheKey = 'category_tree';
    const cached = cache.get(cacheKey);

    if (cached) {
      logger.debug('Category tree served from cache');
      return cached;
    }

    const categories = await Category.find({ isActive: true }).lean();

    // Build adjacency list
    const childrenMap = {};
    const rootCategories = [];

    categories.forEach((cat) => {
      childrenMap[cat._id.toString()] = [];
    });

    categories.forEach((cat) => {
      if (cat.parent) {
        const parentId = cat.parent.toString();
        if (childrenMap[parentId]) {
          childrenMap[parentId].push(cat);
        }
      } else {
        rootCategories.push(cat);
      }
    });

    // Recursive DFS to build tree
    const buildSubtree = (node) => {
      const nodeId = node._id.toString();
      const children = childrenMap[nodeId] || [];
      return {
        ...node,
        children: children.map((child) => buildSubtree(child)),
      };
    };

    const tree = rootCategories.map((root) => buildSubtree(root));

    // Cache the tree
    cache.set(cacheKey, tree);
    logger.info('Category tree built and cached');

    return tree;
  }

  /**
   * DFS to get all descendant category IDs for a given category
   * Used for finding related products in the same branch
   * @param {string} categoryId - Starting category ID
   * @returns {Promise<string[]>} Array of descendant category IDs (including self)
   */
  static async getDescendantIds(categoryId) {
    const cacheKey = `descendants_${categoryId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logger.debug(`Descendant IDs for ${categoryId} served from cache`);
      return cached;
    }

    const allCategories = await Category.find({ isActive: true }).lean();

    // Build adjacency list for DFS
    const childrenMap = {};
    allCategories.forEach((cat) => {
      const parentId = cat.parent ? cat.parent.toString() : null;
      if (parentId) {
        if (!childrenMap[parentId]) childrenMap[parentId] = [];
        childrenMap[parentId].push(cat._id.toString());
      }
    });

    // DFS traversal using explicit stack
    const result = [];
    const stack = [categoryId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      result.push(currentId);

      const children = childrenMap[currentId] || [];
      for (const childId of children) {
        stack.push(childId);
      }
    }

    // Cache the result
    cache.set(cacheKey, result);
    logger.info(`DFS found ${result.length} categories in subtree of ${categoryId}`);

    return result;
  }

  /**
   * Get all ancestor category IDs (path from root to node)
   * Useful for breadcrumb navigation
   * @param {string} categoryId
   * @returns {Promise<Object[]>} Array of ancestor categories
   */
  static async getAncestors(categoryId) {
    const cacheKey = `ancestors_${categoryId}`;
    const cached = cache.get(cacheKey);

    if (cached) return cached;

    const ancestors = [];
    let currentId = categoryId;

    // Walk up the tree
    while (currentId) {
      const category = await Category.findById(currentId).lean();
      if (!category) break;
      ancestors.unshift(category);
      currentId = category.parent ? category.parent.toString() : null;
    }

    cache.set(cacheKey, ancestors);
    return ancestors;
  }

  /**
   * Invalidate all category-related caches
   * Call this after any category CRUD operation
   */
  static invalidateCache() {
    const keys = cache.keys();
    const categoryKeys = keys.filter(
      (key) =>
        key === 'category_tree' ||
        key.startsWith('descendants_') ||
        key.startsWith('ancestors_')
    );
    categoryKeys.forEach((key) => cache.del(key));
    logger.info(`Invalidated ${categoryKeys.length} category cache entries`);
  }
}

module.exports = CategoryTree;
