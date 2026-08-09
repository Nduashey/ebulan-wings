#!/bin/bash

# EAA Tuk-Tuk System - Complete Startup Script
# This script ensures everything is ready and starts the system

set -e

echo "🚀 EAA Tuk-Tuk System - Complete Startup"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_DIR="/home/nduasheym/EAA/tuk-tuk-system/frontend"

# Check Docker
echo -e "${BLUE}1. Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Start Docker with: sudo systemctl start docker"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Start infrastructure
echo -e "${BLUE}2. Starting Infrastructure Services...${NC}"
if docker ps --format '{{.Names}}' | grep -q "eaa-postgres"; then
    echo -e "${GREEN}✓ Infrastructure already running${NC}"
else
    echo "Starting PostgreSQL, MongoDB, Redis, RabbitMQ..."
    docker compose up -d postgres mongodb redis rabbitmq
    echo "Waiting for services to be ready..."
    sleep 5
    echo -e "${GREEN}✓ Infrastructure started${NC}"
fi
echo ""

# Check frontend dependencies
echo -e "${BLUE}3. Checking Frontend Dependencies...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ] || [ ! -d "node_modules/react" ]; then
    echo -e "${YELLOW}Installing dependencies (this may take a few minutes)...${NC}"
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}✅ System is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Running Services:${NC}"
echo "  Infrastructure:"
docker ps --format "    ✓ {{.Names}} ({{.Status}})" | grep "eaa-"
echo ""

echo -e "${BLUE}🌐 Available URLs:${NC}"
echo "  Client Frontend:  http://localhost:3100"
echo "  Admin Frontend:   http://localhost:3200"
echo "  Client Gateway:   http://localhost:3000"
echo "  Admin Gateway:    http://localhost:3010"
echo "  PostgreSQL:       localhost:5432"
echo "  MongoDB:          localhost:27017"
echo "  Redis:            localhost:6379"
echo "  RabbitMQ (AMQP):  localhost:5672"
echo "  RabbitMQ (UI):    http://localhost:15672"
echo ""

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  Start Frontend:   ./scripts/start-frontend.sh"
echo "  Or run:           cd frontend && npm start"
echo ""
echo "  Frontend will be at: http://localhost:3100"
echo ""

# Ask if user wants to start frontend now
read -p "Start frontend now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Starting frontend...${NC}"
    cd "$FRONTEND_DIR"
    export PORT=3100
    export BROWSER=none
    npm start
fi
