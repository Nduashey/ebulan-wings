import axios from 'axios';
import logger from '../utils/logger';
import { MPesaSTKPushRequest, MPesaSTKPushResponse } from '../types';

class MPesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private businessShortCode: string;
  private passkey: string;
  private callbackUrl: string;
  private baseUrl: string;
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || 'http://localhost:3004/api/payments/mpesa/callback';
    this.baseUrl = process.env.MPESA_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Generate M-Pesa access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Return cached token if still valid
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (parseInt(response.data.expires_in) * 1000) - 60000; // Expire 1min early
      
      logger.info('M-Pesa access token generated successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error(`M-Pesa access token error: ${error.message}`);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  /**
   * Generate password for STK push
   */
  private generatePassword(timestamp: string): string {
    const password = Buffer.from(
      `${this.businessShortCode}${this.passkey}${timestamp}`
    ).toString('base64');
    return password;
  }

  /**
   * Get current timestamp in M-Pesa format (YYYYMMDDHHmmss)
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // If starts with 254, return as is
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // If starts with +254, remove the +
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // Otherwise, add 254 prefix
    return `254${cleaned}`;
  }

  /**
   * Initiate STK push for M-Pesa payment
   */
  async initiateSTKPush(request: MPesaSTKPushRequest): Promise<MPesaSTKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);
      const phoneNumber = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount), // M-Pesa doesn't support decimals
        PartyA: phoneNumber,
        PartyB: this.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      };

      logger.info(`Initiating M-Pesa STK push: ${JSON.stringify({ phoneNumber, amount: request.amount })}`);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`M-Pesa STK push response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      logger.error(`M-Pesa STK push error: ${error.response?.data || error.message}`);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
  }

  /**
   * Query STK push status
   */
  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`M-Pesa query error: ${error.response?.data || error.message}`);
      throw new Error('Failed to query M-Pesa payment status');
    }
  }

  /**
   * Validate callback data
   */
  validateCallback(callbackData: any): boolean {
    return !!(
      callbackData?.Body?.stkCallback?.MerchantRequestID &&
      callbackData?.Body?.stkCallback?.CheckoutRequestID
    );
  }
}

export default new MPesaService();
