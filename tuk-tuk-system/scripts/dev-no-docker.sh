#!/bin/bash

# EAA Tuk-Tuk System - Development Mode (No Docker for Apps)
# This script runs services locally without Docker

set -e

echo "🔧 Starting EAA Tuk-Tuk System - Local Development Mode"
echo "========================================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p logs

echo ""
echo -e "${YELLOW}Prerequisites Check:${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "  ${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✓${NC} npm: $NPM_VERSION"
else
    echo -e "  ${RED}✗${NC} npm not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}💡 Note:${NC} Running in local mode (no Docker)"
echo "Make sure you have PostgreSQL, MongoDB, and Redis running locally,"
echo "or install Docker to use containerized infrastructure."
echo ""

# Check if dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "services/api-gateway/node_modules" ]; then
    echo "Installing API Gateway dependencies..."
    cd services/api-gateway
    npm install
    cd ../..
fi

echo ""
echo -e "${GREEN}✅ Dependencies ready!${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping services...${NC}"
    pkill -P $$ 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start Frontend
echo -e "${YELLOW}Starting Frontend on http://localhost:3100${NC}"
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a bit
sleep 2

# Start API Gateway
echo -e "${YELLOW}Starting API Gateway on http://localhost:3000${NC}"
cd services/api-gateway
npm run dev > ../../logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
cd ../..

sleep 2

echo ""
echo -e "${GREEN}✅ Services started!${NC}"
echo ""
echo -e "${BLUE}📋 Running Services:${NC}"
echo "  Frontend:    http://localhost:3100 (PID: $FRONTEND_PID)"
echo "  API Gateway: http://localhost:3000 (PID: $GATEWAY_PID)"
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo "  Frontend:    tail -f logs/frontend.log"
echo "  API Gateway: tail -f logs/api-gateway.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Monitor logs
tail -f logs/frontend.log logs/api-gateway.log
