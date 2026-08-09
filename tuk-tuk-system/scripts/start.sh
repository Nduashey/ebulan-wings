#!/bin/bash

# EAA Tuk-Tuk System - Start Services Script
# This script starts all services needed for development
# Usage:
#   ./start.sh              # Start everything
#   ./start.sh infra        # Start infrastructure only
#   ./start.sh apps         # Start application services only

set -e

MODE=${1:-all}

echo "🚀 Starting EAA Tuk-Tuk System..."
echo "=================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

if [ "$MODE" = "all" ] || [ "$MODE" = "infra" ]; then
    echo -e "${YELLOW}📦 Starting infrastructure services...${NC}"
    docker compose up -d postgres mongodb redis rabbitmq
    
    echo ""
    echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
    sleep 5
fi

if [ "$MODE" = "infra" ]; then
    echo ""
    echo -e "${GREEN}✅ Infrastructure services started!${NC}"
    echo ""
    echo -e "${BLUE}📋 Running Services:${NC}"
    echo "  PostgreSQL:  localhost:5432"
    echo "  MongoDB:     localhost:27017"
    echo "  Redis:       localhost:6379"
    echo "  RabbitMQ:    localhost:5672 (AMQP) / localhost:15672 (Management UI)"
    echo ""
    echo "💡 Run './scripts/start.sh apps' to start application services"
    exit 0
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if docker exec eaa-postgres pg_isready -U eaa_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check MongoDB
echo -n "Checking MongoDB... "
if docker exec eaa-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check Redis
echo -n "Checking Redis... "
if docker exec eaa-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check RabbitMQ
echo -n "Checking RabbitMQ... "
if docker exec eaa-rabbitmq rabbitmqctl status > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

if [ "$MODE" = "all" ] || [ "$MODE" = "apps" ]; then
    echo ""
    echo -e "${YELLOW}🔧 Starting application services...${NC}"
    echo -e "${BLUE}Note: Application services need to be built first${NC}"
    echo ""
    
    # Check if we should start apps (they may not be built yet)
    read -p "Application services require npm install and build. Start anyway? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Start API Gateway
        echo "Starting API Gateway..."
        docker compose up -d api-gateway 2>/dev/null || echo -e "${YELLOW}⚠️  API Gateway not ready (need to build)${NC}"
        
        # Start Frontend
        echo "Starting Frontend..."
        docker compose up -d frontend 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend not ready (need to build)${NC}"
    else
        echo -e "${BLUE}Skipping application services. Use './scripts/dev-no-docker.sh' to run locally.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📋 Service URLs:"
echo "  Frontend:        http://localhost:3100"
echo "  API Gateway:     http://localhost:3000"
echo "  RabbitMQ Admin:  http://localhost:15672 (user: eaa_user, pass: eaa_password)"
echo ""
echo "💡 Run './scripts/check.sh' to see the status of all services"
echo "💡 Run './scripts/logs.sh' to view service logs"
echo "💡 Run './scripts/stop.sh' to stop all services"
