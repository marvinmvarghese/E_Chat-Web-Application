#!/bin/bash

# Startup script for Render deployment
echo "🚀 Starting E-Chat Backend..."

# Run database migrations (create tables)
echo "📊 Creating database tables..."
python -c "
from backend.database import engine, Base
from backend import models
import asyncio

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('✅ Database tables created')

asyncio.run(init_db())
"

# Start the server
echo "🌐 Starting uvicorn server..."
exec uvicorn backend.main:socket_app --host 0.0.0.0 --port ${PORT:-10000}
