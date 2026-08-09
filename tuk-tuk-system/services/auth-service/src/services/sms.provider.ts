import axios from 'axios';
import { logger } from '../utils/logger';

export interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<boolean>;
}

/**
 * Safaricom SMS Provider (Kenya)
 * Uses Safaricom SMS Gateway API
 */
export class SafaricomSMSProvider implements SMSProvider {
  private apiKey: string;
  private apiSecret: string;
  private shortCode: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.SAFARICOM_API_KEY || '';
    this.apiSecret = process.env.SAFARICOM_API_SECRET || '';
    this.shortCode = process.env.SAFARICOM_SHORT_CODE || '';
    this.baseURL = process.env.SAFARICOM_BASE_URL || 'https://api.safaricom.co.ke';
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      // Get OAuth token
      const token = await this.getAccessToken();

      // Send SMS
      const response = await axios.post(
        `${this.baseURL}/v1/sms/send`,
        {
          from: this.shortCode,
          to: phone,
          text: message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Safaricom SMS sent to ${phone}: ${response.data.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`Safaricom SMS error: ${error.message}`);
      throw new Error('Failed to send SMS via Safaricom');
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

      const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      return response.data.access_token;
    } catch (error: any) {
      logger.error(`Safaricom OAuth error: ${error.message}`);
      throw new Error('Failed to get Safaricom access token');
    }
  }
}

/**
 * Airtel SMS Provider (Kenya, Uganda, Tanzania)
 * Uses Airtel SMS API
 */
export class AirtelSMSProvider implements SMSProvider {
  private apiKey: string;
  private senderId: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.AIRTEL_API_KEY || '';
    this.senderId = process.env.AIRTEL_SENDER_ID || 'EAAGo';
    this.baseURL = process.env.AIRTEL_BASE_URL || 'https://api.airtel.africa';
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/sms/send`,
        {
          sender: this.senderId,
          recipient: phone,
          message: message,
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Airtel SMS sent to ${phone}: ${response.data.transactionId}`);
      return true;
    } catch (error: any) {
      logger.error(`Airtel SMS error: ${error.message}`);
      throw new Error('Failed to send SMS via Airtel');
    }
  }
}

/**
 * Africa's Talking SMS Provider (Pan-African)
 * Best coverage across East Africa
 */
export class AfricasTalkingSMSProvider implements SMSProvider {
  private apiKey: string;
  private username: string;
  private senderId: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.AFRICASTALKING_API_KEY || '';
    this.username = process.env.AFRICASTALKING_USERNAME || '';
    this.senderId = process.env.AFRICASTALKING_SENDER_ID || 'EAAGo';
    this.baseURL = process.env.AFRICASTALKING_BASE_URL || 'https://api.africastalking.com';
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('to', phone);
      params.append('message', message);
      params.append('from', this.senderId);

      const response = await axios.post(`${this.baseURL}/version1/messaging`, params, {
        headers: {
          apiKey: this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      logger.info(`Africa's Talking SMS sent to ${phone}: ${JSON.stringify(response.data)}`);
      return true;
    } catch (error: any) {
      logger.error(`Africa's Talking SMS error: ${error.message}`);
      throw new Error('Failed to send SMS via Africa\'s Talking');
    }
  }
}

/**
 * Twilio SMS Provider (International fallback)
 */
export class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          To: phone,
          From: this.phoneNumber,
          Body: message,
        }),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info(`Twilio SMS sent to ${phone}: ${response.data.sid}`);
      return true;
    } catch (error: any) {
      logger.error(`Twilio SMS error: ${error.message}`);
      throw new Error('Failed to send SMS via Twilio');
    }
  }
}

/**
 * Development/Console SMS Provider
 * Logs SMS to console instead of sending
 */
export class ConsoleSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<boolean> {
    console.log('\n' + '='.repeat(60));
    console.log('📱 SMS MESSAGE');
    console.log('='.repeat(60));
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(60) + '\n');

    logger.info(`Console SMS to ${phone}: ${message}`);
    return true;
  }
}

/**
 * SMS Provider Factory
 * Selects the appropriate provider based on configuration
 */
export class SMSProviderFactory {
  static getProvider(): SMSProvider {
    const provider = process.env.SMS_PROVIDER || 'console';

    switch (provider.toLowerCase()) {
      case 'safaricom':
        return new SafaricomSMSProvider();
      case 'airtel':
        return new AirtelSMSProvider();
      case 'africastalking':
        return new AfricasTalkingSMSProvider();
      case 'twilio':
        return new TwilioSMSProvider();
      case 'console':
      default:
        return new ConsoleSMSProvider();
    }
  }

  /**
   * Smart provider selection based on phone number prefix
   */
  static getProviderByPhoneNumber(phone: string): SMSProvider {
    // Kenya numbers (+254)
    if (phone.startsWith('+254') || phone.startsWith('254')) {
      const safaricomPrefixes = ['254700', '254701', '254702', '254703', '254704', '254705', '254706', '254707', '254708', '254709', '254710', '254711', '254712', '254713', '254714', '254715', '254716', '254717', '254718', '254719', '254720', '254721', '254722', '254723', '254724', '254725', '254726', '254727', '254728', '254729', '254740', '254741', '254742', '254743', '254744', '254745', '254746', '254747', '254748', '254757', '254758', '254759', '254768', '254769', '254790', '254791', '254792', '254793', '254794', '254795', '254796', '254797', '254798', '254799'];
      
      const airtelPrefixes = ['254730', '254731', '254732', '254733', '254734', '254735', '254736', '254737', '254738', '254739', '254750', '254751', '254752', '254753', '254754', '254755', '254756', '254780', '254781', '254782', '254783', '254784', '254785', '254786', '254787', '254788', '254789'];

      const normalizedPhone = phone.replace('+', '');
      
      // Check if Safaricom
      if (safaricomPrefixes.some(prefix => normalizedPhone.startsWith(prefix))) {
        return new SafaricomSMSProvider();
      }
      
      // Check if Airtel
      if (airtelPrefixes.some(prefix => normalizedPhone.startsWith(prefix))) {
        return new AirtelSMSProvider();
      }
    }

    // Default to Africa's Talking for other African numbers
    if (phone.startsWith('+2') || phone.startsWith('2')) {
      return new AfricasTalkingSMSProvider();
    }

    // International numbers - use Twilio
    return new TwilioSMSProvider();
  }
}
