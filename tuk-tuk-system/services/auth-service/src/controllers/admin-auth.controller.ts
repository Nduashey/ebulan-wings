import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Admin Authentication Controller
 * Username/Password based authentication for admin panel
 * Default admin: username="admin", password="admin123"
 */

export class AdminAuthController {
  /**
   * Admin Login - Username & Password
   */
  adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
        });
      }

      // Find admin by username
      const admin = await prisma.user.findFirst({
        where: {
          username: username,
          role: 'ADMIN',
        },
      });

      if (!admin) {
        logger.warn(`Failed admin login attempt - username: ${username}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        logger.warn(`Failed admin login attempt - wrong password for: ${username}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate tokens
      const token = jwt.sign(
        { 
          userId: admin.id, 
          username: admin.username,
          role: admin.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const refreshToken = jwt.sign(
        { userId: admin.id, username: admin.username },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        { expiresIn: '7d' }
      );

      // Create session
      await prisma.session.create({
        data: {
          userId: admin.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || '',
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      logger.info(`Admin login successful: ${username} (${admin.firstName} ${admin.lastName})`);

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        refreshToken,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
      });
    } catch (error: any) {
      logger.error('Admin login error:', error);
      next(error);
    }
  };

  /**
   * Create Admin User (Protected - Admin only)
   */
  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, email, firstName, lastName, phone } = req.body;

      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, first name, and last name are required',
        });
      }

      // Check if username/email exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: email || undefined },
          ],
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email: email || `${username}@ebulanwings.admin`,
          phone: phone || null,
          firstName,
          lastName,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: !!phone,
        },
      });

      logger.info(`New admin created: ${username} by ${(req as any).user?.username || 'system'}`);

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
      });
    } catch (error: any) {
      logger.error('Create admin error:', error);
      next(error);
    }
  };

  /**
   * List All Admins
   */
  listAdmins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error: any) {
      logger.error('List admins error:', error);
      next(error);
    }
  };
}
