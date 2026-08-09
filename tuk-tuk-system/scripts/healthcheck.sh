#!/bin/bash

# EAA Tuk-Tuk System - Comprehensive System Check
# This script checks the status of all services and dependencies

set -e

echo "🔍 EAA Tuk-Tuk System - Health Check"
echo "====================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    local cmd=$1
    local name=$2
    echo -n "  ${name}: "
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo -e "${GREEN}✓ Installed${NC} ($version)"
    else
        echo -e "${RED}✗ Not found${NC}"
        ((ERRORS++))
    fi
}

# Function to check Docker container
check_container() {
    local container=$1
    local name=$2
    local port=$3
    echo -n "  ${name}: "
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
        echo -e "${GREEN}✓ Running${NC} (localhost:${port})"
    else
        echo -e "${RED}✗ Not running${NC}"
        ((WARNINGS++))
    fi
}

# Function to check directory
check_directory() {
    local dir=$1
    local name=$2
    echo -n "  ${name}: "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
    else
        echo -e "${RED}✗ Missing${NC}"
        ((ERRORS++))
    fi
}

# Function to check file
check_file() {
    local file=$1
    local name=$2
    echo -n "  ${name}: "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
    else
        echo -e "${RED}✗ Missing${NC}"
        ((ERRORS++))
    fi
}

# Function to check npm dependencies
check_npm_deps() {
    local dir=$1
    local name=$2
    echo -n "  ${name}: "
    if [ -d "$dir/node_modules" ]; then
        local count=$(find "$dir/node_modules" -maxdepth 1 -type d | wc -l)
        echo -e "${GREEN}✓ Installed${NC} ($count packages)"
    else
        echo -e "${YELLOW}⚠ Not installed${NC}"
        ((WARNINGS++))
    fi
}

echo -e "${BLUE}1. System Requirements${NC}"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "docker" "Docker"
check_command "git" "Git"

echo ""
echo -e "${BLUE}2. Docker Service${NC}"
echo -n "  Docker Daemon: "
if docker info &> /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    ((ERRORS++))
fi

echo ""
echo -e "${BLUE}3. Infrastructure Services${NC}"
check_container "eaa-postgres" "PostgreSQL" "5432"
check_container "eaa-mongodb" "MongoDB" "27017"
check_container "eaa-redis" "Redis" "6379"
check_container "eaa-rabbitmq" "RabbitMQ" "5672/15672"

echo ""
echo -e "${BLUE}4. Project Structure${NC}"
check_directory "/home/nduasheym/EAA/tuk-tuk-system" "Project Root"
check_directory "/home/nduasheym/EAA/tuk-tuk-system/frontend" "Frontend"
check_directory "/home/nduasheym/EAA/tuk-tuk-system/services" "Services"
check_directory "/home/nduasheym/EAA/tuk-tuk-system/services/api-gateway" "API Gateway"

echo ""
echo -e "${BLUE}5. Configuration Files${NC}"
check_file "/home/nduasheym/EAA/tuk-tuk-system/docker-compose.yml" "docker-compose.yml"
check_file "/home/nduasheym/EAA/tuk-tuk-system/package.json" "Root package.json"
check_file "/home/nduasheym/EAA/tuk-tuk-system/frontend/package.json" "Frontend package.json"
check_file "/home/nduasheym/EAA/tuk-tuk-system/services/api-gateway/package.json" "API Gateway package.json"

echo ""
echo -e "${BLUE}6. Dependencies${NC}"
check_npm_deps "/home/nduasheym/EAA/tuk-tuk-system/frontend" "Frontend Dependencies"
check_npm_deps "/home/nduasheym/EAA/tuk-tuk-system/services/api-gateway" "API Gateway Dependencies"

echo ""
echo -e "${BLUE}7. Port Availability${NC}"
check_port() {
    local port=$1
    local service=$2
    echo -n "  Port $port ($service): "
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local process=$(lsof -Pi :$port -sTCP:LISTEN | tail -n1 | awk '{print $1}')
        echo -e "${YELLOW}⚠ In use${NC} (by $process)"
    else
        echo -e "${GREEN}✓ Available${NC}"
    fi
}

check_port 3000 "API Gateway"
check_port 3100 "Frontend"
check_port 5432 "PostgreSQL"
check_port 27017 "MongoDB"
check_port 6379 "Redis"
check_port 5672 "RabbitMQ"
check_port 15672 "RabbitMQ Management"

echo ""
echo -e "${BLUE}8. Network Connectivity${NC}"
echo -n "  Internet Connection: "
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ No connection${NC}"
    ((WARNINGS++))
fi

echo -n "  npm Registry: "
if curl -s https://registry.npmjs.org/ &> /dev/null; then
    echo -e "${GREEN}✓ Reachable${NC}"
else
    echo -e "${RED}✗ Unreachable${NC}"
    ((WARNINGS++))
fi

echo ""
echo "======================================"
echo -e "${BLUE}Summary:${NC}"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
fi
echo ""

if [ $WARNINGS -gt 0 ] || [ $ERRORS -gt 0 ]; then
    echo -e "${YELLOW}💡 Recommendations:${NC}"
    
    if ! docker info &> /dev/null; then
        echo "  • Start Docker: sudo systemctl start docker"
    fi
    
    if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "eaa-postgres"; then
        echo "  • Start infrastructure: ./scripts/start-infra.sh"
    fi
    
    if [ ! -d "/home/nduasheym/EAA/tuk-tuk-system/frontend/node_modules" ]; then
        echo "  • Install frontend deps: cd frontend && npm install --legacy-peer-deps"
    fi
    
    if [ ! -d "/home/nduasheym/EAA/tuk-tuk-system/services/api-gateway/node_modules" ]; then
        echo "  • Install API Gateway deps: cd services/api-gateway && npm install"
    fi
fi

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  View logs:     ./scripts/logs.sh [service-name]"
echo "  Start dev:     ./scripts/dev-no-docker.sh"
echo "  Restart:       ./scripts/restart.sh [service-name]"
echo "  Full status:   ./scripts/check.sh"
