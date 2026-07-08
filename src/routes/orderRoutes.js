const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { auth, adminOnly, validate } = require('../middlewares/auth');
const { orderSchema } = require('../validators/schemas');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order Management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, paymentProvider]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               paymentProvider:
 *                 type: string
 *                 enum: [stripe, bkash]
 *               shippingAddress:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', auth, validate(orderSchema), OrderController.create);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, canceled]
 *     responses:
 *       200:
 *         description: User's orders
 */
router.get('/', auth, OrderController.getUserOrders);

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders
 */
router.get('/all', auth, adminOnly, OrderController.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', auth, OrderController.getById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, canceled]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/:id/status', auth, adminOnly, OrderController.updateStatus);

module.exports = router;
