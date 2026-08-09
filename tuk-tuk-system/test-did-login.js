#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

// Read DID document
const didDoc = JSON.parse(fs.readFileSync('/home/nduasheym/Downloads/ebulan-wings-did-did_ebulan_7e326567d.json', 'utf8'));

console.log('Testing DID Login...');
console.log('DID:', didDoc.did);

// Generate challenge
const challenge = `${didDoc.did}-${Date.now()}-${Math.random()}`;
console.log('Challenge generated');

// Sign challenge (simplified for testing)
const sign = crypto.createSign('RSA-SHA256');
sign.update(challenge);
sign.end();

// Convert PEM private key
const privateKeyPem = didDoc.keys.privateKey;
const signature = sign.sign(privateKeyPem, 'base64');

console.log('Signature generated, length:', signature.length);
console.log('\nSending login request...');

// Login request
fetch('http://localhost:3000/api/ssi/login', {
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
      console.log('\n✓ DID LOGIN SUCCESSFUL!');
      console.log('Access token received');
    } else {
      console.log('\n✗ Login failed:', data.error);
    }
  })
  .catch(error => {
    console.error('\n✗ Error:', error.message);
  });
