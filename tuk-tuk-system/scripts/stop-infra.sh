#!/bin/bash

# EAA Tuk-Tuk System - Stop Infrastructure Services
# This script stops only the infrastructure services

set -e

echo "🛑 Stopping EAA Infrastructure Services..."
echo "=========================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Stopping services...${NC}"
docker compose stop postgres mongodb redis rabbitmq

echo ""
echo -e "${GREEN}✅ Infrastructure services stopped${NC}"
echo ""
echo -e "${YELLOW}💡 Options:${NC}"
echo "  Keep data:     Services stopped, data preserved"
echo "  Remove data:   ./scripts/cleanup.sh"
echo "  Restart:       ./scripts/start-infra.sh"
