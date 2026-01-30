#!/bin/bash

# Inchagram Local Development Startup Script
# This script helps you start all services needed to run Inchagram locally

set -e

echo "🚀 Starting Inchagram Local Development Environment"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo -e "${RED}❌ MongoDB is not installed${NC}"
    echo ""
    echo "Please install MongoDB:"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community"
    echo ""
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB is not running. Starting it now...${NC}"

    # Try to start MongoDB with Homebrew
    if brew services start mongodb-community 2>/dev/null; then
        echo -e "${GREEN}✅ MongoDB started via Homebrew${NC}"
    else
        # Try to start manually
        echo "Starting MongoDB manually..."
        mongod --config /usr/local/etc/mongod.conf --fork
    fi

    # Wait for MongoDB to start
    echo "Waiting for MongoDB to be ready..."
    sleep 3
else
    echo -e "${GREEN}✅ MongoDB is already running${NC}"
fi

# Check .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env

    # Generate JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

    # Update JWT_SECRET in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    else
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    fi

    echo -e "${GREEN}✅ Created .env file with generated JWT_SECRET${NC}"
    echo -e "${YELLOW}⚠️  Note: AWS S3 credentials not configured. Photo uploads won't work.${NC}"
fi

# Check Node modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd client && npm install && cd ..
fi

echo ""
echo -e "${GREEN}✅ All prerequisites ready!${NC}"
echo ""
echo "=================================================="
echo "Starting services..."
echo "=================================================="
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:3000"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd client && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}🎉 Inchagram is running!${NC}"
echo ""
echo "Open your browser to: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
