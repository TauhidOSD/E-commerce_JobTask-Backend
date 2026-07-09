## 🌐 Live URL Frontend : https://e-commerce-job-task-frontend.vercel.app/
# 🛒 E-commerce Backend — Ordering & Payment System

A production-ready RESTful API backend for an e-commerce ordering and payment system, built with **Node.js**, **Express.js**, and **MongoDB**. Features dual payment gateway integration (**Stripe** + **bKash**), role-based access control, OOP entity classes, Strategy Pattern for payments, DFS-based category tree with in-memory caching, and comprehensive test coverage.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white) ![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?logo=stripe&logoColor=white) ![bKash](https://img.shields.io/badge/bKash-Sandbox-E2136E) ![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white) ![Swagger](https://img.shields.io/badge/Swagger-API_Docs-85EA2D?logo=swagger&logoColor=black)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Payment Integration](#-payment-integration)
- [Design Patterns](#️-design-patterns)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Demo Credentials](#-demo-credentials)

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration & login with **JWT** authentication
- **Role-based access control** (User / Admin)
- Secure password hashing with **bcryptjs**
- Token-based session management via `Authorization: Bearer <token>` header
- Auto-logout on 401 response

### 📦 Product Management
- Full **CRUD** operations (Admin only)
- Product search by name (`?search=keyword`)
- Category-based filtering (`?category=categoryId`)
- Pagination support (`?page=1&limit=10`)
- DFS-based product recommendations within same category branch

### 🛒 Order Management
- Cart-to-order workflow (multiple items per order)
- **Deterministic** total/subtotal calculation (price × quantity, rounded to 2 decimals)
- Order status lifecycle: `pending` → `paid` → `canceled`
- **Atomic stock reduction** on payment success using MongoDB `$inc` with concurrency guard
- Stock validation before order creation

### 💳 Payment System
- **Stripe** — PaymentIntent flow with card elements
- **bKash** — Tokenized Checkout (sandbox) with redirect flow
- **Strategy Pattern** — Easily extensible payment architecture
- Webhook handlers for both providers
- Payment verification, status tracking & history

### 🗂️ Category System
- **Hierarchical** category tree (parent-child relationships)
- **DFS traversal** for finding related categories & descendants
- **In-memory caching** via `node-cache` (TTL: 10 minutes)
- Cache invalidation on category CRUD operations

### 📝 Additional Features
- **Swagger (OpenAPI 3.0)** — Interactive API documentation at `/api-docs`
- **Joi validation** — Request body/params validation
- **Winston logging** — Structured file + console logging
- **Helmet** — HTTP security headers
- **CORS** — Cross-origin resource sharing configuration
- **Morgan** — HTTP request logging
- **Auto-seeding** — Database auto-seeds on first run with demo data
- **Health check endpoint** — `GET /api/health`

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 20 | JavaScript runtime |
| Framework | Express.js 4.x | REST API framework |
| Database | MongoDB Atlas (Mongoose 8.x) | Document database + ODM |
| Auth | JWT + bcryptjs | Token auth + password hashing |
| Payments | Stripe SDK 15.x | Card payment processing |
| Payments | Axios (bKash Tokenized API) | bKash mobile payment |
| Validation | Joi 17.x | Schema-based request validation |
| Caching | node-cache | In-memory TTL caching |
| Logging | Winston 3.x | Structured logging (file + console) |
| Security | Helmet | HTTP security headers |
| API Docs | swagger-jsdoc + swagger-ui-express | OpenAPI 3.0 documentation |
| Testing | Jest 29.x + Supertest 7.x | Unit & integration testing |
| Test DB | mongodb-memory-server | In-memory MongoDB for tests |
| Dev Tool | Nodemon | Hot-reload during development |

---

## 🏗️ Architecture

### Layered Architecture

```
Client Request
      │
      ▼
┌──────────────┐
│   Routes     │  ← Express Router + Swagger JSDoc annotations
│              │  ← Middleware: auth, validation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  ← Request/Response handling
│              │  ← Error forwarding to errorHandler
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Services    │  ← Core business logic
│              │  ← Uses OOP Entity classes for validation & calculation
│              │  ← PaymentContext (Strategy Pattern) for payment processing
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Models (DB)  │  ← Mongoose schemas + MongoDB operations
└──────────────┘
```

### Payment Architecture (Strategy Pattern)

```
PaymentStrategy (Abstract Base)
├── initiatePayment()
├── confirmPayment()
└── verifyPayment()
       │
       ├── StripeStrategy   → Stripe SDK (PaymentIntent flow)
       └── BkashStrategy    → bKash Tokenized API (Redirect flow)

PaymentContext → Selects strategy at runtime based on provider string
```

---

## 📁 Project Structure

```
backend/
├── server.js                    # Entry point — connects DB, seeds, starts server
├── Dockerfile                   # Docker container definition
├── vercel.json                  # Vercel serverless deployment config
├── jest.config.js               # Jest test configuration
├── .env.example                 # Environment variable template
├── package.json                 # Dependencies & scripts
│
├── src/
│   ├── app.js                   # Express app setup (middleware, routes, error handling)
│   │
│   ├── config/
│   │   ├── database.js          # MongoDB connection (Mongoose)
│   │   ├── cache.js             # node-cache instance (TTL-based)
│   │   ├── stripe.js            # Stripe SDK initialization
│   │   └── swagger.js           # Swagger/OpenAPI configuration
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js              # User schema (name, email, password, role)
│   │   ├── Product.js           # Product schema (name, price, stock, category)
│   │   ├── Order.js             # Order schema (user, items, total, status)
│   │   ├── Payment.js           # Payment schema (order, provider, status, transactionId)
│   │   └── Category.js          # Category schema (name, parent — hierarchical)
│   │
│   ├── classes/                 # OOP Entity classes (Requirement 2.2.1)
│   │   ├── UserEntity.js        # User validation, password management
│   │   ├── ProductEntity.js     # Stock management, subtotal calculation
│   │   ├── OrderEntity.js       # Deterministic total calculation, status transitions
│   │   └── PaymentEntity.js     # Payment lifecycle, provider validation
│   │
│   ├── strategies/              # Strategy Pattern (Requirement 2.2.4)
│   │   ├── PaymentStrategy.js   # Abstract base class
│   │   ├── StripeStrategy.js    # Stripe PaymentIntent implementation
│   │   ├── BkashStrategy.js     # bKash Tokenized Checkout implementation
│   │   └── PaymentContext.js    # Runtime strategy selector
│   │
│   ├── services/                # Business logic layer
│   │   ├── AuthService.js       # Register, login, profile
│   │   ├── ProductService.js    # CRUD, search, filter, paginate, recommendations
│   │   ├── OrderService.js      # Create order, status update, stock management
│   │   ├── PaymentService.js    # Initiate, confirm, verify payments
│   │   └── CategoryService.js   # CRUD, DFS tree building, caching
│   │
│   ├── controllers/             # Route handlers (thin layer)
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   └── categoryController.js
│   │
│   ├── routes/                  # Express routes + Swagger JSDoc
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── productRoutes.js     # /api/products/*
│   │   ├── orderRoutes.js       # /api/orders/*
│   │   ├── paymentRoutes.js     # /api/payments/*
│   │   ├── categoryRoutes.js    # /api/categories/*
│   │   └── webhookRoutes.js     # /api/webhooks/* (Stripe & bKash callbacks)
│   │
│   ├── middlewares/
│   │   ├── auth.js              # JWT verification + role-based access (protect, admin)
│   │   └── errorHandler.js      # Global error handler middleware
│   │
│   ├── validators/
│   │   └── schemas.js           # Joi validation schemas for all endpoints
│   │
│   ├── seeders/
│   │   └── seed.js              # Auto-seed: admin user, test user, categories, 12 products
│   │
│   └── utils/
│       ├── logger.js            # Winston logger configuration
│       └── categoryTree.js      # DFS category tree builder + caching logic
│
├── tests/                       # Jest + Supertest test suites
│   ├── setup.js                 # mongodb-memory-server setup/teardown
│   ├── auth.test.js             # Auth endpoint tests
│   ├── product.test.js          # Product CRUD tests
│   ├── order.test.js            # Order workflow tests
│   ├── classes.test.js          # OOP entity class unit tests
│   └── category.test.js         # Category DFS + caching tests
│
└── logs/                        # Winston log output directory
    ├── error.log
    └── combined.log
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** (comes with Node.js)
- **MongoDB Atlas** account (or local MongoDB instance)

### Installation

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and API keys

# 4. Start development server (with hot-reload)
npm run dev

# 5. Server starts at http://localhost:5000
#    - API Docs: http://localhost:5000/api-docs
#    - Health Check: http://localhost:5000/api/health
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Nodemon (hot-reload) |
| `npm start` | Start production server |
| `npm run seed` | Manually seed the database |
| `npm test` | Run all tests with coverage report |

### Auto-Seeding

On first start, the server automatically seeds the database with:
- **Admin user**: `admin@ecommerce.com` / `admin123`
- **Test user**: `user@ecommerce.com` / `user123`
- **Categories**: Electronics, Clothing, Books (with subcategories)
- **12 sample products** across all categories

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory. Use `.env.example` as a template:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `JWT_EXPIRES_IN` | JWT expiration duration | `7d` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | — |
| `STRIPE_SECRET_KEY` | Stripe secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | — |
| `BKASH_USERNAME` | bKash sandbox username | `sandboxTokenizedUser02` |
| `BKASH_PASSWORD` | bKash sandbox password | `sandboxTokenizedUser02@12345` |
| `BKASH_APP_KEY` | bKash sandbox app key | — |
| `BKASH_APP_SECRET` | bKash sandbox app secret | — |
| `BKASH_BASE_URL` | bKash API base URL | `https://tokenized.sandbox.bka.sh/v1.2.0-beta` |
| `FRONTEND_URL` | Frontend URL for CORS & callbacks | `http://localhost:5173` |
| `CACHE_TTL` | Cache time-to-live in seconds | `600` |

---

## 📖 API Documentation

### Interactive Docs
Visit **`http://localhost:5000/api-docs`** for full Swagger/OpenAPI documentation with try-it-out capability.

---

### Auth Endpoints — `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login & receive JWT token | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ User |

---

### Product Endpoints — `/api/products`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/products` | List products (search, filter, paginate) | ❌ |
| `GET` | `/api/products/:id` | Get single product details | ❌ |
| `GET` | `/api/products/:id/recommendations` | DFS-based product recommendations | ❌ |
| `POST` | `/api/products` | Create a new product | ✅ Admin |
| `PUT` | `/api/products/:id` | Update an existing product | ✅ Admin |
| `DELETE` | `/api/products/:id` | Delete a product | ✅ Admin |

**Query Parameters for `GET /api/products`:**
| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `search` | string | Search by product name | `?search=laptop` |
| `category` | string | Filter by category ID | `?category=60d...` |
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Items per page (default: 10) | `?limit=20` |

---

### Order Endpoints — `/api/orders`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/orders` | Create a new order | ✅ User |
| `GET` | `/api/orders` | Get current user's orders | ✅ User |
| `GET` | `/api/orders/all` | Get all orders (admin) | ✅ Admin |
| `GET` | `/api/orders/:id` | Get order details | ✅ User |
| `PATCH` | `/api/orders/:id/status` | Update order status | ✅ Admin |

**Create Order Request Body:**
```json
{
  "items": [
    {
      "product": "product_id_here",
      "quantity": 2
    }
  ]
}
```

---

### Payment Endpoints — `/api/payments`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/payments/initiate` | Initiate payment (Stripe or bKash) | ✅ User |
| `POST` | `/api/payments/confirm` | Confirm payment | ✅ User |
| `GET` | `/api/payments/my-payments` | Get user's payment history | ✅ User |
| `GET` | `/api/payments/order/:orderId` | Get payment by order ID | ✅ User |

**Initiate Payment Request Body:**
```json
{
  "orderId": "order_id_here",
  "provider": "stripe"
}
```
> Provider options: `"stripe"` or `"bkash"`

---

### Category Endpoints — `/api/categories`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/categories` | List all categories | ❌ |
| `GET` | `/api/categories/tree` | Get full category tree (DFS, cached) | ❌ |
| `GET` | `/api/categories/:id/descendants` | Get category descendants (DFS) | ❌ |
| `POST` | `/api/categories` | Create a new category | ✅ Admin |
| `PUT` | `/api/categories/:id` | Update a category | ✅ Admin |
| `DELETE` | `/api/categories/:id` | Delete a category | ✅ Admin |

---

### Webhook Endpoints — `/api/webhooks`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/stripe` | Stripe webhook handler |
| `POST` | `/api/webhooks/bkash` | bKash callback handler |

---

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health status |

---

## 💳 Payment Integration

### Stripe Payment Flow

```
1. User creates order       →  POST /api/orders
2. Initiate payment         →  POST /api/payments/initiate { provider: "stripe" }
3. Backend creates PaymentIntent, returns clientSecret
4. Frontend confirms with Stripe.js → stripe.confirmCardPayment(clientSecret)
5. Webhook/confirm updates payment & order status
6. Stock is reduced atomically (MongoDB $inc)
```

**Test Card:** `4242 4242 4242 4242` | Any future expiry | Any CVC | Any ZIP

---

### bKash Payment Flow

```
1. User creates order       →  POST /api/orders
2. Initiate payment         →  POST /api/payments/initiate { provider: "bkash" }
3. Backend: Grant Token → Create Payment → returns bkashURL
4. User redirected to bKash payment page
5. After payment, bKash redirects to callback URL
6. Frontend calls           →  POST /api/payments/confirm { paymentID }
7. Backend executes bKash payment & updates order
```

**Sandbox Credentials:**
| Field | Value |
|-------|-------|
| Wallet Number | `01770618575` |
| PIN | `12121` |
| OTP | `123456` |

---

## 🏛️ Design Patterns

### 1. OOP Entity Classes (Requirement 2.2.1)

Each business entity has a dedicated class with encapsulated logic:

| Class | File | Responsibilities |
|-------|------|-----------------|
| `UserEntity` | `classes/UserEntity.js` | User validation, password hashing/comparison |
| `ProductEntity` | `classes/ProductEntity.js` | Stock management, subtotal calculation |
| `OrderEntity` | `classes/OrderEntity.js` | Deterministic total calculation, status transitions |
| `PaymentEntity` | `classes/PaymentEntity.js` | Payment lifecycle, provider validation |

### 2. Strategy Pattern (Requirement 2.2.4)

Payment processing uses the Strategy Pattern for extensibility:

```
PaymentStrategy (Abstract)        ← Base class with abstract methods
├── StripeStrategy                ← Stripe PaymentIntent implementation
└── BkashStrategy                 ← bKash Tokenized API implementation

PaymentContext                    ← Runtime strategy selector
  └── setStrategy(providerName)   ← Dynamically selects strategy
  └── processPayment()            ← Delegates to selected strategy
```

**Adding a new payment provider:**
1. Create `NewProviderStrategy.js` extending `PaymentStrategy`
2. Implement `initiatePayment()`, `confirmPayment()`, `verifyPayment()`
3. Register in `PaymentContext.js`

### 3. DFS + Caching (Requirement 2.2.5)

- Category tree built via **Depth-First Search** traversal
- Cached in `node-cache` with configurable TTL (default: 10 minutes)
- Used for product recommendations within the same category branch
- **Cache invalidation** triggered on category create/update/delete

### 4. Deterministic Algorithms (Requirement 2.2.3)

- `subtotal = price × quantity` (rounded to 2 decimal places)
- `total = Σ subtotals`
- Atomic stock reduction using MongoDB `$inc` operator with concurrency guard

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests with coverage
npm test

# Output includes:
# - Test results per suite
# - Code coverage report
# - Coverage saved to ./coverage/
```

### Test Suites

| Suite | File | What It Tests |
|-------|------|---------------|
| Auth | `tests/auth.test.js` | Registration, login, JWT validation, duplicate email, invalid credentials |
| Products | `tests/product.test.js` | CRUD operations, admin/user role enforcement, search & filtering |
| Orders | `tests/order.test.js` | Order creation, total calculation, stock validation, status updates |
| Classes | `tests/classes.test.js` | All OOP entity classes — unit tests for methods & edge cases |
| Categories | `tests/category.test.js` | DFS traversal, tree building, caching behavior |

### Test Infrastructure
- **mongodb-memory-server** — Spins up in-memory MongoDB for isolated testing
- **Supertest** — HTTP assertion library for API endpoint testing
- **Jest** — Test runner with built-in mocking, coverage, and assertion support
- **30-second timeout** per test for async operations

---

## 🚢 Deployment

### Docker

```bash
# From the project root directory
docker-compose up --build
```

**Docker services:**
| Service | Port | Description |
|---------|------|-------------|
| `backend` | 5001 | Node.js Express API |
| `mongodb` | 27017 | MongoDB 7.x database |

### Vercel (Serverless)

The backend includes a `vercel.json` configuration for serverless deployment:
- Entry point: `src/app.js`
- All routes mapped to the Express app
- Set environment variables in Vercel dashboard

```bash
# Deploy to Vercel
cd backend
vercel --prod
```

---

## 📧 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@ecommerce.com` | `admin123` |
| User | `user@ecommerce.com` | `user123` |

---

## 📄 License

MIT License
