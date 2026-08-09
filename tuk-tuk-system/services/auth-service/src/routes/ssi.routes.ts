import { Router } from 'express';
import {
  register,
  login,
  generateDID,
  issueCredential,
  verifyCredential,
  resolveDID,
  revokeCredential,
} from '../controllers/ssi.controller';
import { ssiLogin, didLogin } from '../controllers/auth-login.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * SSI (Self-Sovereign Identity) Routes
 * 
 * Production-grade decentralized authentication endpoints
 */

// Register new user with SSI (no email/phone required)
router.post('/register', register);

// SSI Login (credential-based, no DID)
router.post('/login/ssi', ssiLogin);

// DID Login (decentralized identifier based)
router.post('/login/did', didLogin);

// Legacy login endpoint (kept for backward compatibility)
router.post('/login', login);

// Generate new DID for user
router.post('/did/generate', generateDID);

// Issue verifiable credential
router.post('/credential/issue', authenticate, issueCredential);

// Verify credential and authenticate
router.post('/credential/verify', verifyCredential);

// Resolve DID to DID Document
router.get('/did/:did', resolveDID);

// Revoke credential
router.post('/credential/revoke', authenticate, revokeCredential);

export default router;
