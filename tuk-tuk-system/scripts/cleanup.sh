#!/bin/bash

# EAA Tuk-Tuk System - Cleanup Script
# This script performs deep cleanup of Docker resources

set -e

echo "🧹 EAA Tuk-Tuk System - Deep Cleanup"
echo "====================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}⚠️  WARNING: This will remove:${NC}"
echo "  - All EAA containers"
echo "  - All EAA volumes (DATABASE DATA WILL BE LOST)"
echo "  - All EAA networks"
echo "  - All unused Docker images"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}🛑 Stopping all services...${NC}"
docker compose down -v 2>/dev/null || true

echo ""
echo -e "${YELLOW}🗑️  Removing EAA containers...${NC}"
docker ps -a --format '{{.Names}}' | grep "eaa-" | xargs -r docker rm -f 2>/dev/null || true

echo ""
echo -e "${YELLOW}🗑️  Removing EAA volumes...${NC}"
docker volume ls --format '{{.Name}}' | grep "eaa-" | xargs -r docker volume rm 2>/dev/null || true

echo ""
echo -e "${YELLOW}🗑️  Removing EAA networks...${NC}"
docker network ls --format '{{.Name}}' | grep "eaa-" | xargs -r docker network rm 2>/dev/null || true

echo ""
echo -e "${YELLOW}🗑️  Removing unused Docker images...${NC}"
docker image prune -f

echo ""
echo -e "${YELLOW}🗑️  Removing dangling volumes...${NC}"
docker volume prune -f

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}💡 To rebuild everything:${NC}"
echo "  docker compose build"
echo "  ./scripts/start.sh"
