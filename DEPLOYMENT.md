# E_Chat Deployment Guide

This guide covers deploying the E_Chat backend to free hosting platforms.

## Platform Comparison

| Feature | Railway | Fly.io | Koyeb |
|---------|---------|--------|-------|
| **Free Tier** | $5 credit/month | 3 shared-cpu VMs | 1 web service |
| **Database** | PostgreSQL included | PostgreSQL included | External DB needed |
| **WebSocket Support** | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Deployment** | Git push | CLI | Git push |
| **Region** | Multiple (Asia) | Multiple (Asia) | Multiple (Asia) |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation: Railway** - Easiest setup with included PostgreSQL database.

---

## Option 1: Railway (Recommended)

### Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))

### Step-by-Step Deployment

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Verify your email

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account if not already connected
   - Select your E_Chat repository

3. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically provision a PostgreSQL database
   - The `DATABASE_URL` environment variable will be automatically set

4. **Configure Environment Variables**
   - Click on your web service
   - Go to "Variables" tab
   - Add the following variables:
     ```
     SECRET_KEY=<generate-a-secure-random-string>
     ACCESS_TOKEN_EXPIRE_MINUTES=43200
     FRONTEND_URL=https://your-frontend-url.vercel.app
     HOST=0.0.0.0
     PORT=8000
     ```
   - `DATABASE_URL` is automatically set by Railway when you add PostgreSQL

5. **Deploy**
   - Railway will automatically detect your `railway.json` configuration
   - Click "Deploy" or push to your main branch
   - Railway will build and deploy your application
   - Monitor the build logs for any errors

6. **Get Your Backend URL**
   - Once deployed, click "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy your Railway domain (e.g., `e-chat-production.up.railway.app`)

7. **Update Frontend Configuration**
   - Update your frontend `.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
     NEXT_PUBLIC_WS_URL=https://your-app.up.railway.app
     ```
   - Redeploy your frontend on Vercel

8. **Update CORS Settings**
   - Go back to Railway environment variables
   - Update `FRONTEND_URL` with your actual Vercel URL
   - Redeploy the service

### Monitoring & Logs
- View logs in real-time from the Railway dashboard
- Monitor resource usage and credits
- Set up alerts for deployment failures

---

## Option 2: Fly.io

