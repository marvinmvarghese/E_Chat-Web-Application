#!/bin/bash

echo "🚀 Starting E-Chat Backend..."
echo "📊 Creating database tables..."

# Create tables
python -c "
from backend.database import engine, Base
from backend import models
import asyncio

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('✅ Database ready')

asyncio.run(init_db())
"

echo "🌐 Starting server..."
exec uvicorn backend.main:socket_app --host 0.0.0.0 --port ${PORT:-10000}

