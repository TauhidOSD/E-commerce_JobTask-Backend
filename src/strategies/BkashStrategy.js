const PaymentStrategy = require('./PaymentStrategy');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * BkashStrategy - Concrete implementation of PaymentStrategy for bKash
 * Implements the bKash Tokenized Checkout flow:
 *   1. Grant Token
 *   2. Create Payment
 *   3. Execute Payment
 *   4. Query Payment
 */
class BkashStrategy extends PaymentStrategy {
  constructor() {
    super('bkash');
    this.baseURL = process.env.BKASH_BASE_URL;
    this.username = process.env.BKASH_USERNAME;
    this.password = process.env.BKASH_PASSWORD;
    this.appKey = process.env.BKASH_APP_KEY;
    this.appSecret = process.env.BKASH_APP_SECRET;
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Grant token from bKash API
   * @returns {Promise<string>} Access token
   */
  async grantToken() {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/token/grant`,
        {
          app_key: this.appKey,
          app_secret: this.appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            username: this.username,
            password: this.password,
          },
          timeout: 30000,
        }
      );

      this.token = response.data.id_token;
      // Token valid for 1 hour, refresh 5 mins before expiry
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;

      logger.info('bKash token granted successfully');
      return this.token;
    } catch (error) {
      logger.error(`bKash grantToken error: ${error.message}`);
      throw new Error(`bKash token grant failed: ${error.response?.data?.statusMessage || error.message}`);
    }
  }

  /**
   * Initiate a bKash payment (Create Payment)
   * @param {Object} order - Order document
   * @param {Object} options - { callbackURL }
   * @returns {Promise<Object>} { transactionId, bkashURL, status }
   */
  async initiatePayment(order, options = {}) {
    try {
      const token = await this.grantToken();

      const callbackURL = options.callbackURL || `${process.env.FRONTEND_URL}/payment/bkash/callback`;

      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/create`,
        {
          mode: '0011',
          payerReference: order.user.toString(),
          callbackURL,
          amount: order.totalAmount.toString(),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token,
            'X-APP-Key': this.appKey,
          },
          timeout: 30000,
        }
      );

      const data = response.data;

      if (data.statusCode && data.statusCode !== '0000') {
        throw new Error(data.statusMessage || 'bKash create payment failed');
      }

      logger.info(`bKash payment created: ${data.paymentID} for order ${order._id}`);

      return {
        transactionId: data.paymentID,
        bkashURL: data.bkashURL,
        status: 'pending',
        rawResponse: data,
      };
    } catch (error) {
      logger.error(`bKash initiatePayment error: ${error.message}`);
      throw new Error(`bKash payment initiation failed: ${error.response?.data?.statusMessage || error.message}`);
    }
  }

  /**
   * Execute bKash payment after user completes on bKash end
   * @param {string} paymentID - bKash payment ID
   * @returns {Promise<Object>}
   */
  async confirmPayment(paymentID) {
    try {
      const token = await this.grantToken();

      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/execute`,
        { paymentID },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token,
            'X-APP-Key': this.appKey,
          },
          timeout: 30000,
        }
      );

      const data = response.data;

      let status = 'pending';
      if (data.statusCode === '0000' && data.transactionStatus === 'Completed') {
        status = 'success';
      } else if (data.statusCode && data.statusCode !== '0000') {
        status = 'failed';
      }

      logger.info(`bKash payment ${paymentID} executed with status: ${status}`);

      return {
        transactionId: data.paymentID || paymentID,
        trxID: data.trxID,
        status,
        rawResponse: data,
      };
    } catch (error) {
      logger.error(`bKash confirmPayment error: ${error.message}`);
      throw new Error(`bKash payment execution failed: ${error.response?.data?.statusMessage || error.message}`);
    }
  }

  /**
   * Handle bKash callback/webhook
   * @param {Object} payload - Callback payload { paymentID, status }
   * @returns {Promise<Object>}
   */
  async handleWebhook(payload) {
    try {
      const { paymentID, status } = payload;

      if (status === 'success') {
        // Execute the payment
        return await this.confirmPayment(paymentID);
      }

      return {
        transactionId: paymentID,
        status: status === 'cancel' ? 'failed' : 'pending',
        rawResponse: payload,
      };
    } catch (error) {
      logger.error(`bKash webhook error: ${error.message}`);
      throw new Error(`bKash webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Query bKash payment status
   * @param {string} paymentID
   * @returns {Promise<Object>}
   */
  async queryPayment(paymentID) {
    try {
      const token = await this.grantToken();

      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/payment/status`,
        { paymentID },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token,
            'X-APP-Key': this.appKey,
          },
          timeout: 30000,
        }
      );

      const data = response.data;

      let status = 'pending';
      if (data.transactionStatus === 'Completed') {
        status = 'success';
      } else if (data.transactionStatus === 'Failed') {
        status = 'failed';
      }

      return {
        transactionId: data.paymentID || paymentID,
        trxID: data.trxID,
        status,
        amount: parseFloat(data.amount) || 0,
        rawResponse: data,
      };
    } catch (error) {
      logger.error(`bKash queryPayment error: ${error.message}`);
      throw new Error(`bKash payment query failed: ${error.response?.data?.statusMessage || error.message}`);
    }
  }
}

module.exports = BkashStrategy;
