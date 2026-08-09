#!/bin/bash

# EAA Tuk-Tuk System - Development Mode Script
# This script starts services in development mode (without Docker)

set -e

echo "🔧 Starting EAA Tuk-Tuk System in Development Mode..."
echo "====================================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Starting infrastructure services (Docker)...${NC}"
docker compose up -d postgres mongodb redis rabbitmq

echo ""
echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
sleep 5

echo ""
echo -e "${GREEN}✅ Infrastructure ready!${NC}"
echo ""
echo -e "${BLUE}Starting development servers...${NC}"
echo ""

# Check if tmux is installed
if command -v tmux &> /dev/null; then
    echo -e "${YELLOW}Using tmux for multiple terminals...${NC}"
    
    # Create new tmux session
    SESSION="eaa-dev"
    
    # Kill existing session if it exists
    tmux kill-session -t $SESSION 2>/dev/null || true
    
    # Start new session with frontend
    tmux new-session -d -s $SESSION -n "frontend" "cd frontend && npm run start"
    
    # Create new window for API Gateway
    tmux new-window -t $SESSION -n "api-gateway" "cd services/api-gateway && npm run dev"
    
    # Create new window for logs
    tmux new-window -t $SESSION -n "docker-logs" "docker compose logs -f postgres mongodb redis rabbitmq"
    
    # Select the first window
    tmux select-window -t $SESSION:0
    
    echo ""
    echo -e "${GREEN}✅ Development environment started in tmux!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tmux Commands:${NC}"
    echo "  Attach to session:   tmux attach -t $SESSION"
    echo "  Switch windows:      Ctrl+b then 0, 1, 2"
    echo "  Detach:              Ctrl+b then d"
    echo "  Kill session:        tmux kill-session -t $SESSION"
    echo ""
    echo -e "${BLUE}📋 Services:${NC}"
    echo "  Window 0: Frontend (http://localhost:3100)"
    echo "  Window 1: API Gateway (http://localhost:3000)"
    echo "  Window 2: Docker Logs"
    echo ""
    
    # Attach to the session
    tmux attach -t $SESSION
    
else
    echo -e "${YELLOW}⚠️  tmux not found. Starting services in background...${NC}"
    echo ""
    
    # Start frontend
    echo "Starting Frontend..."
    cd frontend
    npm run start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Start API Gateway
    echo "Starting API Gateway..."
    cd services/api-gateway
    npm run dev > ../../logs/api-gateway.log 2>&1 &
    GATEWAY_PID=$!
    cd ../..
    
    echo ""
    echo -e "${GREEN}✅ Services started in background!${NC}"
    echo ""
    echo -e "${BLUE}📋 Process IDs:${NC}"
    echo "  Frontend:    PID $FRONTEND_PID (log: logs/frontend.log)"
    echo "  API Gateway: PID $GATEWAY_PID (log: logs/api-gateway.log)"
    echo ""
    echo -e "${YELLOW}💡 To stop services:${NC}"
    echo "  kill $FRONTEND_PID $GATEWAY_PID"
    echo "  Or use: pkill -f 'npm run'"
    echo ""
    echo -e "${YELLOW}💡 View logs:${NC}"
    echo "  tail -f logs/frontend.log"
    echo "  tail -f logs/api-gateway.log"
fi

echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "  Frontend:    http://localhost:3100"
echo "  API Gateway: http://localhost:3000"
echo ""
echo -e "${YELLOW}To stop infrastructure:${NC}"
echo "  docker compose stop postgres mongodb redis rabbitmq"
