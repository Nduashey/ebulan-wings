import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * SSI Login (Credential-based, no DID)
 * User provides credentialId (or public key fingerprint) and signature
 */
export const ssiLogin = async (req: Request, res: Response) => {
  try {
    const { credentialId, publicKeyHash, challenge, signature } = req.body;

    if (!challenge || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Challenge and signature are required',
      });
    }

    if (!credentialId && !publicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Credential ID or public key hash is required',
      });
    }

    // Find user by public key (SSI doesn't use DID)
    const user = await prisma.user.findFirst({
      where: {
        publicKey: {
          contains: publicKeyHash || credentialId?.split(':').pop(),
        },
        did: null, // SSI users don't have DID
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found',
      });
    }

    // Verify signature using user's public key
    const verifier = crypto.createVerify('SHA256');
    verifier.update(challenge);
    const isValid = verifier.verify(user.publicKey || '', signature, 'base64');

    if (!isValid) {
      logger.warn(`Failed SSI login attempt for user: ${user.id}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid signature - authentication failed',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, authType: 'ssi', role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, authType: 'ssi' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    });

    logger.info(`SSI login successful for user: ${user.firstName} ${user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'SSI authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          authType: 'ssi',
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('SSI login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message,
    });
  }
};

/**
 * DID Login (Decentralized Identifier based)
 * User provides DID and signature
 */
export const didLogin = async (req: Request, res: Response) => {
  try {
    const { did, challenge, signature } = req.body;

    if (!did || !challenge || !signature) {
      return res.status(400).json({
        success: false,
        error: 'DID, challenge, and signature are required',
      });
    }

    // Find user by DID
    const user = await prisma.user.findFirst({
      where: { did },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'DID not found',
      });
    }

    // Verify signature using user's public key
    const verifier = crypto.createVerify('SHA256');
    verifier.update(challenge);
    const isValid = verifier.verify(user.publicKey || '', signature, 'base64');

    if (!isValid) {
      logger.warn(`Failed DID login attempt for DID: ${did}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid signature - authentication failed',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, did: user.did, authType: 'did', role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, did: user.did, authType: 'did' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    });

    logger.info(`DID login successful for DID: ${did}, user: ${user.firstName} ${user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'DID authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          did: user.did,
          authType: 'did',
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('DID login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message,
    });
  }
};
