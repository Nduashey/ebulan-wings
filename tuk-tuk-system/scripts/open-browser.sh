#!/bin/bash

# EAA Tuk-Tuk System - Open Frontend in Terminal Browser
# This script opens the frontend in a text-based browser (lynx/w3m/links)

FRONTEND_URL="http://localhost:3100"

echo "🌐 Opening Frontend in Terminal Browser..."
echo "=========================================="
echo ""

# Check if frontend is running
if ! curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "⚠️  Frontend is not running on $FRONTEND_URL"
    echo ""
    echo "Start it first with:"
    echo "  ./scripts/start-frontend.sh"
    echo ""
    exit 1
fi

# Try different terminal browsers
if command -v lynx &> /dev/null; then
    echo "Opening with lynx..."
    lynx "$FRONTEND_URL"
elif command -v w3m &> /dev/null; then
    echo "Opening with w3m..."
    w3m "$FRONTEND_URL"
elif command -v links &> /dev/null; then
    echo "Opening with links..."
    links "$FRONTEND_URL"
elif command -v links2 &> /dev/null; then
    echo "Opening with links2..."
    links2 "$FRONTEND_URL"
else
    echo "❌ No terminal browser found"
    echo ""
    echo "Install one with:"
    echo "  sudo apt install lynx      # Lightweight"
    echo "  sudo apt install w3m       # Advanced"
    echo "  sudo apt install links     # User-friendly"
    echo ""
    echo "Or open in regular browser:"
    echo "  $FRONTEND_URL"
fi
