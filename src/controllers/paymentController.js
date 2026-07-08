const PaymentService = require('../services/PaymentService');

/**
 * Payment Controller
 */
class PaymentController {
  /**
   * POST /api/payments/initiate
   */
  static async initiatePayment(req, res, next) {
    try {
      const { orderId, provider, callbackURL } = req.body;
      const result = await PaymentService.initiatePayment(orderId, provider, {
        callbackURL,
      });

      const responseData = {
        payment: result.payment,
        transactionId: result.transactionId,
        status: result.status,
      };

      // Add provider-specific data
      if (provider === 'stripe') {
        responseData.clientSecret = result.clientSecret;
      } else if (provider === 'bkash') {
        responseData.bkashURL = result.bkashURL;
      }

      res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/confirm
   */
  static async confirmPayment(req, res, next) {
    try {
      const { paymentId, provider } = req.body;
      const result = await PaymentService.confirmPayment(paymentId, provider);
      res.status(200).json({
        success: true,
        message: `Payment ${result.result.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/webhooks/stripe
   */
  static async stripeWebhook(req, res, next) {
    try {
      const result = await PaymentService.processStripeWebhook(
        req.body,
        req.headers
      );
      res.status(200).json({ received: true, result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/webhooks/bkash
   */
  static async bkashCallback(req, res, next) {
    try {
      const result = await PaymentService.processBkashCallback(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/order/:orderId
   */
  static async getByOrderId(req, res, next) {
    try {
      const payment = await PaymentService.getByOrderId(req.params.orderId);
      res.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/my-payments
   */
  static async getUserPayments(req, res, next) {
    try {
      const payments = await PaymentService.getUserPayments(req.user._id);
      res.status(200).json({
        success: true,
        data: { payments },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;
