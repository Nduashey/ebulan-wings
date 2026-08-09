/**
 * SSI (Self-Sovereign Identity) Service - Production Grade
 * Ebulan Wings Decentralized Authentication
 * 
 * Features:
 * - Client-side key generation using Web Crypto API
 * - Secure key storage in IndexedDB
 * - DID-based authentication
 * - Downloadable credential files
 */

interface KeyPair {
  publicKey: string;
  privateKey: string;
  did?: string;
}

interface Credentials {
  type: 'Ebulan-Wings-SSI-Credentials';
  version: '1.0';
  created: string;
  identity: {
    credentialId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  authentication: {
    publicKey: string;
    privateKey: string;
    note: string;
  };
  instructions: {
    login: string;
    security: string;
    recovery: string;
  };
  platformInfo: {
    serviceName: string;
    apiEndpoint: string;
    loginEndpoint: string;
  };
}

/**
 * Generate RSA key pair using Web Crypto API
 */
export const generateKeyPair = async (): Promise<KeyPair> => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyPem = bufferToPem(publicKeyBuffer, 'PUBLIC KEY');

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyPem = bufferToPem(privateKeyBuffer, 'PRIVATE KEY');

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem,
    };
  } catch (error) {
    console.error('Key generation error:', error);
    throw new Error('Failed to generate cryptographic keys');
  }
};

/**
 * Convert ArrayBuffer to PEM format
 */
const bufferToPem = (buffer: ArrayBuffer, type: string): string => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
  return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
};

/**
 * Convert PEM to ArrayBuffer
 */
const pemToBuffer = (pem: string): ArrayBuffer => {
  const base64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/, '')
    .replace(/-----END [A-Z ]+-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Sign data with private key
 */
export const signData = async (data: string, privateKeyPem: string): Promise<string> => {
  try {
    const privateKeyBuffer = pemToBuffer(privateKeyPem);
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signature = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, dataBuffer);

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error('Failed to sign data');
  }
};

/**
 * Store credentials securely in IndexedDB
 */
export const storeCredentials = async (credentials: Credentials): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EbulanWingsSSI', 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('credentials')) {
        db.createObjectStore('credentials', { keyPath: 'did' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['credentials'], 'readwrite');
      const store = transaction.objectStore('credentials');

      const saveRequest = store.put({
        credentialId: credentials.identity.credentialId,
        credentials: JSON.stringify(credentials),
        timestamp: Date.now(),
      });

      saveRequest.onsuccess = () => {
        db.close();
        resolve();
      };

      saveRequest.onerror = () => {
        db.close();
        reject(new Error('Failed to store credentials'));
      };
    };
  });
};

/**
 * Retrieve credentials from IndexedDB
 */
export const getStoredCredentials = async (did: string): Promise<Credentials | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EbulanWingsSSI', 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['credentials'], 'readonly');
      const store = transaction.objectStore('credentials');
      const getRequest = store.get(did);

      getRequest.onsuccess = () => {
        db.close();
        if (getRequest.result) {
          resolve(JSON.parse(getRequest.result.credentials));
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        db.close();
        reject(new Error('Failed to retrieve credentials'));
      };
    };
  });
};

/**
 * Download credentials as JSON file
 */
export const downloadCredentials = (credentials: Credentials): void => {
  const dataStr = JSON.stringify(credentials, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ebulan-wings-ssi-credential-${credentials.identity.credentialId.split(':').pop()?.substring(0, 16)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Register new user with SSI
 */
export const registerWithSSI = async (
  firstName: string,
  lastName: string,
  email?: string,
  phone?: string
): Promise<Credentials> => {
  try {
    // Generate key pair
    const { publicKey, privateKey } = await generateKeyPair();

    // Register with backend
    const response = await fetch('/api/ssi/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        publicKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();

    // Generate credential ID from public key hash
    const credentialId = data.data.credentialId || `urn:ebulan:credential:${data.data.userId}`;

    // Create downloadable SSI credentials
    const credentials: Credentials = {
      type: 'Ebulan-Wings-SSI-Credentials',
      version: '1.0',
      created: new Date().toISOString(),
      identity: {
        credentialId,
        firstName,
        lastName,
        email,
        phone,
      },
      authentication: {
        publicKey,
        privateKey,
        note: 'Keep your private key secure. You will need it to sign login requests.',
      },
      instructions: {
        login: 'To login, upload this SSI credential file and verify your signature',
        security: 'NEVER share your private key with anyone. Store this file securely.',
        recovery: 'If you lose your private key, you will lose access to this identity PERMANENTLY.',
      },
      platformInfo: {
        serviceName: 'Ebulan Wings Tuk-Tuk System',
        apiEndpoint: window.location.origin,
        loginEndpoint: '/api/ssi/login/ssi',
      },
    };

    // Store in IndexedDB
    await storeCredentials(credentials);

    return credentials;
  } catch (error) {
    console.error('SSI Registration error:', error);
    throw error;
  }
};

/**
 * Login with SSI credentials
 */
export const loginWithSSI = async (credentials: Credentials): Promise<any> => {
  try {
    // Generate challenge
    const challenge = `${credentials.identity.credentialId}-${Date.now()}-${Math.random()}`;

    // Sign challenge with private key
    const signature = await signData(challenge, credentials.authentication.privateKey);

    // Send login request
    const response = await fetch('/api/ssi/login/ssi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentialId: credentials.identity.credentialId,
        challenge,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SSI Login error:', error);
    throw error;
  }
};

/**
 * Parse credentials from uploaded file
 */
export const parseCredentialsFile = async (file: File): Promise<Credentials> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const credentials = JSON.parse(e.target?.result as string);
        
        // Validate credentials structure
        if (
          credentials.type !== 'Ebulan-Wings-SSI-Credentials' ||
          !credentials.identity?.credentialId ||
          !credentials.authentication?.privateKey
        ) {
          throw new Error('Invalid credentials file format');
        }

        resolve(credentials);
      } catch (error) {
        reject(new Error('Failed to parse credentials file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
