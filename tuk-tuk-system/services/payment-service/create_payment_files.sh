#!/bin/bash

# Airtel Service
cat > src/services/airtel.service.ts << 'EOF'
import axios from 'axios';
import logger from '../utils/logger';
import { AirtelSTKPushRequest, AirtelSTKPushResponse } from '../types';

class AirtelService {
  private clientId: string;
  private clientSecret: string;
  private apiKey: string;
  private baseUrl: string;
  private callbackUrl: string;
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.AIRTEL_CLIENT_ID || '';
    this.clientSecret = process.env.AIRTEL_CLIENT_SECRET || '';
    this.apiKey = process.env.AIRTEL_API_KEY || '';
    this.baseUrl = process.env.AIRTEL_ENV === 'production'
      ? 'https://openapi.airtel.africa'
      : 'https://openapiuat.airtel.africa';
    this.callbackUrl = process.env.AIRTEL_CALLBACK_URL || 'http://localhost:3004/api/payments/airtel/callback';
  }

  private async getAccessToken(): Promise<string> {
    try {
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(
        `${this.baseUrl}/auth/oauth2/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
      
      logger.info('Airtel access token generated successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error(`Airtel access token error: ${error.message}`);
      throw new Error('Failed to get Airtel access token');
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    cleaned = cleaned.replace(/^0+/, '');
    
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    return `254${cleaned}`;
  }

  async initiateSTKPush(request: AirtelSTKPushRequest): Promise<AirtelSTKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const phoneNumber = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        reference: request.reference,
        subscriber: {
          country: 'KE',
          currency: 'KES',
          msisdn: phoneNumber,
        },
        transaction: {
          amount: request.amount,
          country: 'KE',
          currency: 'KES',
          id: request.reference,
        },
      };

      logger.info(`Initiating Airtel STK push: ${JSON.stringify({ phoneNumber, amount: request.amount })}`);

      const response = await axios.post(
        `${this.baseUrl}/merchant/v1/payments/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'KE',
            'X-Currency': 'KES',
          },
        }
      );

      logger.info(`Airtel STK push response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Airtel STK push error: ${error.response?.data || error.message}`);
      throw new Error(error.response?.data?.message || 'Failed to initiate Airtel payment');
    }
  }

  async queryTransactionStatus(transactionId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Country': 'KE',
            'X-Currency': 'KES',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Airtel query error: ${error.response?.data || error.message}`);
      throw new Error('Failed to query Airtel payment status');
    }
  }

  validateCallback(callbackData: any): boolean {
    return !!(
      callbackData?.transaction?.id
    );
  }
}

export default new AirtelService();
EOF

# Payment Model
cat > src/models/payment.model.ts << 'EOF'
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
EOF

echo "Created service files"
