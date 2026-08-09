#!/bin/bash

# EAA Tuk-Tuk System - Start Frontend and Open in Browser
# This script starts the React frontend and opens it in the default browser

set -e

echo "🚀 Starting EAA Tuk-Tuk Frontend..."
echo "===================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_DIR="/home/nduasheym/EAA/tuk-tuk-system/frontend"
FRONTEND_URL="http://localhost:3100"

# Check if in correct directory
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo -e "${RED}❌ Frontend directory not found${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing...${NC}"
    npm install --legacy-peer-deps
fi

echo ""
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules/react" ]; then
    echo -e "${RED}❌ Dependencies incomplete. Reinstalling...${NC}"
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
fi

echo ""
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""
echo -e "${BLUE}Starting development server...${NC}"
echo "  URL: ${FRONTEND_URL}"
echo "  Press Ctrl+C to stop"
echo ""

# Function to open browser
open_browser() {
    sleep 5
    echo ""
    echo -e "${GREEN}🌐 Opening browser...${NC}"
    
    # Try different browser commands
    if command -v xdg-open &> /dev/null; then
        xdg-open "$FRONTEND_URL" &> /dev/null &
    elif command -v gnome-open &> /dev/null; then
        gnome-open "$FRONTEND_URL" &> /dev/null &
    elif command -v firefox &> /dev/null; then
        firefox "$FRONTEND_URL" &> /dev/null &
    elif command -v google-chrome &> /dev/null; then
        google-chrome "$FRONTEND_URL" &> /dev/null &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser "$FRONTEND_URL" &> /dev/null &
    else
        echo -e "${YELLOW}⚠️  Could not detect browser. Please open manually:${NC}"
        echo "  ${FRONTEND_URL}"
    fi
}

# Start browser opener in background
open_browser &

# Set the port explicitly
export PORT=3100
export BROWSER=none

# Start the development server
npm start
