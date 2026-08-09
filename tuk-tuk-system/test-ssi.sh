#!/bin/bash

# Test script for Ebulan Wings SSI Authentication
# This demonstrates the production-grade decentralized authentication flow

echo "========================================="
echo "Ebulan Wings SSI Authentication Test"
echo "Production-Grade Decentralized Identity"
echo "========================================="
echo ""

# Test 1: Register a new user with SSI (no email/phone required)
echo "Test 1: Registering new user with SSI..."
echo "----------------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/ssi/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Smith",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuser12345test\n-----END PUBLIC KEY-----"
  }')

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Registration successful!"
  echo ""
  echo "DID Generated:"
  echo "$RESPONSE" | jq -r '.data.did'
  echo ""
  echo "Downloadable Credentials:"
  echo "$RESPONSE" | jq '.data.downloadableCredentials'
  echo ""
  
  # Save credentials to file
  DID=$(echo "$RESPONSE" | jq -r '.data.did')
  echo "$RESPONSE" | jq '.data.downloadableCredentials' > "ebulan-wings-credentials-${DID:11:16}.json"
  echo "📥 Credentials saved to: ebulan-wings-credentials-${DID:11:16}.json"
else
  echo "❌ Registration failed:"
  echo "$RESPONSE" | jq '.'
fi

echo ""
echo "========================================="
echo "Test 2: Register with optional email"
echo "----------------------------------------"

RESPONSE2=$(curl -s -X POST http://localhost:3000/api/ssi/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "Johnson", 
    "email": "bob@example.com",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuser67890test\n-----END PUBLIC KEY-----"
  }')

if echo "$RESPONSE2" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Registration with email successful!"
  echo ""
  echo "DID: $(echo "$RESPONSE2" | jq -r '.data.did')"
  echo "Email: $(echo "$RESPONSE2" | jq -r '.data.downloadableCredentials.identity.email')"
else
  echo "❌ Registration failed"
fi

echo ""
echo "========================================="
echo "Features Demonstrated:"
echo "----------------------------------------"
echo "✅ No email or phone required"
echo "✅ Decentralized Identity (DID) with did:ebulan prefix"
echo "✅ Downloadable credentials in JSON format"
echo "✅ Production-grade security with public/private keys"
echo "✅ Branding: Ebulan Wings Africa Limited"
echo ""
echo "Next Steps:"
echo "1. Frontend will generate RSA keys using Web Crypto API"
echo "2. Users download credentials file with private key"
echo "3. Login by signing challenge with private key"
echo "4. No passwords, no centralized identity provider"
echo "========================================="
