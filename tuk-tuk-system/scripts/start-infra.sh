#!/bin/bash

# EAA Tuk-Tuk System - Start Infrastructure Only
# This script starts only the infrastructure services (databases, cache, message queue)

set -e

echo "📦 Starting EAA Infrastructure Services..."
echo "=========================================="

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

echo ""
echo -e "${YELLOW}Starting services...${NC}"
docker compose up -d postgres mongodb redis rabbitmq

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check services
echo ""
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check PostgreSQL
echo -n "  PostgreSQL:  "
if docker exec eaa-postgres pg_isready -U eaa_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC} (localhost:5432)"
else
    echo -e "${RED}✗ Not ready${NC}"
fi

# Check MongoDB
echo -n "  MongoDB:     "
if docker exec eaa-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC} (localhost:27017)"
else
    echo -e "${RED}✗ Not ready${NC}"
fi

# Check Redis
echo -n "  Redis:       "
if docker exec eaa-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC} (localhost:6379)"
else
    echo -e "${RED}✗ Not ready${NC}"
fi

# Check RabbitMQ
echo -n "  RabbitMQ:    "
if docker exec eaa-rabbitmq rabbitmqctl status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC} (AMQP: localhost:5672, Management: localhost:15672)"
else
    echo -e "${RED}✗ Not ready${NC}"
fi

echo ""
echo -e "${GREEN}✅ Infrastructure services are running!${NC}"
echo ""
echo -e "${BLUE}📋 Connection Details:${NC}"
echo "  PostgreSQL:"
echo "    Host: localhost:5432"
echo "    Database: eaa_db"
echo "    User: eaa_user"
echo "    Password: eaa_password"
echo ""
echo "  MongoDB:"
echo "    URL: mongodb://localhost:27017/eaa_db"
echo ""
echo "  Redis:"
echo "    URL: redis://localhost:6379"
echo ""
echo "  RabbitMQ:"
echo "    AMQP: amqp://localhost:5672"
echo "    Management UI: http://localhost:15672"
echo "    User: eaa_user"
echo "    Password: eaa_password"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  Run development mode:  ./scripts/dev-no-docker.sh"
echo "  Check status:          ./scripts/check.sh"
echo "  Stop infrastructure:   ./scripts/stop-infra.sh"
