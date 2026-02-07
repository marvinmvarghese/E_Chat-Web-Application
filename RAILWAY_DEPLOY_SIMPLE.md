# Railway Backend Deployment - Simple Guide

## 🚀 Deploy in 5 Minutes

I've prepared everything for you. Just follow these steps:

---

## Step 1: Open Railway

1. Go to: **https://railway.app**
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**
5. Select: **`E_Chat-Web-Application`**

---

## Step 2: Configure Environment Variables

After Railway creates your project:

1. Click on your service (should auto-detect as Python)
2. Click **"Variables"** tab
3. Click **"New Variable"** and add these **6 variables**:

### Copy-Paste These Values:

```bash
# 1. Database URL (you need to get this from Vercel)
DATABASE_URL=postgresql+asyncpg://YOUR_VERCEL_POSTGRES_URL_HERE

# 2. Secret Key (already generated for you)
SECRET_KEY=m8SnKpWCNcANhJsP8HaevgNALjj6ZEaYdnyGSRrGgVM

# 3. Token expiration
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# 4. Frontend URL (your Vercel URL)
FRONTEND_URL=https://e-chat-web-application.vercel.app

# 5. Server host
HOST=0.0.0.0

# 6. Server port
PORT=8000
```

---

## Step 3: Get Vercel Postgres URL

### How to get DATABASE_URL:

1. Open new tab: **https://vercel.com/dashboard**
2. Click on your project: **`e-chat-web-application`**
3. Click **"Storage"** tab
4. Click on **`echat_db`** database
5. Click **".env.local"** tab
6. Copy the **`POSTGRES_URL`** value

It looks like:
```
postgres://default:abc123xyz@ep-cool-name-123.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

### Convert it:

Change `postgres://` to `postgresql+asyncpg://`

**Example:**
```
FROM: postgres://default:abc123@ep-name.vercel-storage.com:5432/verceldb
TO:   postgresql+asyncpg://default:abc123@ep-name.vercel-storage.com:5432/verceldb
```

Paste this converted URL into Railway's `DATABASE_URL` variable.

---

## Step 4: Generate Domain

1. In Railway, click on your service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. **Copy your Railway URL** (e.g., `e-chat-production.up.railway.app`)

---

## Step 5: Update Vercel Frontend

1. Go back to Vercel dashboard
2. Click your project → **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_API_URL` and click **"Edit"**
4. Change to: `https://YOUR-RAILWAY-URL.up.railway.app`
5. Find `NEXT_PUBLIC_WS_URL` and click **"Edit"**
6. Change to: `https://YOUR-RAILWAY-URL.up.railway.app`
7. Click **"Save"**

### Redeploy Frontend:

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

---

## Step 6: Update Railway CORS

1. Go back to Railway
2. Click your service → **"Variables"**
3. Edit `FRONTEND_URL` if needed
4. Make sure it matches your Vercel URL exactly

---

## ✅ Done! Test Your App

1. Open your Vercel URL: `https://e-chat-web-application.vercel.app`
2. Click "Sign up"
3. Create an account
4. Try sending a message

---

## 🐛 Troubleshooting

### Railway deployment failed?

**Check logs:**
1. Railway dashboard → Your service
2. Click "Deployments" tab
3. Click on the deployment
4. Check error messages

**Common issues:**
- Missing environment variables → Add all 6 variables
- Wrong DATABASE_URL format → Must start with `postgresql+asyncpg://`

### Frontend can't connect to backend?

**Check:**
1. Railway service is running (green status)
2. Domain is generated
3. Vercel environment variables are updated
4. Frontend is redeployed after updating variables

### Database connection error?

**Check:**
1. Vercel Postgres is active
2. DATABASE_URL is correct
3. URL starts with `postgresql+asyncpg://` (not just `postgres://`)

---

## 📋 Quick Checklist

- [ ] Railway project created from GitHub
- [ ] All 6 environment variables added
- [ ] Vercel Postgres URL converted and added
- [ ] Railway domain generated
- [ ] Vercel frontend variables updated
- [ ] Frontend redeployed
- [ ] App tested and working

---

## 🎯 Summary

**What you deployed:**

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://e-chat-web-application.vercel.app |
| Backend | Railway | https://YOUR-APP.up.railway.app |
| Database | Vercel Postgres | Managed by Vercel |

**Total cost:** $0 (free tiers) ✅

---

## Need Help?

If you get stuck, check:
1. Railway logs for backend errors
2. Vercel deployment logs for frontend errors
3. Browser console for connection errors

**Most common fix:** Make sure all URLs match exactly (no trailing slashes, correct https://)
