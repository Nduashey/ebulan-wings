import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      logger.info(`User registered: ${req.body.email}`);
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      logger.info(`User logged in: ${email}`);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshAccessToken(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const profile = await this.authService.getProfile(userId);
      
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const profile = await this.authService.updateProfile(userId, req.body);
      
      logger.info(`Profile updated: ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      await this.authService.changePassword(userId, currentPassword, newPassword);
      
      logger.info(`Password changed: ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        await this.authService.logout(userId, token);
      }
      
      logger.info(`User logged out: ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent if the email exists',
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      await this.authService.resetPassword(token, password);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      await this.authService.verifyEmail(token);
      
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  passwordlessLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otpId } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      const result = await this.authService.passwordlessLogin(email, otpId, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      logger.info(`Passwordless login successful: ${email}`);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const crypto = await import('crypto');
      const challenge = crypto.randomBytes(32).toString('hex');
      
      res.status(200).json({
        success: true,
        data: {
          challenge,
          expiresIn: 300, // 5 minutes
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
