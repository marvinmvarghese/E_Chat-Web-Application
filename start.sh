#!/bin/bash
set -e

# Startup script for Render deployment
echo "🚀 Starting E-Chat Backend..."

# Run database migrations (create tables)
echo "📊 Creating database tables..."
python -c "
from backend.database import engine, Base
from backend import models
import asyncio

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print('✅ Database tables created')
    except Exception as e:
        print(f'⚠️  Database migration warning: {e}')
        print('Continuing anyway - tables might already exist')

asyncio.run(init_db())
" || echo "⚠️  Migration failed, but continuing..."

# Start the server
echo "🌐 Starting uvicorn server..."
exec uvicorn backend.main:socket_app --host 0.0.0.0 --port ${PORT:-10000}
