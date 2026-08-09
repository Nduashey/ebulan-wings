#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="/home/nduasheym/EAA/tuk-tuk-system"
PIDS_DIR="$PROJECT_ROOT/.pids"
LOGS_DIR="$PROJECT_ROOT/logs"

# Create directories
mkdir -p "$PIDS_DIR"
mkdir -p "$LOGS_DIR"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Starting EAA Services in Background${NC}"
echo -e "${BLUE}=========================================${NC}"

# Start infrastructure services first
echo -e "${BLUE}Starting Infrastructure Services...${NC}"
cd "$PROJECT_ROOT"
if sudo docker ps | grep -q "eaa-"; then
    echo -e "${YELLOW}Infrastructure services already running${NC}"
else
    sudo docker-compose up -d
    echo -e "${GREEN}✓ Infrastructure services started${NC}"
    sleep 3
fi

echo -e "\n${BLUE}Starting Application Services...${NC}"

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    local command=$4
    
    local pid_file="$PIDS_DIR/${service_name}.pid"
    local log_file="$LOGS_DIR/${service_name}.log"
    
    # Check if already running
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}$service_name is already running (PID: $pid)${NC}"
            return
        fi
    fi
    
    echo -e "${BLUE}Starting $service_name on port $port...${NC}"
    
    cd "$service_path"
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    # Wait a moment and check if it's still running
    sleep 2
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $service_name started (PID: $pid)${NC}"
        echo -e "  Log: $log_file"
    else
        echo -e "${RED}✗ $service_name failed to start${NC}"
        echo -e "  Check log: $log_file"
    fi
}

# Start Auth Service
start_service "auth-service" \
    "$PROJECT_ROOT/services/auth-service" \
    "3001" \
    "npm run dev"

# Start API Gateway
start_service "api-gateway" \
    "$PROJECT_ROOT/services/api-gateway" \
    "3000" \
    "npm run dev"

# Start Frontend
start_service "frontend" \
    "$PROJECT_ROOT/frontend" \
    "3100" \
    "npm start"

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${GREEN}Services Started!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "\nService URLs:"
echo -e "  Frontend:    ${GREEN}http://localhost:3100${NC}"
echo -e "  API Gateway: ${GREEN}http://localhost:3000${NC}"
echo -e "  Auth Service: ${GREEN}http://localhost:3001${NC}"
echo -e "\nManagement Commands:"
echo -e "  View logs:    ${YELLOW}./scripts/logs.sh [service-name]${NC}"
echo -e "  Stop services: ${YELLOW}./scripts/stop-services.sh${NC}"
echo -e "  Check status:  ${YELLOW}./scripts/status-services.sh${NC}"
echo -e "\nPID files: $PIDS_DIR"
echo -e "Log files: $LOGS_DIR"
