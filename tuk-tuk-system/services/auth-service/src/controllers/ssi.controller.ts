import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * SSI (Self-Sovereign Identity) Controller - Production Grade
 * 
 * Architecture:
 * - DIDs (Decentralized Identifiers)
 * - Verifiable Credentials
 * - Public/Private Key pairs
 * - JWT-based tokens with user-controlled keys
 */

interface DIDDocument {
  '@context': string;
  id: string;
  publicKey: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyPem: string;
  }>;
  authentication: string[];
  created: string;
  updated: string;
}

interface VerifiableCredential {
  '@context': string[];
  id?: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

/**
 * Register a new user with SSI (Self-Sovereign Identity)
 * Pure decentralized authentication - no email or phone required
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { publicKey, email, phone, firstName, lastName } = req.body;

    // Validate required fields
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required for SSI authentication',
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
      });
    }

    // For SSI, we use credential ID (not DID)
    const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
    const credentialId = `urn:ebulan:credential:${hash.substring(0, 32)}`;

    // Check if credential already exists (by public key)
    const existingUser = await prisma.user.findFirst({
      where: { publicKey },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'This identity already exists',
      });
    }

    // Check if email/phone already in use (if provided)
    if (email || phone) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : {},
            phone ? { phone } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      });

      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          error: 'Email or phone number already in use',
        });
      }
    }

    // Store user with SSI credential (no DID)
    const user = await prisma.user.create({
      data: {
        email: email || `ssi-${hash.substring(0, 16)}@ebulan.local`,
        phone: phone || null,
        firstName,
        lastName,
        password: 'SSI_AUTH', // Placeholder - not used for SSI auth
        publicKey,
        emailVerified: !!email,
        phoneVerified: !!phone,
      },
    });

    // Issue initial verifiable credential
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://ebulanwings.com/credentials/v1',
      ],
      id: credentialId,
      type: ['VerifiableCredential', 'EbulanWingsUserCredential'],
      issuer: 'urn:ebulan:platform',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: credentialId,
        email: email || undefined,
        phone: phone || undefined,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      proof: {
        type: 'JwtProof2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:ebulan:platform#key-1',
        jws: '',
      },
    };

    const token = jwt.sign(
      credential,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    credential.proof.jws = token;

    logger.info(`SSI user registered: ${user.id}, name: ${firstName} ${lastName}`);

    res.status(201).json({
      success: true,
      message: 'SSI Credentials created successfully. Download and keep them safe.',
      data: {
        userId: user.id,
        credentialId,
        credential,
      },
    });
  } catch (error: any) {
    logger.error('SSI registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user with SSI',
      details: error.message,
    });
  }
};

/**
 * Generate a new DID (Decentralized Identifier)
 * Pure DID generation - email/phone optional
 */
export const generateDID = async (req: Request, res: Response) => {
  try {
    const { publicKey, email, phone, firstName, lastName } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required',
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
      });
    }

    // Generate DID from public key
    const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
    const did = `did:ebulan:${hash.substring(0, 32)}`;

    // Create DID Document
    const didDocument: DIDDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: did,
      publicKey: [
        {
          id: `${did}#key-1`,
          type: 'Ed25519VerificationKey2018',
          controller: did,
          publicKeyPem: publicKey,
        },
      ],
      authentication: [`${did}#key-1`],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    // Check if DID already exists
    const existingUser = await prisma.user.findFirst({
      where: { did },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'DID already exists',
      });
    }

    // Check if email/phone already in use (if provided)
    if (email || phone) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : {},
            phone ? { phone } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      });

      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          error: 'Email or phone already in use',
        });
      }
    }

    // Store DID in database
    const user = await prisma.user.create({
      data: {
        email: email || `${did}@ebulan.local`,
        phone: phone || null,
        firstName,
        lastName,
        password: 'DID_AUTH',
        did,
        didDocument: JSON.stringify(didDocument),
        publicKey,
        emailVerified: !!email,
        phoneVerified: !!phone,
      },
    });

    logger.info(`DID generated: ${did}, name: ${firstName} ${lastName}`);

    res.status(201).json({
      success: true,
      data: {
        did,
        didDocument,
        userId: user.id,
      },
    });
  } catch (error: any) {
    logger.error('Generate DID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate DID',
    });
  }
};

