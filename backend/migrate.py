"""
Database migration script for E-Chat
Creates all database tables from SQLAlchemy models
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
from backend.models import User, Message, Contact, Group, GroupMember

async def init_db():
    """Initialize database tables"""
    print("🔄 Starting database migration...")
    print(f"📊 Database URL: {engine.url}")
    
    try:
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Database tables created successfully!")
        print("📋 Tables: users, messages, contacts, groups, group_members")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

async def main():
    await init_db()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
