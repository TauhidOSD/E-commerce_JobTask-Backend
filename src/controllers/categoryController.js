const CategoryService = require('../services/CategoryService');

/**
 * Category Controller
 */
class CategoryController {
  /**
   * POST /api/categories (Admin)
   */
  static async create(req, res, next) {
    try {
      const category = await CategoryService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories
   */
  static async getAll(req, res, next) {
    try {
      const categories = await CategoryService.getAll();
      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/tree
   */
  static async getTree(req, res, next) {
    try {
      const tree = await CategoryService.getTree();
      res.status(200).json({
        success: true,
        data: { tree },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:id
   */
  static async getById(req, res, next) {
    try {
      const category = await CategoryService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/categories/:id (Admin)
   */
  static async update(req, res, next) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/categories/:id (Admin)
   */
  static async delete(req, res, next) {
    try {
      await CategoryService.delete(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:id/descendants
   */
  static async getDescendants(req, res, next) {
    try {
      const descendants = await CategoryService.getDescendants(req.params.id);
      res.status(200).json({
        success: true,
        data: { descendants },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
