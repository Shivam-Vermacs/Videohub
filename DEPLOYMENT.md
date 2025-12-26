# 🚀 Complete Deployment Guide

A detailed step-by-step guide to deploy VideoHub to production.

---

## ❓ Do I Need Separate Repositories?

**NO!** You can use a **monorepo** (single repository with both frontend and backend).

Both **Render** and **Vercel** support specifying a "Root Directory", so they can deploy from subdirectories of the same repo.

```
Your Repository (Single Repo)
├── backend/     ← Render deploys from here
├── frontend/    ← Vercel deploys from here
├── README.md
└── DEPLOYMENT.md
```

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] GitHub account (create at [github.com](https://github.com))
- [ ] MongoDB Atlas account (create at [mongodb.com/atlas](https://mongodb.com/atlas))
- [ ] Render account (create at [render.com](https://render.com))
- [ ] Vercel account (create at [vercel.com](https://vercel.com))

---

# Part 1: GitHub Setup

## Step 1.1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `videohub` (or your preferred name)
   - **Description**: `Video Processing Platform`
   - **Visibility**: Public (required for free Render tier)
3. Click **Create repository**
4. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/videohub.git`)

## Step 1.2: Initialize Git & Push Code

Open your terminal in the project root folder:

```powershell
# Navigate to your project folder
cd "c:\kdrama\New folder\Vibe Coded Projects\Pulsegen.IO Assignment"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: VideoHub production ready"

# Connect to your GitHub repo (replace with YOUR URL)
git remote add origin https://github.com/YOUR_USERNAME/videohub.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 1.3: Verify on GitHub

1. Go to your repository on GitHub
2. Confirm you see both `backend/` and `frontend/` folders

---

# Part 2: MongoDB Atlas Setup

## Step 2.1: Create Free Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign up or log in
3. Click **Build a Database**
4. Select **FREE** tier (M0 Sandbox)
5. Choose a cloud provider (any)
6. Choose region closest to you
7. Click **Create Cluster** (takes 1-3 minutes)

## Step 2.2: Create Database User

1. In left sidebar, click **Database Access**
2. Click **Add New Database User**
3. Fill in:
   - **Username**: `videohub_admin` (or your choice)
   - **Password**: Click **Autogenerate Secure Password**
   - **⚠️ IMPORTANT**: Copy and save this password!
4. Set privileges: **Read and write to any database**
5. Click **Add User**

## Step 2.3: Configure Network Access

1. In left sidebar, click **Network Access**
2. Click **Add IP Address**
3. Click **ALLOW ACCESS FROM ANYWHERE** (adds `0.0.0.0/0`)
   - This is required for Render to connect
4. Click **Confirm**

## Step 2.4: Get Connection String

1. In left sidebar, click **Database** (under Deployment)
2. Click **Connect** button on your cluster
3. Select **Connect your application**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` with your database username
6. Replace `<password>` with the password you saved
7. Add database name before the `?`:
   ```
   mongodb+srv://videohub_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/video-platform?retryWrites=true&w=majority
   ```

**Save this connection string - you'll need it for Render!**

---

# Part 3: Backend Deployment (Render)

## Step 3.1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **Get Started for Free**
3. Sign up with **GitHub** (recommended for easy repo connection)

## Step 3.2: Create New Web Service

1. From Render Dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository:
   - Click **Connect GitHub**
   - Authorize Render
   - Select your `videohub` repository
3. Click **Connect**

## Step 3.3: Configure Build Settings

Fill in the configuration form:

| Field | Value |
|-------|-------|
| **Name** | `videohub-api` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

## Step 3.4: Add Environment Variables

Scroll down to **Environment Variables** section. Add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas connection string) |
| `JWT_SECRET` | (see below to generate) |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | `https://videohub.vercel.app` (temporary, update later) |
| `BACKEND_URL` | `https://videohub-api.onrender.com` (your Render URL) |
| `MAX_FILE_SIZE` | `524288000` |

### Generate JWT Secret

Run this in your terminal to get a secure secret:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste as `JWT_SECRET` value.

## Step 3.5: Deploy

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes on first deploy)
3. Look for "Deploy successful" message
4. Note your backend URL: `https://videohub-api.onrender.com`

## Step 3.6: Verify Backend

Open in browser:
```
https://videohub-api.onrender.com/api/health
```

You should see:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Server is running"
  }
}
```

---

# Part 4: Frontend Deployment (Vercel)

## Step 4.1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Sign up with **GitHub** (for easy repo connection)

## Step 4.2: Import Project

1. From Vercel Dashboard, click **Add New...** → **Project**
2. Find and select your `videohub` repository
3. Click **Import**

## Step 4.3: Configure Build Settings

| Field | Value |
|-------|-------|
| **Project Name** | `videohub` |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click **Edit** → type `frontend` → **Continue** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

## Step 4.4: Add Environment Variable

Expand **Environment Variables** section:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://videohub-api.onrender.com/api` |

⚠️ **Important**: Replace with YOUR actual Render backend URL!

## Step 4.5: Deploy

1. Click **Deploy**
2. Wait for deployment (1-2 minutes)
3. Note your frontend URL: `https://videohub.vercel.app`

---

# Part 5: Connect Frontend & Backend (CORS)

## Step 5.1: Update Backend CORS

Now that you have the actual Vercel URL:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your `videohub-api` service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` with your actual Vercel URL:
   ```
   FRONTEND_URL=https://videohub.vercel.app
   ```
   (Use YOUR actual Vercel domain, not this example)
5. Click **Save Changes**
6. Render will auto-redeploy

---

# Part 6: Test Everything

## Step 6.1: Test Registration

1. Open your Vercel frontend URL
2. Click **Register**
3. Create a new account
4. You should be redirected to Dashboard

## Step 6.2: Test Video Upload

1. Click **Upload Video**
2. Select a small video file (< 50MB for first test)
3. Enter title and description
4. Click Upload
5. Wait for processing

## Step 6.3: Test Video Playback

1. Go to **Videos** page
2. Click on your uploaded video
3. Video should play

---

# 🚨 Troubleshooting

## "Failed to fetch" or CORS Error

**Cause**: Frontend URL not whitelisted in backend

**Fix**:
1. Go to Render → Environment
2. Verify `FRONTEND_URL` matches your exact Vercel domain
3. Save and wait for redeploy

## Video Upload Fails

**Cause**: File size too large or wrong format

**Fix**:
- Check `MAX_FILE_SIZE` is set (524288000 = 500MB)
- Only MP4, MOV, WEBM, MKV are supported

## Backend Returns 503

**Cause**: Render free tier sleeps after 15 min inactivity

**Fix**:
- Wait 30-60 seconds for server to wake up
- This is normal for free tier

## Database Connection Failed

**Cause**: MongoDB Atlas network access or credentials

**Fix**:
1. Check Atlas → Network Access includes `0.0.0.0/0`
2. Verify username/password in connection string
3. Check database name is included (`/video-platform?`)

---

# ⚠️ Important Limitations

## Free Tier Limitations

| Service | Limitation |
|---------|------------|
| **Render** | Sleeps after 15 min inactivity |
| **Render** | Ephemeral disk (videos lost on redeploy) |
| **MongoDB Atlas** | 512MB storage limit |
| **Vercel** | 100GB bandwidth/month |

## Video Storage Warning

> **Uploaded videos are stored on Render's ephemeral filesystem.**
> They will be **LOST** when the service redeploys.
>
> For persistent storage, you would need:
> - Cloudinary for video hosting
> - AWS S3 for file storage
> - Render paid tier with persistent disk

---

# 📝 Quick Reference

## Your URLs (fill in after deployment)

| Service | URL |
|---------|-----|
| **GitHub Repo** | `https://github.com/___/___` |
| **MongoDB Atlas** | `mongodb+srv://___:___@___.mongodb.net/video-platform` |
| **Backend (Render)** | `https://___.onrender.com` |
| **Frontend (Vercel)** | `https://___.vercel.app` |

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-api.onrender.com
MAX_FILE_SIZE=524288000
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-api.onrender.com/api
```

---

**🎉 Congratulations! Your VideoHub is now live!**
