const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { auth, adminOnly, validate } = require('../middlewares/auth');
const { categorySchema } = require('../validators/schemas');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category Management (Hierarchical with DFS)
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories (flat list)
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', CategoryController.getAll);

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: Get category tree (DFS-built, cached)
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Hierarchical category tree
 */
router.get('/tree', CategoryController.getTree);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get('/:id', CategoryController.getById);

/**
 * @swagger
 * /api/categories/{id}/descendants:
 *   get:
 *     summary: Get all descendant category IDs (DFS traversal)
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Descendant category IDs
 */
router.get('/:id/descendants', CategoryController.getDescendants);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a category (Admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parent:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', auth, adminOnly, validate(categorySchema), CategoryController.create);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category (Admin)
 *     tags: [Categories]
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
 *         description: Category updated
 */
router.put('/:id', auth, adminOnly, CategoryController.update);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin)
 *     tags: [Categories]
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
 *         description: Category deleted
 */
router.delete('/:id', auth, adminOnly, CategoryController.delete);

module.exports = router;
