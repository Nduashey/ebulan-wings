#!/usr/bin/env node

/**
 * Register an existing DID document into the database
 * Usage: node register-existing-did.js /path/to/did-document.json
 */

const fs = require('fs');
const path = require('path');

const didDocPath = process.argv[2];

if (!didDocPath) {
  console.error('Usage: node register-existing-did.js /path/to/did-document.json');
  process.exit(1);
}

const didDoc = JSON.parse(fs.readFileSync(didDocPath, 'utf8'));

console.log('DID Document loaded:');
console.log('  DID:', didDoc.did);
console.log('  Name:', didDoc.identity?.firstName, didDoc.identity?.lastName);

const payload = {
  publicKey: didDoc.keys.publicKey,
  firstName: didDoc.identity.firstName,
  lastName: didDoc.identity.lastName,
  email: didDoc.identity.email !== 'Not provided' ? didDoc.identity.email : undefined,
  phone: didDoc.identity.phone !== 'Not provided' ? didDoc.identity.phone : undefined,
};

console.log('\nRegistering DID with payload:', JSON.stringify(payload, null, 2));

fetch('http://localhost:3000/api/ssi/did/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('\n✓ Successfully registered DID!');
      console.log('  DID:', data.data.did);
      console.log('  User ID:', data.data.userId);
      console.log('\nYou can now use this DID document to sign in.');
    } else {
      console.error('\n✗ Registration failed:', data.error);
      if (data.error.includes('already exists')) {
        console.log('\nThis DID is already registered. You can use it to sign in.');
      }
    }
  })
  .catch(error => {
    console.error('\n✗ Error:', error.message);
  });
