import { Pool } from 'pg';
import logger from '../utils/logger';

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eaa_db',
  user: process.env.DB_USER || 'eaa_user',
  password: process.env.DB_PASSWORD || 'eaa_password',
});

export const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(255) UNIQUE NOT NULL,
        booking_id VARCHAR(255) NOT NULL,
        user_id INTEGER,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'KES',
        payment_method VARCHAR(50) NOT NULL,
        phone_number VARCHAR(20),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        merchant_request_id VARCHAR(255),
        checkout_request_id VARCHAR(255),
        paypal_order_id VARCHAR(255),
        paystack_reference VARCHAR(255),
        crypto_currency VARCHAR(10),
        crypto_wallet_address VARCHAR(255),
        crypto_tx_hash VARCHAR(255),
        crypto_amount DECIMAL(18, 8),
        payment_url TEXT,
        provider VARCHAR(50) NOT NULL,
        provider_response JSONB,
        callback_data JSONB,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        expires_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_phone_number ON payments(phone_number);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_paystack_reference ON payments(paystack_reference);
      CREATE INDEX IF NOT EXISTS idx_payments_crypto_tx_hash ON payments(crypto_tx_hash);
    `);
    
    logger.info('Payment service database initialized successfully');
  } catch (error: any) {
    logger.error(`Database initialization error: ${error.message}`);
    throw error;
  }
};

export default pool;
