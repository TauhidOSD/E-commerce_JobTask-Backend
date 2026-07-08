/**
 * UserEntity - OOP class encapsulating user business logic
 * Handles user creation, validation, and data transformation
 */
class UserEntity {
  constructor(data = {}) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'user';
    this.phone = data.phone;
    this.address = data.address || {};
  }

  /**
   * Validate user data for registration
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Email format validation
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  /**
   * Transform to safe public representation (no password)
   * @param {Object} userDoc - Mongoose document
   * @returns {Object}
   */
  static toPublic(userDoc) {
    const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete obj.password;
    delete obj.__v;
    return obj;
  }

  /**
   * Get registration data
   * @returns {Object}
   */
  toRegistrationData() {
    return {
      name: this.name,
      email: this.email.toLowerCase().trim(),
      password: this.password,
      role: this.role,
      phone: this.phone,
      address: this.address,
    };
  }
}

module.exports = UserEntity;
