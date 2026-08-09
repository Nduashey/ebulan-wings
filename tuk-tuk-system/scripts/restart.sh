#!/bin/bash

# EAA Tuk-Tuk System - Restart Services Script
# This script restarts specific or all services

set -e

echo "🔄 Restarting EAA Tuk-Tuk System Services..."
echo "============================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

if [ -z "$1" ]; then
    echo ""
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker compose restart
    echo ""
    echo -e "${GREEN}✅ All services restarted!${NC}"
else
    SERVICE=$1
    echo ""
    echo -e "${YELLOW}Restarting ${SERVICE}...${NC}"
    docker compose restart $SERVICE
    echo ""
    echo -e "${GREEN}✅ ${SERVICE} restarted!${NC}"
    echo ""
    echo -e "${BLUE}View logs:${NC} ./scripts/logs.sh $SERVICE"
fi

echo ""
echo -e "${BLUE}Check status:${NC} ./scripts/check.sh"
