import pool from '../config/database';
import { Payment } from '../types';
import logger from '../utils/logger';

export class PaymentModel {
  async create(payment: Payment): Promise<Payment> {
    try {
      const result = await pool.query(
        `INSERT INTO payments (
          payment_id, booking_id, user_id, amount, currency, 
          payment_method, phone_number, status, provider,
          merchant_request_id, checkout_request_id, provider_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          payment.payment_id,
          payment.booking_id,
          payment.user_id || null,
          payment.amount,
          payment.currency || 'KES',
          payment.payment_method,
          payment.phone_number,
          payment.status || 'pending',
          payment.provider,
          payment.merchant_request_id || null,
          payment.checkout_request_id || null,
          payment.provider_response ? JSON.stringify(payment.provider_response) : null,
        ]
      );
      return result.rows[0];
    } catch (error: any) {
      logger.error(`Payment create error: ${error.message}`);
      throw error;
    }
  }

  async findByPaymentId(paymentId: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [paymentId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByPaymentId error: ${error.message}`);
      throw error;
    }
  }

  async findByBookingId(bookingId: string): Promise<Payment[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC',
        [bookingId]
      );
      return result.rows;
    } catch (error: any) {
      logger.error(`Payment findByBookingId error: ${error.message}`);
      throw error;
    }
  }

  async findByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE checkout_request_id = $1',
        [checkoutRequestId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByCheckoutRequestId error: ${error.message}`);
      throw error;
    }
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE transaction_id = $1',
        [transactionId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByTransactionId error: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(
    paymentId: string,
    status: string,
    transactionId?: string,
    callbackData?: any,
    errorMessage?: string
  ): Promise<Payment> {
    try {
      const completedAt = status === 'completed' ? new Date() : null;
      
      const result = await pool.query(
        `UPDATE payments 
        SET status = $1, 
            transaction_id = COALESCE($2, transaction_id),
            callback_data = $3,
            error_message = $4,
            completed_at = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = $6
        RETURNING *`,
        [status, transactionId || null, callbackData ? JSON.stringify(callbackData) : null, errorMessage || null, completedAt, paymentId]
      );
      return result.rows[0];
    } catch (error: any) {
      logger.error(`Payment updateStatus error: ${error.message}`);
      throw error;
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Payment[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows;
    } catch (error: any) {
      logger.error(`Payment findAll error: ${error.message}`);
      throw error;
    }
  }
}

export default new PaymentModel();

  // New methods for additional payment providers

  async findByPayPalOrderId(orderId: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE paypal_order_id = $1',
        [orderId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByPayPalOrderId error: ${error.message}`);
      throw error;
    }
  }

  async findByCryptoChargeId(chargeId: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE crypto_charge_id = $1',
        [chargeId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByCryptoChargeId error: ${error.message}`);
      throw error;
    }
  }

  async findByCryptoChargeCode(code: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE crypto_charge_code = $1',
        [code]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByCryptoChargeCode error: ${error.message}`);
      throw error;
    }
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE stripe_payment_intent_id = $1',
        [paymentIntentId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByStripePaymentIntentId error: ${error.message}`);
      throw error;
    }
  }
}

export default new PaymentModel();

  // Paystack methods
  async findByPaystackReference(reference: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE paystack_reference = $1',
        [reference]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByPaystackReference error: ${error.message}`);
      throw error;
    }
  }

  // Crypto methods
  async findByCryptoTxHash(txHash: string): Promise<Payment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE crypto_tx_hash = $1',
        [txHash]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error(`Payment findByCryptoTxHash error: ${error.message}`);
      throw error;
    }
  }

  async findPendingCryptoPayments(): Promise<Payment[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM payments 
         WHERE payment_method = 'crypto' 
         AND status = 'pending' 
         AND created_at > NOW() - INTERVAL '24 hours'
         ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error: any) {
      logger.error(`Payment findPendingCryptoPayments error: ${error.message}`);
      throw error;
    }
  }
}

export default new PaymentModel();
