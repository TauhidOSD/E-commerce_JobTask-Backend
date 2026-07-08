const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Payment Provider Webhooks
 */

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Webhooks]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/stripe', express.raw({ type: 'application/json' }), PaymentController.stripeWebhook);

/**
 * @swagger
 * /api/webhooks/bkash:
 *   post:
 *     summary: bKash callback/webhook endpoint
 *     tags: [Webhooks]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentID:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post('/bkash', PaymentController.bkashCallback);

module.exports = router;
