#!/bin/bash
echo "🚀 Starting E-Chat..."

# Run database migrations
echo "📊 Running database migrations..."
python backend/migrate.py

# Start server
echo "🌐 Starting server..."
exec uvicorn backend.main:socket_app --host 0.0.0.0 --port ${PORT:-10000}
