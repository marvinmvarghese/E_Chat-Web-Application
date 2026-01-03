#!/bin/bash
echo "🚀 Starting E-Chat..."

# Start server immediately (database tables will be created on first request)
exec uvicorn backend.main:socket_app --host 0.0.0.0 --port ${PORT:-10000}
