# Using Vercel Postgres with Railway Backend

## Overview

Connect your existing Vercel Postgres database to your Railway-hosted FastAPI backend.

---

## Step 1: Get Vercel Postgres Connection String

### Option A: From Vercel Dashboard

1. Go to your Vercel project → "Storage" tab
2. Click on `echat_db` database
3. Click on ".env.local" or "Quickstart" tab
4. Copy the `POSTGRES_URL` value

### Option B: Using Vercel CLI

```bash
cd /Users/marvinmvarghese/E_Chat
vercel env pull .env.vercel
cat .env.vercel | grep POSTGRES_URL
```

You'll get something like:
```
POSTGRES_URL="postgres://default:abc123@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com:5432/verceldb"
```

---

## Step 2: Convert Connection String

Your backend uses `asyncpg`, so convert the URL:

**From Vercel:**
```
postgres://default:abc123@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

**For Railway (add `ql+asyncpg`):**
```
postgresql+asyncpg://default:abc123@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

---

## Step 3: Deploy Backend to Railway

### 3.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `E_Chat` repository

### 3.2 Configure Environment Variables

**IMPORTANT**: Do NOT add a PostgreSQL database in Railway. You're using Vercel's.

Click on your service → "Variables" tab and add:

```bash
# Database (from Vercel)
DATABASE_URL=postgresql+asyncpg://default:abc123@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com:5432/verceldb

# Security
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS (update after frontend deployment)
FRONTEND_URL=https://e-chat-web-application.vercel.app

# Server
HOST=0.0.0.0
PORT=8000
```

### 3.3 Deploy

Railway will automatically:
1. Detect your Python app
2. Install dependencies from `requirements.txt`
3. Run migrations via `start.sh`
4. Start your FastAPI server

---

## Step 4: Update Frontend Environment Variables

Once Railway backend is deployed:

1. Get your Railway URL (e.g., `https://e-chat-production.up.railway.app`)
2. Go to Vercel project → "Settings" → "Environment Variables"
3. Update:
   ```
   NEXT_PUBLIC_API_URL=https://e-chat-production.up.railway.app
   NEXT_PUBLIC_WS_URL=https://e-chat-production.up.railway.app
   ```
4. Redeploy frontend

---

## Step 5: Verify Database Connection

### Check Railway Logs

1. Go to Railway dashboard
2. Click on your service
3. Check "Deployments" tab → View logs
4. Look for:
   ```
   INFO sqlalchemy.engine.Engine BEGIN (implicit)
   INFO sqlalchemy.engine.Engine PRAGMA main.table_info("users")
   ```

If you see database connection errors, verify:
- Connection string format is correct (`postgresql+asyncpg://...`)
- Vercel Postgres allows external connections (it should by default)
- No typos in the connection string

---

## Architecture Diagram

```
┌─────────────────┐
│  Vercel         │
│  ┌───────────┐  │
│  │ Frontend  │  │ ← Next.js App
│  │ (Next.js) │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ Postgres  │  │ ← Database
│  │ Database  │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         │ Connection
         │
┌────────┼────────┐
│  Railway        │
│  ┌─────▼─────┐ │
│  │  Backend  │ │ ← FastAPI + Socket.IO
│  │ (FastAPI) │ │
│  └───────────┘ │
└─────────────────┘
```

---

## Cost Breakdown

| Service | Component | Free Tier |
|---------|-----------|-----------|
| Vercel | Frontend | Unlimited |
| Vercel | Postgres | 256 MB, 60 hrs compute/month |
| Railway | Backend | $5 credit/month (~$3-4 usage) |

**Total**: Free (within limits) ✅

---

## Troubleshooting

### Error: "Could not connect to database"

**Check:**
1. Connection string format: `postgresql+asyncpg://...`
2. Vercel Postgres is active (check Vercel dashboard)
3. No typos in connection string

### Error: "SSL connection required"

Add `?sslmode=require` to connection string:
```
postgresql+asyncpg://user:pass@host:5432/db?sslmode=require
```

### Error: "Too many connections"

Vercel Postgres free tier limits connections. In `backend/database.py`, reduce pool size:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,  # Reduce from default
    max_overflow=10
)
```

---

## Next Steps

1. ✅ Get Vercel Postgres connection string
2. ✅ Convert to asyncpg format
3. ✅ Deploy backend to Railway with Vercel DB URL
4. ✅ Update frontend environment variables
5. ✅ Test the application

**You're using the best of both platforms!** 🎉
