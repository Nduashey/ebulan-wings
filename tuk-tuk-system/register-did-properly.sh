#!/bin/bash

# Read the DID document
DID_FILE="/home/nduasheym/Downloads/ebulan-wings-did-did_ebulan_7e326567d.json"

echo "Reading DID document from: $DID_FILE"

# Extract fields using jq
PUBLIC_KEY=$(jq -r '.keys.publicKey' "$DID_FILE")
FIRST_NAME=$(jq -r '.identity.firstName' "$DID_FILE")
LAST_NAME=$(jq -r '.identity.lastName' "$DID_FILE")
EMAIL=$(jq -r '.identity.email' "$DID_FILE")
PHONE=$(jq -r '.identity.phone' "$DID_FILE")

echo "Extracted data:"
echo "  Name: $FIRST_NAME $LAST_NAME"
echo "  Email: $EMAIL"
echo "  Phone: $PHONE"
echo ""

# Build JSON payload
JSON_PAYLOAD=$(jq -n \
  --arg pk "$PUBLIC_KEY" \
  --arg fn "$FIRST_NAME" \
  --arg ln "$LAST_NAME" \
  --arg em "$EMAIL" \
  --arg ph "$PHONE" \
  '{
    publicKey: $pk,
    firstName: $fn,
    lastName: $ln,
    email: (if $em == "Not provided" then null else $em end),
    phone: (if $ph == "Not provided" then null else $ph end)
  }')

echo "Registering DID..."
echo ""

# Make the API call
curl -X POST http://localhost:3000/api/ssi/did/generate \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" | jq .

echo ""
echo "Registration complete!"
