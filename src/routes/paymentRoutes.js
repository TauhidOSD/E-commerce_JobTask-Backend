const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { auth, validate } = require('../middlewares/auth');
const { paymentInitiateSchema, paymentConfirmSchema } = require('../validators/schemas');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment System (Stripe & bKash)
 */

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate payment for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, provider]
 *             properties:
 *               orderId:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [stripe, bkash]
 *               callbackURL:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initiated. Returns clientSecret (Stripe) or bkashURL (bKash)
 */
router.post('/initiate', auth, validate(paymentInitiateSchema), PaymentController.initiatePayment);

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm/verify a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, provider]
 *             properties:
 *               paymentId:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [stripe, bkash]
 *     responses:
 *       200:
 *         description: Payment confirmation result
 */
router.post('/confirm', auth, validate(paymentConfirmSchema), PaymentController.confirmPayment);

/**
 * @swagger
 * /api/payments/my-payments:
 *   get:
 *     summary: Get current user's payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's payment history
 */
router.get('/my-payments', auth, PaymentController.getUserPayments);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payment by order ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/order/:orderId', auth, PaymentController.getByOrderId);

module.exports = router;
