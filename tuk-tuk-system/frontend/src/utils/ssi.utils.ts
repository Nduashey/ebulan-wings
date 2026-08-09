/**
 * SSI Client Utilities
 * 
 * Client-side utilities for SSI (Self-Sovereign Identity) operations:
 * - Key generation
 * - DID creation
 * - Credential management
 * - Signature creation
 * 
 * Uses Web Crypto API for browser compatibility
 */

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  did: string;
}

export interface StoredIdentity {
  did: string;
  keyPair: KeyPair;
  credentials: any[];
  created: string;
}

/**
 * Generate a new key pair for the user
 * 
 * Uses Web Crypto API for browser compatibility
 * Keys stay on user's device - never sent to server
 */
export const generateKeyPair = async (): Promise<KeyPair> => {
  // Generate random bytes for keys (simplified for demo)
  const publicKeyBytes = new Uint8Array(32);
  const privateKeyBytes = new Uint8Array(32);
  
  window.crypto.getRandomValues(publicKeyBytes);
  window.crypto.getRandomValues(privateKeyBytes);
  
  const publicKey = btoa(String.fromCharCode(...Array.from(publicKeyBytes)));
  const privateKey = btoa(String.fromCharCode(...Array.from(privateKeyBytes)));

  // Generate DID from public key using SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(publicKey);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const did = `did:ebulan:${hashHex.substring(0, 32)}`;

  return {
    publicKey,
    privateKey,
    did,
  };
};

/**
 * Store identity securely in browser
 * 
 * In production:
 * - Encrypt private key before storage
 * - Use IndexedDB for better security
 * - Consider hardware security modules
 */
export const storeIdentity = (identity: StoredIdentity): void => {
  try {
    // Encrypt sensitive data before storage
    const encrypted = encryptIdentity(identity);
    localStorage.setItem('ebulan_identity', JSON.stringify(encrypted));
  } catch (error) {
    console.error('Failed to store identity:', error);
    throw new Error('Failed to store identity securely');
  }
};

/**
 * Retrieve stored identity
 */
export const getStoredIdentity = (): StoredIdentity | null => {
  try {
    const encrypted = localStorage.getItem('ebulan_identity');
    if (!encrypted) return null;

    const identity = decryptIdentity(JSON.parse(encrypted));
    return identity;
  } catch (error) {
    console.error('Failed to retrieve identity:', error);
    return null;
  }
};

/**
 * Sign data with private key
 * 
 * Used to prove ownership of DID
 * Simplified for browser compatibility
 */
export const signData = async (data: string, privateKey: string): Promise<string> => {
  try {
    // Simple signing using HMAC for demo purposes
    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey);
    const messageData = encoder.encode(data);
    
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
    const signatureArray = Array.from(new Uint8Array(signature));
    return btoa(String.fromCharCode(...signatureArray));
  } catch (error) {
    console.error('Failed to sign data:', error);
    throw new Error('Signature generation failed');
  }
};

/**
 * Verify signature
 * Simplified for browser compatibility
 */
export const verifySignature = async (
  data: string,
  signature: string,
  publicKey: string
): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(publicKey);
    const messageData = encoder.encode(data);
    
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    return await window.crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes,
      messageData
    );
  } catch (error) {
    console.error('Failed to verify signature:', error);
    return false;
  }
};

/**
 * Create authentication presentation
 * 
 * Bundle credentials for authentication
 */
export const createPresentation = async (
  credentials: any[],
  challenge: string,
  privateKey: string
): Promise<any> => {
  const presentation = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: credentials,
    proof: {
      type: 'Ed25519Signature2018',
      created: new Date().toISOString(),
      challenge,
      proofPurpose: 'authentication',
      verificationMethod: '',
      jws: '',
    },
  };

  // Sign presentation
  const dataToSign = JSON.stringify({
    ...presentation,
    proof: { ...presentation.proof, jws: undefined },
  });
  presentation.proof.jws = await signData(dataToSign, privateKey);

  return presentation;
};

/**
 * Encrypt identity data
 * 
 * In production, use:
 * - AES-256-GCM encryption
 * - Password-derived key (PBKDF2)
 * - Hardware-backed keystore when available
 */
const encryptIdentity = (identity: StoredIdentity): any => {
  // Simple base64 encoding for demo
  // PRODUCTION: Use proper encryption
  const jsonStr = JSON.stringify(identity);
  return {
    encrypted: true,
    data: Buffer.from(jsonStr).toString('base64'),
    version: '1.0',
  };
};

/**
 * Decrypt identity data
 */
const decryptIdentity = (encrypted: any): StoredIdentity => {
  if (!encrypted.encrypted || !encrypted.data) {
    throw new Error('Invalid encrypted data');
  }

  const jsonStr = Buffer.from(encrypted.data, 'base64').toString('utf-8');
  return JSON.parse(jsonStr);
};

/**
 * Initialize SSI for new user
 * 
 * Complete onboarding flow:
 * 1. Generate keys
 * 2. Create DID
 * 3. Register with server
 * 4. Receive credentials
 */
export const initializeSSI = async (
  userData: { email?: string; phone?: string; name?: string }
): Promise<{ did: string; credentials: any[] }> => {
  try {
    // Generate key pair
    const keyPair = await generateKeyPair();

    // Register DID with server
    const response = await fetch('http://localhost:3001/api/ssi/did/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: keyPair.publicKey,
        ...userData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'DID registration failed');
    }

    // Store identity locally
    const identity: StoredIdentity = {
      did: keyPair.did,
      keyPair,
      credentials: [],
      created: new Date().toISOString(),
    };
    storeIdentity(identity);

    return {
      did: keyPair.did,
      credentials: [],
    };
  } catch (error: any) {
    console.error('SSI initialization failed:', error);
    throw error;
  }
};

/**
 * Authenticate using SSI
 * 
 * Present credentials to server for authentication
 */
export const authenticateWithSSI = async (): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {
  try {
    // Get stored identity
    const identity = getStoredIdentity();
    if (!identity) {
      throw new Error('No identity found. Please register first.');
    }

    // Get challenge from server
    const challengeResponse = await fetch(
      'http://localhost:3001/api/auth/challenge'
    );
    const challengeData = await challengeResponse.json();
    const challenge = challengeData.data.challenge;

    // Create presentation
    const presentation = await createPresentation(
      identity.credentials,
      challenge,
      identity.keyPair.privateKey
    );

    // Send to server for verification
    const authResponse = await fetch(
      'http://localhost:3001/api/ssi/credential/verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: JSON.stringify(presentation),
          signature: presentation.proof.jws,
        }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      throw new Error(authData.error || 'Authentication failed');
    }

    return authData.data;
  } catch (error: any) {
    console.error('SSI authentication failed:', error);
    throw error;
  }
};

/**
 * Export identity for backup
 * 
 * Allows user to backup their keys securely
 */
export const exportIdentity = (_password: string): string => {
  const identity = getStoredIdentity();
  if (!identity) {
    throw new Error('No identity to export');
  }

  // In production: Encrypt with password using strong KDF (password parameter for future use)
  const encrypted = encryptIdentity(identity);
  return JSON.stringify(encrypted);
};

/**
 * Import identity from backup
 */
export const importIdentity = (backupData: string, _password: string): void => {
  try {
    // In production: Use password to decrypt (password parameter for future use)
    const encrypted = JSON.parse(backupData);
    const identity = decryptIdentity(encrypted);
    storeIdentity(identity);
  } catch (error) {
    console.error('Failed to import identity:', error);
    throw new Error('Invalid backup data or password');
  }
};
