const ProductService = require('../services/ProductService');

/**
 * Product Controller
 */
class ProductController {
  /**
   * POST /api/products (Admin)
   */
  static async create(req, res, next) {
    try {
      const product = await ProductService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products
   */
  static async getAll(req, res, next) {
    try {
      const result = await ProductService.getAll(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   */
  static async getById(req, res, next) {
    try {
      const product = await ProductService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id (Admin)
   */
  static async update(req, res, next) {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id (Admin)
   */
  static async delete(req, res, next) {
    try {
      await ProductService.delete(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id/recommendations
   */
  static async getRecommendations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 8;
      const products = await ProductService.getRecommendations(req.params.id, limit);
      res.status(200).json({
        success: true,
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
