"""
Database migration script for E-Chat
Creates all database tables and adds any missing columns (safe to re-run).
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
from backend.models import User, Message, Contact, Group, GroupMember, OTP, CallHistory
from sqlalchemy import text

# Columns to add if they don't exist yet.
# Format: (table, column, sql_type, default)
MISSING_COLUMNS = [
    ("messages", "file_url",   "VARCHAR",  None),
    ("messages", "file_type",  "VARCHAR",  None),
    ("messages", "file_name",  "VARCHAR",  None),
    ("messages", "file_size",  "INTEGER",  None),
    ("messages", "is_forwarded", "BOOLEAN", "FALSE"),
    ("messages", "edited",     "BOOLEAN",  "FALSE"),
    ("messages", "reactions",  "JSONB",    "'{}'::jsonb"),
    ("users",    "display_name",   "VARCHAR",  None),
    ("users",    "about",          "VARCHAR",  "'Hey there! I am using E-Chat'"),
    ("users",    "profile_photo_url", "VARCHAR", None),
    ("users",    "theme_preference",  "VARCHAR", "'dark'"),
    ("users",    "last_seen",     "TIMESTAMPTZ", "NOW()"),
]

# Tables that must be created (create_all handles them; listed here for clarity)
REQUIRED_TABLES = ["users", "messages", "contacts", "groups", "group_members", "otps", "call_history"]

async def init_db():
    """Initialize database tables and add missing columns."""
    print("🔄 Starting database migration...")
    db_url = str(engine.url)
    is_postgres = "postgresql" in db_url or "asyncpg" in db_url
    print(f"📊 Database: {'PostgreSQL' if is_postgres else 'SQLite'}")

    async with engine.begin() as conn:
        # 1. Create all tables (safe — only creates if not exists)
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables created / verified")

        # 2. Add missing columns (PostgreSQL only — SQLite auto-creates via model)
        if is_postgres:
            for table, col, col_type, default in MISSING_COLUMNS:
                default_clause = f"DEFAULT {default}" if default else ""
                sql = f"""
                    ALTER TABLE {table}
                    ADD COLUMN IF NOT EXISTS {col} {col_type} {default_clause};
                """
                try:
                    await conn.execute(text(sql))
                    print(f"  ✔ {table}.{col} ensured")
                except Exception as e:
                    print(f"  ⚠ {table}.{col}: {e}")

    print("✅ Migration complete!")

async def main():
    await init_db()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())

