import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { SMSProviderFactory } from './sms.provider';
import { EmailProviderFactory, EmailTemplates } from './email.provider';

const prisma = new PrismaClient();

export class OTPService {
  private readonly OTP_EXPIRATION_MINUTES = 10;
  private readonly OTP_LENGTH = 6;

  /**
   * Generate a random OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via SMS (production-ready with multiple providers)
   */
  private async sendSMS(phone: string, otp: string): Promise<void> {
    try {
      const message = `Your EAA Go verification code is: ${otp}. Valid for ${this.OTP_EXPIRATION_MINUTES} minutes. Do not share this code.`;
      
      // Get appropriate SMS provider based on phone number
      const smsProvider = SMSProviderFactory.getProviderByPhoneNumber(phone);
      await smsProvider.sendSMS(phone, message);
      
      logger.info(`SMS OTP sent to ${phone}`);
    } catch (error: any) {
      logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
      throw new AppError('Failed to send SMS. Please try again.', 500);
    }
  }

  /**
   * Send OTP via Email (production-ready)
   */
  private async sendEmail(email: string, otp: string): Promise<void> {
    try {
      const emailProvider = EmailProviderFactory.getProvider();
      const html = EmailTemplates.otpEmail(otp, this.OTP_EXPIRATION_MINUTES);
      
      await emailProvider.sendEmail(
        email,
        'EAA Go - Verification Code',
        html
      );
      
      logger.info(`Email OTP sent to ${email}`);
    } catch (error: any) {
      logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw new AppError('Failed to send email. Please try again.', 500);
    }
  }

  /**
   * Create and send OTP for phone verification
   */
  async sendPhoneOTP(phone: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRATION_MINUTES);

    // Store OTP in database
    await prisma.oTP.create({
      data: {
        phone,
        code: otp,
        type: 'PHONE_VERIFICATION',
        expiresAt,
      },
    });

    // Send SMS
    await this.sendSMS(phone, otp);

    logger.info(`OTP sent to phone: ${phone}`);
  }

  /**
   * Create and send OTP for email verification
   */
  async sendEmailOTP(email: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRATION_MINUTES);

    // Store OTP in database
    await prisma.oTP.create({
      data: {
        email,
        code: otp,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Send Email
    await this.sendEmail(email, otp);

    logger.info(`OTP sent to email: ${email}`);
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(phone: string, code: string): Promise<boolean> {
    const otp = await prisma.oTP.findFirst({
      where: {
        phone,
        code,
        type: 'PHONE_VERIFICATION',
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Mark as verified
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    logger.info(`Phone verified: ${phone}`);
    return true;
  }

  /**
   * Verify email OTP
   */
  async verifyEmailOTP(email: string, code: string): Promise<boolean> {
    const otp = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        type: 'EMAIL_VERIFICATION',
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Mark as verified
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    logger.info(`Email verified: ${email}`);
    return true;
  }

  /**
   * Resend OTP
   */
  async resendOTP(identifier: string, type: 'phone' | 'email'): Promise<void> {
    // Invalidate previous OTPs
    if (type === 'phone') {
      await prisma.oTP.updateMany({
        where: {
          phone: identifier,
          verified: false,
        },
        data: {
          expiresAt: new Date(), // Expire immediately
        },
      });
      await this.sendPhoneOTP(identifier);
    } else {
      await prisma.oTP.updateMany({
        where: {
          email: identifier,
          verified: false,
        },
        data: {
          expiresAt: new Date(),
        },
      });
      await this.sendEmailOTP(identifier);
    }
  }
}
