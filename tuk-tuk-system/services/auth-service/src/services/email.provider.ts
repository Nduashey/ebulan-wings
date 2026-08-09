import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

/**
 * SMTP Email Provider
 * Works with Gmail, Outlook, custom SMTP servers
 */
export class SMTPEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"EAA Go" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`Email error: ${error.message}`);
      throw new Error('Failed to send email');
    }
  }
}

/**
 * SendGrid Email Provider
 */
export class SendGridEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@eaago.com';
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      await sgMail.send({
        to,
        from: this.fromEmail,
        subject,
        html,
      });

      logger.info(`SendGrid email sent to ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`SendGrid error: ${error.message}`);
      throw new Error('Failed to send email via SendGrid');
    }
  }
}

/**
 * Console Email Provider (Development)
 */
export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL MESSAGE');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log('='.repeat(60) + '\n');

    logger.info(`Console email to ${to}: ${subject}`);
    return true;
  }
}

/**
 * Email Provider Factory
 */
export class EmailProviderFactory {
  static getProvider(): EmailProvider {
    const provider = process.env.EMAIL_PROVIDER || 'console';

    switch (provider.toLowerCase()) {
      case 'sendgrid':
        return new SendGridEmailProvider();
      case 'smtp':
        return new SMTPEmailProvider();
      case 'console':
      default:
        return new ConsoleEmailProvider();
    }
  }
}

/**
 * Email Templates
 */
export class EmailTemplates {
  static otpEmail(otp: string, expiresIn: number = 10): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FFA000; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #FFA000; text-align: center; letter-spacing: 5px; padding: 20px; background: white; border: 2px dashed #FFA000; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 EAA Go</h1>
          </div>
          <div class="content">
            <h2>Verify Your Account</h2>
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in <strong>${expiresIn} minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>EAA Go - Taxi & Cargo Services</p>
            <p>Tuk-Tuks, Vans & More</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static welcomeEmail(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FFA000; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #FFA000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 Welcome to EAA Go!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for joining EAA Go! Your account has been successfully created.</p>
            <p>You can now:</p>
            <ul>
              <li>🚕 Book Tuk-Tuk rides instantly</li>
              <li>📦 Request cargo delivery</li>
              <li>🚐 Reserve vans for group travel</li>
              <li>💳 Pay securely online</li>
            </ul>
            <a href="http://localhost:3100" class="button">Get Started</a>
          </div>
          <div class="footer">
            <p>EAA Go - Taxi & Cargo Services</p>
            <p>Need help? Contact us at support@eaago.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
