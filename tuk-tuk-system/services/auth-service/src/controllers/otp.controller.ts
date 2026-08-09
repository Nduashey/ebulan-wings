import { Request, Response, NextFunction } from 'express';
import { OTPService } from '../services/otp.service';
import { logger } from '../utils/logger';

const otpService = new OTPService();

export class OTPController {
  /**
   * Send OTP to phone
   */
  async sendPhoneOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;

      await otpService.sendPhoneOTP(phone);

      logger.info(`Phone OTP requested: ${phone}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your phone',
        data: {
          phone,
          expiresIn: '10 minutes',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send OTP to email
   */
  async sendEmailOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      await otpService.sendEmailOTP(email);

      logger.info(`Email OTP requested: ${email}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email',
        data: {
          email,
          expiresIn: '10 minutes',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = req.body;

      await otpService.verifyPhoneOTP(phone, code);

      logger.info(`Phone verified: ${phone}`);

      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          phone,
          verified: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email OTP
   */
  async verifyEmailOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;

      await otpService.verifyEmailOTP(email, code);

      logger.info(`Email verified: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          email,
          verified: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, type } = req.body; // identifier can be phone or email

      await otpService.resendOTP(identifier, type);

      logger.info(`OTP resent to: ${identifier}`);

      res.status(200).json({
        success: true,
        message: `OTP resent to your ${type}`,
        data: {
          identifier,
          type,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
