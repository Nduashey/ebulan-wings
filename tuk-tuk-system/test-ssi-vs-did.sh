#!/bin/bash

echo "========================================="
echo "SSI vs DID - Protocol Comparison"
echo "Ebulan Wings Authentication System"
echo "========================================="
echo ""

echo "📋 Protocol Differences:"
echo "----------------------------------------"
echo ""
echo "🔐 SSI (Self-Sovereign Identity):"
echo "   • Based on Verifiable Credentials"
echo "   • Issues credentials with proofs"
echo "   • Supports credential revocation"
echo "   • Platform issues and verifies credentials"
echo "   • Endpoint: /api/ssi/register"
echo ""
echo "🆔 DID (Decentralized Identifier):"
echo "   • Pure identifier protocol"
echo "   • No credential issuance"
echo "   • Direct DID Document generation"
echo "   • User controls identity completely"
echo "   • Endpoint: /api/ssi/did/generate"
echo ""
echo "========================================="
echo ""

# Test SSI Registration
echo "Test 1: SSI Registration (Verifiable Credentials)"
echo "----------------------------------------"
SSI_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ssi/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "SSI",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAssitest123\n-----END PUBLIC KEY-----"
  }')

if echo "$SSI_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ SSI Registration successful!"
  DID_SSI=$(echo "$SSI_RESPONSE" | jq -r '.data.did')
  echo "   DID: $DID_SSI"
  echo "   Type: $(echo "$SSI_RESPONSE" | jq -r '.data.downloadableCredentials.type')"
  echo "   Has Credential: $(echo "$SSI_RESPONSE" | jq -e '.data.credential' > /dev/null && echo "Yes" || echo "No")"
else
  echo "❌ SSI Registration failed"
  echo "$SSI_RESPONSE" | jq '.'
fi

echo ""
echo "========================================="
echo ""

# Test DID Generation
echo "Test 2: DID Generation (Pure Identifier)"
echo "----------------------------------------"
DID_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ssi/did/generate \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "DID",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAdidtest456\n-----END PUBLIC KEY-----"
  }')

if echo "$DID_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ DID Generation successful!"
  DID_PURE=$(echo "$DID_RESPONSE" | jq -r '.data.did')
  echo "   DID: $DID_PURE"
  echo "   Type: Pure DID Document"
  echo "   Has Credential: No (DID only)"
else
  echo "❌ DID Generation failed"
  echo "$DID_RESPONSE" | jq '.'
fi

echo ""
echo "========================================="
echo ""
echo "📊 Summary of Differences:"
echo "----------------------------------------"
echo ""
echo "Feature                    | SSI                  | DID"
echo "---------------------------|----------------------|--------------------"
echo "Verifiable Credentials     | ✅ Yes               | ❌ No"
echo "Credential Issuance        | ✅ Platform issues   | ❌ Not applicable"
echo "Credential Revocation      | ✅ Supported         | ❌ Not applicable"
echo "Pure Decentralization      | ⚠️  Partial          | ✅ Complete"
echo "Identity Document          | ✅ Yes               | ✅ Yes"
echo "Authentication Method      | Credential + Sig     | DID + Signature"
echo "Platform Dependency        | Medium               | Minimal"
echo "Use Case                   | Verified Identity    | Anonymous Auth"
echo ""
echo "========================================="
echo ""
echo "💡 When to use each:"
echo "----------------------------------------"
echo "Use SSI when:"
echo "  • You need verifiable credentials"
echo "  • Platform needs to issue/revoke credentials"
echo "  • Identity attributes need verification"
echo "  • Regulatory compliance required"
echo ""
echo "Use DID when:"
echo "  • Maximum decentralization needed"
echo "  • No credential verification required"
echo "  • Anonymous authentication preferred"
echo "  • User wants complete sovereignty"
echo ""
echo "========================================="
