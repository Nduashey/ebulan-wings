#!/bin/bash

# EAA Tuk-Tuk System - View Logs Script
# This script helps view logs from different services

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 EAA Tuk-Tuk System - Service Logs${NC}"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# If no service specified, show all
if [ -z "$1" ]; then
    echo ""
    echo -e "${YELLOW}Available services:${NC}"
    echo "  Infrastructure:"
    echo "    - postgres"
    echo "    - mongodb"
    echo "    - redis"
    echo "    - rabbitmq"
    echo ""
    echo "  Application:"
    echo "    - frontend"
    echo "    - api-gateway"
    echo "    - auth-service"
    echo "    - booking-service"
    echo "    - driver-service"
    echo "    - payment-service"
    echo "    - notification-service"
    echo "    - location-service"
    echo "    - admin-service"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  View specific service: ./scripts/logs.sh [service-name]"
    echo "  View all services:     ./scripts/logs.sh all"
    echo ""
    echo "Examples:"
    echo "  ./scripts/logs.sh frontend"
    echo "  ./scripts/logs.sh api-gateway"
    echo "  ./scripts/logs.sh all"
    exit 0
fi

# Show logs
if [ "$1" = "all" ]; then
    echo ""
    echo -e "${GREEN}Showing logs for all services (Ctrl+C to exit)...${NC}"
    echo ""
    docker compose logs -f
else
    SERVICE=$1
    echo ""
    echo -e "${GREEN}Showing logs for ${SERVICE} (Ctrl+C to exit)...${NC}"
    echo ""
    docker compose logs -f $SERVICE
fi
