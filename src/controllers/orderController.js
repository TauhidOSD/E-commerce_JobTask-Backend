const OrderService = require('../services/OrderService');

/**
 * Order Controller
 */
class OrderController {
  /**
   * POST /api/orders
   */
  static async create(req, res, next) {
    try {
      const order = await OrderService.create(req.user._id, req.body);
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders (User's orders)
   */
  static async getUserOrders(req, res, next) {
    try {
      const result = await OrderService.getUserOrders(req.user._id, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/all (Admin)
   */
  static async getAllOrders(req, res, next) {
    try {
      const result = await OrderService.getAllOrders(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:id
   */
  static async getById(req, res, next) {
    try {
      const userId = req.user.role === 'admin' ? null : req.user._id;
      const order = await OrderService.getById(req.params.id, userId);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/orders/:id/status (Admin)
   */
  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await OrderService.updateStatus(req.params.id, status);
      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
