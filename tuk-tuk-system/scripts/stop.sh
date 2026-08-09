#!/bin/bash

# EAA Tuk-Tuk System - Stop Services Script
# This script stops all running services

set -e

echo "🛑 Stopping EAA Tuk-Tuk System..."
echo "================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if user wants to remove volumes
REMOVE_VOLUMES=false
if [ "$1" = "--volumes" ] || [ "$1" = "-v" ]; then
    echo -e "${YELLOW}⚠️  WARNING: This will remove all data in databases!${NC}"
    read -p "Are you sure you want to remove volumes? (yes/no): " confirmation
    if [ "$confirmation" = "yes" ]; then
        REMOVE_VOLUMES=true
    else
        echo "Volumes will be preserved."
    fi
fi

echo ""
echo -e "${YELLOW}🔧 Stopping application services...${NC}"
docker compose stop frontend admin-frontend api-gateway admin-gateway auth-service booking-service driver-service payment-service notification-service location-service admin-service 2>/dev/null || true

echo ""
echo -e "${YELLOW}📦 Stopping infrastructure services...${NC}"
docker compose stop postgres mongodb redis rabbitmq 2>/dev/null || true

echo ""
echo -e "${YELLOW}🧹 Removing containers...${NC}"

if [ "$REMOVE_VOLUMES" = true ]; then
    docker compose down -v
    echo -e "${GREEN}✅ All services stopped and volumes removed${NC}"
else
    docker compose down
    echo -e "${GREEN}✅ All services stopped (volumes preserved)${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Remaining EAA containers:${NC}"
REMAINING=$(docker ps -a --format '{{.Names}}' | grep "eaa-" || true)
if [ -z "$REMAINING" ]; then
    echo "  None - All cleaned up!"
else
    echo "$REMAINING"
fi

echo ""
echo -e "${YELLOW}💡 Usage:${NC}"
echo "  Stop services (keep data):      ./scripts/stop.sh"
echo "  Stop services (remove data):    ./scripts/stop.sh --volumes"
echo "  Start services again:           ./scripts/start.sh"
