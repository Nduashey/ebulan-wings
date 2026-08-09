import axios from 'axios';
import logger from '../utils/logger';

interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  environment: 'test' | 'live';
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'abandoned';
    channel: string;
    paid_at: string;
    customer: {
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bank: string;
    };
  };
}

class PaystackService {
  private config: PaystackConfig;
  private baseURL: string;

  constructor() {
    this.config = {
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      environment: (process.env.PAYSTACK_ENV as 'test' | 'live') || 'test',
    };

    this.baseURL = 'https://api.paystack.co';
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata: any,
    callbackUrl?: string
  ): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        {
          email,
          amount: Math.round(amount * 100), // Paystack uses kobo/cents
          reference,
          metadata,
          callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/paystack/callback`,
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Paystack transaction initialized:', { reference });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to initialize Paystack transaction:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
          },
        }
      );

      logger.info('Paystack transaction verified:', { reference, status: response.data.data.status });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to verify Paystack transaction:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', this.config.secretKey)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error: any) {
      logger.error('Failed to verify Paystack webhook signature:', error.message);
      return false;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: number): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to get Paystack transaction:', error.response?.data || error.message);
      throw new Error('Failed to get transaction details');
    }
  }

  /**
   * Create a customer for recurring payments
   */
  async createCustomer(email: string, firstName?: string, lastName?: string, phone?: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/customer`,
        {
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Paystack customer created:', { email });
      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to create Paystack customer:', error.response?.data || error.message);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Charge an authorization (saved card)
   */
  async chargeAuthorization(
    authorizationCode: string,
    email: string,
    amount: number,
    reference: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/charge_authorization`,
        {
          authorization_code: authorizationCode,
          email,
          amount: Math.round(amount * 100),
          reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Paystack authorization charged:', { reference });
      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to charge Paystack authorization:', error.response?.data || error.message);
      throw new Error('Failed to charge authorization');
    }
  }

  /**
   * Request a refund
   */
  async createRefund(reference: string, amount?: number): Promise<any> {
    try {
      const payload: any = { transaction: reference };
      if (amount) {
        payload.amount = Math.round(amount * 100);
      }

      const response = await axios.post(
        `${this.baseURL}/refund`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Paystack refund created:', { reference });
      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to create Paystack refund:', error.response?.data || error.message);
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Map Paystack status to internal payment status
   */
  mapTransactionStatus(status: string): string {
    const statusMap: Record<string, string> = {
      success: 'completed',
      failed: 'failed',
      abandoned: 'cancelled',
      pending: 'pending',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string {
    return this.config.publicKey;
  }
}

export default new PaystackService();
