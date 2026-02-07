# E_Chat Deployment - Quick Reference

## 🚀 Railway (Recommended - Easiest)

### Setup (5 minutes)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Deploy from GitHub repo → Select E_Chat
3. Add PostgreSQL: New → Database → PostgreSQL
4. Set environment variables:
   ```
   SECRET_KEY=<random-32-char-string>
   FRONTEND_URL=https://your-frontend.vercel.app
   ACCESS_TOKEN_EXPIRE_MINUTES=43200
   ```
5. Deploy → Get your URL from Settings → Networking → Generate Domain

### Cost
- **FREE**: $5 credit/month (enough for small apps)

---

## ✈️ Fly.io (Developer-Friendly)

### Setup (10 minutes)
```bash
# Install CLI
brew install flyctl  # macOS
# or curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
cd /Users/marvinmvarghese/E_Chat
fly launch  # Use existing fly.toml, create PostgreSQL when prompted

# Set secrets
fly secrets set SECRET_KEY="your-secret-key"
fly secrets set FRONTEND_URL="https://your-frontend.vercel.app"

# Deploy
fly deploy
```

### Cost
- **FREE**: 3 shared-cpu VMs, 3GB storage

---

## 🔷 Koyeb (Simple)

### Setup (10 minutes)
1. Create free PostgreSQL at [neon.tech](https://neon.tech) → Copy connection string
2. Go to [koyeb.com](https://koyeb.com) → Sign up with GitHub
3. Create App → GitHub → Select E_Chat repo
4. Set environment variables:
   ```
   DATABASE_URL=postgresql+asyncpg://...  # From Neon
   SECRET_KEY=<random-32-char-string>
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Deploy → Get your URL

### Cost
- **FREE**: 1 web service, 2 instances
- **Database**: Neon free tier (0.5GB)

---

## 📝 After Backend Deployment

### Update Frontend
Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url
NEXT_PUBLIC_WS_URL=https://your-backend-url
```

Redeploy on Vercel.

### Update Backend CORS
Update `FRONTEND_URL` in backend environment variables with your actual Vercel URL.

---

## 🔑 Generate Secret Key

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32

# Online
# Use: https://generate-secret.vercel.app/32
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket not connecting | Check `FRONTEND_URL` matches your Vercel URL exactly |
| Database connection error | Verify `DATABASE_URL` format: `postgresql+asyncpg://...` |
| Build fails | Check Python version is 3.11+ |
| Health check fails | Verify `/health` endpoint is accessible |
| CORS errors | Update `FRONTEND_URL` and redeploy backend |

---

## 📚 Full Documentation

See [DEPLOYMENT.md](file:///Users/marvinmvarghese/E_Chat/DEPLOYMENT.md) for complete guides.

---

## ⚡ Quick Commands

### Railway
```bash
# View logs
railway logs

# Link to project
railway link
```

### Fly.io
```bash
# View logs
fly logs

# SSH into app
fly ssh console

# Check status
fly status
```

### Koyeb
- All management through web dashboard
- View logs in real-time

---

## 🎯 Recommended Path

1. **Start with Railway** (easiest, includes database)
2. If you need more control → **Fly.io**
3. If you have external database → **Koyeb**

**Total setup time: 5-15 minutes** ⚡
