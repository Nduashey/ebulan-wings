#!/bin/bash

# EAA Tuk-Tuk System - Check Services Script
# This script checks the status of all services

set -e

echo "🔍 Checking EAA Tuk-Tuk System Status..."
echo "========================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Docker Services Status:${NC}"
echo ""

# Function to check container status
check_container() {
    local container_name=$1
    local service_name=$2
    local port=$3
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        local status=$(docker inspect --format='{{.State.Status}}' $container_name)
        if [ "$status" = "running" ]; then
            echo -e "  ${GREEN}✓${NC} ${service_name} (${container_name}:${port}) - ${GREEN}Running${NC}"
        else
            echo -e "  ${RED}✗${NC} ${service_name} (${container_name}:${port}) - ${RED}${status}${NC}"
        fi
    else
        echo -e "  ${RED}✗${NC} ${service_name} (${container_name}:${port}) - ${RED}Not Running${NC}"
    fi
}

# Check infrastructure services
echo -e "${YELLOW}Infrastructure Services:${NC}"
check_container "eaa-postgres" "PostgreSQL" "5432"
check_container "eaa-mongodb" "MongoDB" "27017"
check_container "eaa-redis" "Redis" "6379"
check_container "eaa-rabbitmq" "RabbitMQ" "5672/15672"

echo ""
echo -e "${YELLOW}Application Services:${NC}"
check_container "eaa-api-gateway" "API Gateway" "3000"
check_container "eaa-auth-service" "Auth Service" "3001"
check_container "eaa-booking-service" "Booking Service" "3002"
check_container "eaa-driver-service" "Driver Service" "3003"
check_container "eaa-payment-service" "Payment Service" "3004"
check_container "eaa-notification-service" "Notification Service" "3005"
check_container "eaa-location-service" "Location Service" "3006"
check_container "eaa-admin-gateway" "Admin Gateway" "3010"
check_container "eaa-admin-service" "Admin Service" "3007"
check_container "eaa-frontend" "Frontend" "3100"
check_container "eaa-admin-frontend" "Admin Frontend" "3200"

echo ""
echo -e "${BLUE}📊 Resource Usage:${NC}"
echo ""

# Show container stats (one-time snapshot)
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep "eaa-" || echo "  No EAA containers running"

echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo ""
echo "  Client Frontend: http://localhost:3100"
echo "  Admin Frontend:  http://localhost:3200"
echo "  Client Gateway:  http://localhost:3000"
echo "  Admin Gateway:   http://localhost:3010"
echo "  RabbitMQ Admin:  http://localhost:15672"
echo ""

# Health check endpoints
echo -e "${BLUE}🏥 Health Checks:${NC}"
echo ""

# Check API Gateway health
echo -n "  API Gateway:     "
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unreachable${NC}"
fi

# Check Frontend
echo -n "  Frontend:        "
if curl -s http://localhost:3100 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Unreachable${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo "  View logs:       ./scripts/logs.sh [service-name]"
echo "  Restart service: docker compose restart [service-name]"
echo "  Stop all:        ./scripts/stop.sh"
