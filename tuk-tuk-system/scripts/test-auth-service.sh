#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001"

echo "========================================="
echo "Testing Auth Service API"
echo "========================================="

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
curl -s -X GET "${BASE_URL}/health" | jq . || echo -e "${RED}Failed${NC}"

# Test 2: Register User
echo -e "\n${YELLOW}Test 2: Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+254700123456",
    "role": "PASSENGER"
  }')
echo "$REGISTER_RESPONSE" | jq .

# Extract tokens
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.refreshToken')

echo -e "${GREEN}Access Token: $ACCESS_TOKEN${NC}"

# Test 3: Login
echo -e "\n${YELLOW}Test 3: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }')
echo "$LOGIN_RESPONSE" | jq .

# Update tokens from login response
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

# Test 4: Get Profile (Protected Route)
echo -e "\n${YELLOW}Test 4: Get Profile (Protected Route)${NC}"
curl -s -X GET "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . || echo -e "${RED}Failed${NC}"

# Test 5: Update Profile
echo -e "\n${YELLOW}Test 5: Update Profile${NC}"
curl -s -X PUT "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "phone": "+254700999888"
  }' | jq . || echo -e "${RED}Failed${NC}"

# Test 6: Refresh Token
echo -e "\n${YELLOW}Test 6: Refresh Token${NC}"
curl -s -X POST "${BASE_URL}/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq . || echo -e "${RED}Failed${NC}"

# Test 7: Change Password
echo -e "\n${YELLOW}Test 7: Change Password${NC}"
curl -s -X POST "${BASE_URL}/api/auth/change-password" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test1234!",
    "newPassword": "NewTest1234!"
  }' | jq . || echo -e "${RED}Failed${NC}"

# Test 8: Logout
echo -e "\n${YELLOW}Test 8: Logout${NC}"
curl -s -X POST "${BASE_URL}/api/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . || echo -e "${RED}Failed${NC}"

# Test 9: Access Protected Route After Logout (Should Fail)
echo -e "\n${YELLOW}Test 9: Access After Logout (Should Fail)${NC}"
curl -s -X GET "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . || echo -e "${RED}Failed${NC}"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
