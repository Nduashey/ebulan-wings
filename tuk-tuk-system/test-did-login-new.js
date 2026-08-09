#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

// Read DID document
const didDoc = JSON.parse(fs.readFileSync('/home/nduasheym/Downloads/ebulan-wings-did-did_ebulan_7e326567d.json', 'utf8'));

console.log('Testing NEW DID Login Endpoint...');
console.log('DID:', didDoc.did);
console.log('Document Type:', didDoc.type);

// Generate challenge
const challenge = `${didDoc.did}-${Date.now()}-${Math.random()}`;

// Sign challenge
const sign = crypto.createSign('RSA-SHA256');
sign.update(challenge);
sign.end();
const signature = sign.sign(didDoc.keys.privateKey, 'base64');

console.log('\nSending login request to /api/ssi/login/did...');

// Login request to new endpoint
fetch('http://localhost:3000/api/ssi/login/did', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    did: didDoc.did,
    challenge,
    signature
  })
})
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    if (data.success) {
      console.log('\n✓ DID LOGIN SUCCESSFUL WITH NEW ENDPOINT!');
      console.log('Auth Type:', data.data.user.authType);
    } else {
      console.log('\n✗ Login failed:', data.error);
    }
  })
  .catch(error => {
    console.error('\n✗ Error:', error.message);
  });