/**
 * Issue Verifiable Credential
 */
export const issueCredential = async (req: Request, res: Response) => {
  try {
    const { did, attributes } = req.body;

    if (!did) {
      return res.status(400).json({
        success: false,
        error: 'DID is required',
      });
    }

    const user = await prisma.user.findFirst({
      where: { did },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://ebulanwings.com/credentials/v1',
      ],
      type: ['VerifiableCredential', 'EbulanWingsUserCredential'],
      issuer: 'did:ebulan:platform',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: did,
        email: user.email,
        phone: user.phone || undefined,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        ...attributes,
      },
      proof: {
        type: 'JwtProof2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:ebulan:platform#key-1',
        jws: '',
      },
    };

    const token = jwt.sign(
      credential,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1y' }
    );

    credential.proof.jws = token;

    await prisma.verifiableCredential.create({
      data: {
        userId: user.id,
        did,
        type: 'EbulanWingsUserCredential',
        credential: JSON.stringify(credential),
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`Credential issued for DID: ${did}`);

    res.status(200).json({
      success: true,
      data: {
        credential,
        token,
      },
    });
  } catch (error: any) {
    logger.error('Issue credential error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to issue credential',
    });
  }
};

/**
 * SSI Login - Authenticate with DID and signature
 */
export const login = async (req: Request, res: Response) => {
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
        error: 'Identity not found',
      });
    }

    // Verify signature using user's public key
    const verifier = crypto.createVerify('SHA256');
    verifier.update(challenge);
    const isValid = verifier.verify(user.publicKey || '', signature, 'base64');

    if (!isValid) {
      logger.warn(`Failed SSI login attempt for DID: ${did}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid signature - authentication failed',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, did: user.did, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, did: user.did },
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

    logger.info(`SSI login successful for DID: ${did}, user: ${user.firstName} ${user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          did: user.did,
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
 * Verify Credential & Authenticate
 */
export const verifyCredential = async (req: Request, res: Response) => {
  try {
    const { credential, signature } = req.body;

    if (!credential || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Credential and signature required',
      });
    }

    const decoded: any = jwt.verify(
      credential,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    if (!decoded.credentialSubject?.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credential format',
      });
    }

    const did = decoded.credentialSubject.id;

    const user = await prisma.user.findFirst({
      where: { did },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const verifier = crypto.createVerify('SHA256');
    verifier.update(credential);
    const isValid = verifier.verify(user.publicKey || '', signature, 'base64');

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, did: user.did, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, did: user.did },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    });

    logger.info(`SSI authentication successful for DID: ${did}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          did: user.did,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('Verify credential error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Resolve DID Document
 */
export const resolveDID = async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    const user = await prisma.user.findFirst({
      where: { did },
      select: { didDocument: true },
    });

    if (!user || !user.didDocument) {
      return res.status(404).json({
        success: false,
        error: 'DID not found',
      });
    }

    const didDocument = JSON.parse(user.didDocument);

    res.status(200).json({
      success: true,
      data: didDocument,
    });
  } catch (error: any) {
    logger.error('Resolve DID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve DID',
    });
  }
};

/**
 * Revoke Credential
 */
export const revokeCredential = async (req: Request, res: Response) => {
  try {
    const { credentialId, reason } = req.body;

    if (!credentialId) {
      return res.status(400).json({
        success: false,
        error: 'Credential ID required',
      });
    }

    await prisma.verifiableCredential.update({
      where: { id: credentialId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });

    logger.info(`Credential revoked: ${credentialId}`);

    res.status(200).json({
      success: true,
      message: 'Credential revoked successfully',
    });
  } catch (error: any) {
    logger.error('Revoke credential error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke credential',
    });
  }
};
