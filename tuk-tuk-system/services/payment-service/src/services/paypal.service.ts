import axios from 'axios';
import logger from '../utils/logger';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

interface PayPalAccessToken {
  token: string;
  expiresAt: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

interface PayPalOrderDetails {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}

class PayPalService {
  private config: PayPalConfig;
  private baseURL: string;
  private accessToken: PayPalAccessToken | null = null;

  constructor() {
    this.config = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (process.env.PAYPAL_ENV as 'sandbox' | 'production') || 'sandbox',
    };

    this.baseURL =
      this.config.environment === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get PayPal OAuth2 access token with caching
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) {
      return this.accessToken.token;
    }

    try {
      const auth = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const expiresIn = response.data.expires_in || 3600;
      this.accessToken = {
        token: response.data.access_token,
        expiresAt: Date.now() + (expiresIn - 60) * 1000, // Refresh 1 min before expiry
      };

      logger.info('PayPal access token obtained successfully');
      return this.accessToken.token;
    } catch (error: any) {
      logger.error('Failed to get PayPal access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create PayPal order for payment
   */
  async createOrder(amount: number, currency: string = 'USD', returnUrl: string, cancelUrl: string): Promise<PayPalOrder> {
    try {
      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'EAA Tuk-Tuk',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
        },
      };

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('PayPal order created:', { orderId: response.data.id });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create PayPal order:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal order');
    }
  }

  /**
   * Capture payment for approved order
   */
  async captureOrder(orderId: string): Promise<PayPalOrderDetails> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('PayPal order captured:', { orderId, status: response.data.status });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to capture PayPal order:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId: string): Promise<PayPalOrderDetails> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get PayPal order details:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    webhookId: string,
    headers: any,
    body: any
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const verificationData = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: body,
      };

      const response = await axios.post(
        `${this.baseURL}/v1/notifications/verify-webhook-signature`,
        verificationData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.verification_status === 'SUCCESS';
    } catch (error: any) {
      logger.error('Failed to verify PayPal webhook:', error.response?.data || error.message);
      return false;
    }
  }
}

export default new PayPalService();
