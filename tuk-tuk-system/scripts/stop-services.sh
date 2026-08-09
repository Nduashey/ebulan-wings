#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="/home/nduasheym/EAA/tuk-tuk-system"
PIDS_DIR="$PROJECT_ROOT/.pids"

echo -e "${YELLOW}Stopping EAA Services...${NC}\n"

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="$PIDS_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}  Force stopping...${NC}"
                kill -9 "$pid"
            fi
            
            echo -e "${GREEN}✓ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}$service_name not running (stale PID file)${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}$service_name not running${NC}"
    fi
}

# Stop all services
stop_service "frontend"
stop_service "api-gateway"
stop_service "auth-service"

echo -e "\n${BLUE}Stopping Infrastructure Services...${NC}"
if sudo docker ps | grep -q "eaa-"; then
    cd /home/nduasheym/EAA/tuk-tuk-system
    sudo docker-compose down
    echo -e "${GREEN}✓ Infrastructure services stopped${NC}"
else
    echo -e "${YELLOW}Infrastructure services not running${NC}"
fi

echo -e "\n${GREEN}All services stopped${NC}"
