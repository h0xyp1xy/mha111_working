#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}Starting Mental Health App...${NC}\n"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${BLUE}Killing process on port $port (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    kill_port 8000
    kill_port 8080
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check and free ports
echo -e "${BLUE}Checking ports...${NC}"
kill_port 8000
kill_port 8080

# Start Backend
echo -e "${GREEN}Starting Backend (Django) on 127.0.0.1:8000...${NC}"
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
python manage.py runserver 127.0.0.1:8000 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait a bit for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Failed to start backend server${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Start Frontend
echo -e "${GREEN}Starting Frontend (Vite) on port 2011...${NC}"
cd "$SCRIPT_DIR/frontend"
source ../backend/venv/bin/activate
npm run dev &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}Failed to start frontend server${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}\n"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Both servers are running!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "Frontend: ${GREEN}http://localhost:2011${NC}"
echo -e "Backend API: ${GREEN}http://localhost:8000/api/${NC}"
echo -e "Admin Panel: ${GREEN}http://localhost:8000/admin/${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "\nPress Ctrl+C to stop both servers\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

