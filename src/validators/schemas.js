const Joi = require('joi');

// Auth Validators
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  phone: Joi.string().allow('').optional(),
  address: Joi.object({
    street: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    zipCode: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Product Validators
const productSchema = Joi.object({
  name: Joi.string().max(200).required(),
  sku: Joi.string().required(),
  description: Joi.string().max(2000).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  category: Joi.string().required(),
  images: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const productUpdateSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  sku: Joi.string().optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// Order Validators
const orderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
  shippingAddress: Joi.object({
    street: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    zipCode: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
  }).optional(),
  paymentProvider: Joi.string().valid('stripe', 'bkash').required(),
});

// Payment Validators
const paymentInitiateSchema = Joi.object({
  orderId: Joi.string().required(),
  provider: Joi.string().valid('stripe', 'bkash').required(),
  callbackURL: Joi.string().uri().optional(),
});

const paymentConfirmSchema = Joi.object({
  paymentId: Joi.string().required(),
  provider: Joi.string().valid('stripe', 'bkash').required(),
});

// Category Validators
const categorySchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  parent: Joi.string().allow(null).optional(),
  image: Joi.string().allow('').optional(),
  isActive: Joi.boolean().default(true),
});

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  orderSchema,
  paymentInitiateSchema,
  paymentConfirmSchema,
  categorySchema,
};
