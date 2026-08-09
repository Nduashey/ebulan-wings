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
