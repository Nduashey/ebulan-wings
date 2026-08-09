#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/home/nduasheym/EAA/tuk-tuk-system"
PIDS_DIR="$PROJECT_ROOT/.pids"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}EAA Services Status${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# Function to check service status
check_service() {
    local service_name=$1
    local port=$2
    local pid_file="$PIDS_DIR/${service_name}.pid"
    
    printf "%-15s " "$service_name:"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}RUNNING${NC} (PID: $pid, Port: $port)"
            
            # Check if port is listening
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                echo -e "                ${GREEN}✓${NC} Port $port is listening"
            elif ss -tuln 2>/dev/null | grep -q ":$port "; then
                echo -e "                ${GREEN}✓${NC} Port $port is listening"
            else
                echo -e "                ${YELLOW}⚠${NC} Port $port not listening yet"
            fi
        else
            echo -e "${RED}STOPPED${NC} (stale PID file)"
        fi
    else
        echo -e "${RED}STOPPED${NC}"
    fi
}

# Check all services
check_service "auth-service" "3001"
check_service "api-gateway" "3000"
check_service "frontend" "3100"

echo -e "\n${BLUE}Infrastructure Services:${NC}"
if sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -q "eaa-"; then
    sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "eaa-"
else
    echo -e "${YELLOW}No infrastructure services running${NC}"
    echo -e "${YELLOW}Start with: sudo docker-compose up -d${NC}"
fi

echo -e "\n${BLUE}=========================================${NC}"
echo -e "Commands:"
echo -e "  Start:  ${GREEN}./scripts/start-services.sh${NC}"
echo -e "  Stop:   ${YELLOW}./scripts/stop-services.sh${NC}"
echo -e "  Logs:   ${BLUE}./scripts/logs.sh [service-name]${NC}"
echo -e "${BLUE}=========================================${NC}"
