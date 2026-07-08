const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Seed database with admin user, categories, and sample products
 */
const seedDatabase = async () => {
  try {
    // Check if already seeded
    const existingAdmin = await User.findOne({ email: 'admin@ecommerce.com' });
    if (existingAdmin) {
      logger.info('Database already seeded, skipping...');
      return;
    }

    logger.info('🌱 Seeding database...');

    // 1. Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ecommerce.com',
      password: 'admin123',
      role: 'admin',
      phone: '01712345678',
    });
    logger.info(`✅ Admin user created: ${admin.email}`);

    // 2. Create a regular test user
    await User.create({
      name: 'Test User',
      email: 'user@ecommerce.com',
      password: 'user123',
      role: 'user',
      phone: '01798765432',
    });
    logger.info('✅ Test user created: user@ecommerce.com');

    // 3. Create Categories (Hierarchical)
    const electronics = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
    });

    const clothing = await Category.create({
      name: 'Clothing',
      description: 'Fashion and apparel',
    });

    const homeGarden = await Category.create({
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
    });

    // Sub-categories (children of Electronics)
    const phones = await Category.create({
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      parent: electronics._id,
    });

    const laptops = await Category.create({
      name: 'Laptops',
      description: 'Notebook computers',
      parent: electronics._id,
    });

    const accessories = await Category.create({
      name: 'Accessories',
      description: 'Electronic accessories',
      parent: electronics._id,
    });

    // Sub-sub-categories (children of Smartphones)
    const android = await Category.create({
      name: 'Android Phones',
      description: 'Android smartphones',
      parent: phones._id,
    });

    const iphone = await Category.create({
      name: 'iPhones',
      description: 'Apple iPhones',
      parent: phones._id,
    });

    // Sub-categories of Clothing
    const menClothing = await Category.create({
      name: "Men's Clothing",
      description: "Men's fashion",
      parent: clothing._id,
    });

    const womenClothing = await Category.create({
      name: "Women's Clothing",
      description: "Women's fashion",
      parent: clothing._id,
    });

    logger.info('✅ Categories created with hierarchy');

    // 4. Create Sample Products
    const products = [
      {
        name: 'iPhone 15 Pro Max',
        sku: 'IPH-15PM-256',
        description: 'Apple iPhone 15 Pro Max with 256GB storage, A17 Pro chip, titanium design, and 48MP camera system.',
        price: 1199.99,
        stock: 50,
        category: iphone._id,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'],
        tags: ['apple', 'iphone', 'premium', 'smartphone'],
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        sku: 'SAM-S24U-256',
        description: 'Samsung Galaxy S24 Ultra with S Pen, 200MP camera, Snapdragon 8 Gen 3, and titanium frame.',
        price: 1099.99,
        stock: 45,
        category: android._id,
        images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'],
        tags: ['samsung', 'galaxy', 'android', 'premium'],
      },
      {
        name: 'Google Pixel 8 Pro',
        sku: 'GOO-PX8P-128',
        description: 'Google Pixel 8 Pro with Tensor G3 chip, 50MP camera, and 7 years of OS updates.',
        price: 899.99,
        stock: 35,
        category: android._id,
        images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500'],
        tags: ['google', 'pixel', 'android', 'camera'],
      },
      {
        name: 'MacBook Pro 16" M3 Max',
        sku: 'MAC-PRO16-M3',
        description: 'Apple MacBook Pro 16-inch with M3 Max chip, 36GB RAM, 1TB SSD, and Liquid Retina XDR display.',
        price: 3499.99,
        stock: 20,
        category: laptops._id,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
        tags: ['apple', 'macbook', 'laptop', 'pro'],
      },
      {
        name: 'Dell XPS 15',
        sku: 'DEL-XPS15-I7',
        description: 'Dell XPS 15 with Intel Core i7-13700H, 16GB RAM, 512GB SSD, OLED display.',
        price: 1799.99,
        stock: 30,
        category: laptops._id,
        images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500'],
        tags: ['dell', 'xps', 'laptop', 'windows'],
      },
      {
        name: 'AirPods Pro 2nd Gen',
        sku: 'APP-PRO2-USB',
        description: 'Apple AirPods Pro 2nd generation with USB-C, Active Noise Cancellation, and Adaptive Audio.',
        price: 249.99,
        stock: 100,
        category: accessories._id,
        images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500'],
        tags: ['apple', 'airpods', 'earbuds', 'wireless'],
      },
      {
        name: 'Samsung Galaxy Watch 6',
        sku: 'SAM-GW6-44',
        description: 'Samsung Galaxy Watch 6 Classic 44mm with rotating bezel, health monitoring, and Wear OS.',
        price: 349.99,
        stock: 40,
        category: accessories._id,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
        tags: ['samsung', 'watch', 'smartwatch', 'wearable'],
      },
      {
        name: 'Sony WH-1000XM5',
        sku: 'SNY-WH5-BLK',
        description: 'Sony WH-1000XM5 wireless noise-canceling headphones with 30-hour battery and multipoint.',
        price: 399.99,
        stock: 55,
        category: accessories._id,
        images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500'],
        tags: ['sony', 'headphones', 'wireless', 'noise-canceling'],
      },
      {
        name: 'Classic Fit Polo Shirt',
        sku: 'CLO-POLO-M-BL',
        description: 'Premium cotton polo shirt in classic fit. Available in multiple colors. Comfortable for all-day wear.',
        price: 59.99,
        stock: 200,
        category: menClothing._id,
        images: ['https://images.unsplash.com/photo-1625910513413-5fc5e88b3dd3?w=500'],
        tags: ['polo', 'shirt', 'men', 'cotton'],
      },
      {
        name: 'Floral Summer Dress',
        sku: 'CLO-FDRS-W-FL',
        description: 'Beautiful floral print summer dress. Lightweight and breathable fabric perfect for warm weather.',
        price: 79.99,
        stock: 150,
        category: womenClothing._id,
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500'],
        tags: ['dress', 'floral', 'women', 'summer'],
      },
      {
        name: 'Smart LED Desk Lamp',
        sku: 'HOM-LAMP-LED',
        description: 'Smart LED desk lamp with adjustable brightness, color temperature, and USB charging port.',
        price: 49.99,
        stock: 80,
        category: homeGarden._id,
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500'],
        tags: ['lamp', 'led', 'smart', 'desk'],
      },
      {
        name: 'Wireless Charging Pad',
        sku: 'ACC-CHRG-WLS',
        description: 'Fast wireless charging pad compatible with Qi-enabled devices. 15W max output.',
        price: 29.99,
        stock: 120,
        category: accessories._id,
        images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500'],
        tags: ['charger', 'wireless', 'qi', 'accessory'],
      },
    ];

    await Product.insertMany(products);
    logger.info(`✅ ${products.length} sample products created`);

    logger.info('🎉 Database seeding completed!');
    logger.info('📋 Admin login: admin@ecommerce.com / admin123');
    logger.info('📋 User login: user@ecommerce.com / user123');
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`);
  }
};

module.exports = seedDatabase;
