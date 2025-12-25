#!/bin/bash

# 1. Kill existing processes to avoid conflicts
echo "Stopping old processes..."
pkill -f "uvicorn" || true
pkill -f "ngrok" || true

# 2. Start Server in Background (nohup)
echo "Starting Server..."
nohup ./run_server.sh > server.log 2>&1 &
PID_SERVER=$!

# 3. Start Ngrok in Background (nohup)
echo "Starting Ngrok..."
nohup ngrok http 8000 > ngrok.log 2>&1 &
PID_NGROK=$!

echo "---------------------------------------------------"
echo "✅ SUCCESS: E_Chat is running in the background!"
echo "---------------------------------------------------"
echo "You can now SAFELEY CLOSE this terminal window."
echo "The app will stay online as long as your Mac is ON and AWAKE."
echo "---------------------------------------------------"
echo "Server PID: $PID_SERVER"
echo "Ngrok PID: $PID_NGROK"
echo "Logs: server.log, ngrok.log"
