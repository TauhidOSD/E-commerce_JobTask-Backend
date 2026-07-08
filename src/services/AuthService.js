const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserEntity = require('../classes/UserEntity');
const logger = require('../utils/logger');

/**
 * AuthService - Handles user registration, login, and token management
 */
class AuthService {
  /**
   * Generate JWT token
   * @param {string} userId
   * @returns {string} JWT token
   */
  static generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} { user, token }
   */
  static async register(data) {
    const userEntity = new UserEntity(data);

    // Validate using OOP class
    const validation = userEntity.validate();
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      throw error;
    }

    // Create user
    const user = await User.create(userEntity.toRegistrationData());
    const token = AuthService.generateToken(user._id);

    logger.info(`User registered: ${user.email}`);

    return {
      user: UserEntity.toPublic(user),
      token,
    };
  }

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} { user, token }
   */
  static async login(email, password) {
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = AuthService.generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: UserEntity.toPublic(user),
      token,
    };
  }

  /**
   * Get user profile
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return UserEntity.toPublic(user);
  }
}

module.exports = AuthService;