### Prerequisites
- Fly.io account (sign up at [fly.io](https://fly.io))
- Fly CLI installed

### Step-by-Step Deployment

1. **Install Fly CLI**
   ```bash
   # macOS
   brew install flyctl
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login to Fly.io**
   ```bash
   fly auth login
   ```

3. **Launch Your App**
   ```bash
   cd /Users/marvinmvarghese/E_Chat
   fly launch
   ```
   - When prompted, use the existing `fly.toml` configuration
   - Choose Singapore (sin) region for best performance in Asia
   - Say "Yes" to create a PostgreSQL database

4. **Set Environment Variables**
   ```bash
   fly secrets set SECRET_KEY="your-secret-key-here"
   fly secrets set FRONTEND_URL="https://your-frontend-url.vercel.app"
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Get Your Backend URL**
   ```bash
   fly status
   ```
   - Your app will be available at `https://e-chat.fly.dev`

7. **Update Frontend Configuration**
   - Update your frontend `.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=https://e-chat.fly.dev
     NEXT_PUBLIC_WS_URL=https://e-chat.fly.dev
     ```

### Useful Commands
```bash
# View logs
fly logs

# SSH into your app
fly ssh console

# Scale your app
fly scale count 1

# Check status
fly status

# Open app in browser
fly open
```

---

## Option 3: Koyeb

### Prerequisites
- Koyeb account (sign up at [koyeb.com](https://koyeb.com))
- External PostgreSQL database (e.g., from [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### Step-by-Step Deployment

1. **Create Koyeb Account**
   - Go to [koyeb.com](https://koyeb.com)
   - Sign up with GitHub

2. **Set Up External Database**
   
   **Option A: Neon (Recommended)**
   - Go to [neon.tech](https://neon.tech)
   - Create a free PostgreSQL database
   - Copy the connection string
   
   **Option B: Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get the connection string from Settings → Database

3. **Create New App on Koyeb**
   - Click "Create App"
   - Select "GitHub" as source
   - Connect your repository
   - Select your E_Chat repository

4. **Configure Deployment**
   - Koyeb will detect your `koyeb.yaml`
   - Set the following environment variables:
     ```
     DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
     SECRET_KEY=<generate-a-secure-random-string>
     FRONTEND_URL=https://your-frontend-url.vercel.app
     ```

5. **Deploy**
   - Click "Deploy"
   - Monitor the deployment logs

6. **Get Your Backend URL**
   - Once deployed, copy your Koyeb app URL
   - Format: `https://e-chat-backend-yourname.koyeb.app`

7. **Update Frontend Configuration**
   - Update your frontend `.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=https://your-app.koyeb.app
     NEXT_PUBLIC_WS_URL=https://your-app.koyeb.app
     ```

---

## Database Migration (If Migrating from Render)

If you have existing data on Render that you want to migrate:

### Export from Render
```bash
# Connect to Render database
pg_dump $RENDER_DATABASE_URL > echat_backup.sql
```

### Import to New Platform

**Railway:**
```bash
# Get Railway database URL from dashboard
psql $RAILWAY_DATABASE_URL < echat_backup.sql
```

**Fly.io:**
```bash
# Get Fly database URL
fly postgres connect -a your-postgres-app
# Then import
psql $FLY_DATABASE_URL < echat_backup.sql
```

**Koyeb (Neon/Supabase):**
```bash
psql $YOUR_DATABASE_URL < echat_backup.sql
```

---

## Troubleshooting

### WebSocket Connection Issues

**Problem:** WebSocket connections failing or disconnecting

**Solution:**
1. Ensure your platform supports WebSocket connections (all three do)
2. Check that `FRONTEND_URL` is correctly set in backend environment variables
3. Verify frontend is using `https://` for production URLs
4. Check CORS configuration

### Database Connection Errors

**Problem:** `could not connect to database`

**Solution:**
1. Verify `DATABASE_URL` is correctly formatted:
   - Railway: Automatically set
   - Fly.io: Automatically set when you create Postgres
   - Koyeb: Must be manually configured with external DB
2. Ensure database is running and accessible
3. Check database credentials are correct

### Build Failures

**Problem:** Deployment fails during build

**Solution:**
1. Check build logs for specific errors
2. Verify `requirements.txt` is up to date
3. Ensure Python version is compatible (3.11+)
4. Check that `start.sh` has correct permissions

### Health Check Failures

**Problem:** App deploys but health checks fail

**Solution:**
1. Verify `/health` endpoint is accessible
2. Check that app is binding to correct host and port
3. Increase health check timeout in configuration
4. Review application logs for startup errors

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT secret key (generate random string) | `your-secret-key-min-32-chars` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiration time | `43200` (30 days) |
| `FRONTEND_URL` | Your frontend URL for CORS | `https://your-app.vercel.app` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` (or platform default) |

---

## Cost Monitoring

### Railway
- Monitor usage in dashboard
- $5 free credit per month
- Set up billing alerts
- Typical usage: ~$3-4/month for small apps

### Fly.io
- 3 shared-cpu VMs free
- 3GB persistent volume storage free
- Monitor in dashboard
- Typical usage: Stays within free tier for small apps

### Koyeb
- 1 web service free
- 2 instances with 512MB RAM
- Monitor in dashboard
- Database costs separate (Neon/Supabase have free tiers)

---

## Next Steps

After successful deployment:

1. ✅ Test all endpoints (auth, chat, WebSocket)
2. ✅ Verify database connectivity
3. ✅ Test real-time messaging
4. ✅ Update frontend with new backend URL
5. ✅ Test end-to-end functionality
6. ✅ Set up monitoring and alerts
7. ✅ Configure custom domain (optional)

---

## Support

For platform-specific issues:
- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Fly.io:** [fly.io/docs](https://fly.io/docs)
- **Koyeb:** [koyeb.com/docs](https://koyeb.com/docs)

For E_Chat issues, check the main [README.md](file:///Users/marvinmvarghese/E_Chat/README.md)
