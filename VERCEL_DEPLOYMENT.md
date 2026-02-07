# Vercel Frontend Deployment Guide

## 🚀 Quick Deployment Steps

### Step 1: Configure Vercel Settings

On the Vercel "New Project" page you currently have open:

#### 1.1 Root Directory
- Click **"Edit"** next to "Root Directory"
- Change from `./` to: **`frontend`**
- This tells Vercel where your Next.js app is located

#### 1.2 Framework Preset
- Should auto-detect as **"Next.js"**
- If not, select it from the dropdown

#### 1.3 Build Settings (expand "Build and Output Settings")
- **Build Command**: `npm run build` ✅ (auto-detected)
- **Output Directory**: `.next` ✅ (auto-detected)
- **Install Command**: `npm install` ✅ (auto-detected)

#### 1.4 Environment Variables (expand "Environment Variables")
Add these two variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

> [!WARNING]
> These are temporary values. You'll update them after deploying your backend.

---

### Step 2: Deploy

Click the **"Deploy"** button at the bottom.

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your Next.js app
4. Deploy to a production URL

**Deployment time**: ~2-3 minutes

---

### Step 3: Deploy Backend

While frontend is deploying, deploy your backend to Railway (recommended):

#### Option A: Railway (Easiest)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `E_Chat` repository
4. Add PostgreSQL database (click "New" → "Database" → "PostgreSQL")
5. Set environment variables:
   ```
   SECRET_KEY=<generate-random-32-char-string>
   ACCESS_TOKEN_EXPIRE_MINUTES=43200
   FRONTEND_URL=<your-vercel-url-from-step-2>
   ```
6. Deploy!

**Get your backend URL** from Railway dashboard (e.g., `https://e-chat-production.up.railway.app`)

---

### Step 4: Update Frontend Environment Variables

Once backend is deployed:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Update the two variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_WS_URL=https://your-backend-url.railway.app
   ```
4. Click "Save"
5. Go to "Deployments" tab
6. Click "..." on latest deployment → "Redeploy"

---

### Step 5: Update Backend CORS

Update your backend's `FRONTEND_URL` environment variable:

1. Go to Railway dashboard
2. Click on your service → "Variables"
3. Update `FRONTEND_URL` to your Vercel URL (e.g., `https://e-chat.vercel.app`)
4. Redeploy

---

## ✅ Verification

After both deployments:

1. **Open your Vercel URL** (e.g., `https://e-chat.vercel.app`)
2. **Test signup**: Create a new account
3. **Test login**: Sign in with your account
4. **Test messaging**: Send a message
5. **Check WebSocket**: Verify real-time updates work

---

## 🐛 Troubleshooting

### Issue: "Failed to compile"
- **Cause**: Build errors in Next.js
- **Solution**: Check Vercel build logs for specific errors

### Issue: "API connection failed"
- **Cause**: Environment variables not set correctly
- **Solution**: Verify `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are set

### Issue: "CORS error"
- **Cause**: Backend `FRONTEND_URL` doesn't match Vercel URL
- **Solution**: Update backend environment variable and redeploy

### Issue: "WebSocket not connecting"
- **Cause**: WebSocket URL incorrect or backend not supporting WebSocket
- **Solution**: Verify `NEXT_PUBLIC_WS_URL` matches backend URL exactly

---

## 📝 Current Configuration

Based on your Vercel screenshot, here's what needs to be changed:

| Setting | Current | Should Be |
|---------|---------|-----------|
| Root Directory | `./` | `frontend` |
| Framework | FastAPI ❌ | Next.js ✅ |
| Environment Variables | Not set | Add 2 variables |

---

## 🎯 Next Steps

1. ✅ Update Root Directory to `frontend`
2. ✅ Add environment variables
3. ✅ Click "Deploy"
4. ⏳ Wait for deployment (~2-3 min)
5. ⏳ Deploy backend to Railway
6. ⏳ Update environment variables with real backend URL
7. ⏳ Test the application

---

## 📚 Additional Resources

- [Vercel Next.js Deployment Docs](https://vercel.com/docs/frameworks/nextjs)
- [Railway Deployment Guide](file:///Users/marvinmvarghese/E_Chat/DEPLOYMENT.md)
- [E_Chat Deployment Quick Reference](file:///Users/marvinmvarghese/E_Chat/DEPLOYMENT_QUICK.md)
