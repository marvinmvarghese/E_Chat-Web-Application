#!/bin/bash

# Function to kill child processes on exit
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "-----------------------------------"
echo "🚀 Starting E-Chat Development Environment"
echo "-----------------------------------"

# 0. Cleanup ports
echo "🧹 Cleaning up old processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
# Also kill the previous frontend running on 3002 if any
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# 1. Start Backend
echo "📦 Starting Backend (Port 8000)..."
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
fi

# Ensure dependencies are installed
echo "Checking/Installing dependencies..."
./venv/bin/pip install -r requirements.txt

# Run backend in background using venv uvicorn
./venv/bin/uvicorn backend.main:socket_app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Start Frontend
echo "🎨 Starting Frontend (Port 3000)..."
cd frontend
# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Run frontend
npm run dev &
FRONTEND_PID=$!

echo "-----------------------------------"
echo "✅ App is running!"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "-----------------------------------"
echo "Press Ctrl+C to stop everything."

# Wait for processes
wait
