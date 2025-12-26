# 🚀 Production Deployment Guide

> **Production-grade deployment guide for VideoHub platform**  
> Last Updated: December 2024

This guide provides step-by-step instructions for deploying VideoHub to production using industry-standard practices and free-tier cloud services.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Verification & Testing](#verification-testing)
9. [Troubleshooting](#troubleshooting)
10. [Production Considerations](#production-considerations)

---

## Prerequisites

Before beginning deployment, ensure you have:

- **GitHub Account** - For repository hosting and CI/CD integration
- **MongoDB Atlas Account** - Cloud database service (free tier available)
- **Render Account** - Backend hosting platform (free tier available)
- **Vercel Account** - Frontend hosting platform (free tier available)
- **Git** - Version control system installed locally
- **Node.js 18+** - For local testing (optional)

### Required Knowledge
- Basic Git commands
- Understanding of environment variables
- Familiarity with REST APIs
- Basic cloud platform navigation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [User Browser]                                              │
│       │                                                      │
│       │ HTTPS                                                │
│       ▼                                                      │
│  ┌──────────────┐        HTTPS/WSS         ┌──────────────┐│
│  │   Vercel     │◄─────────────────────────►│    Render    ││
│  │  (Frontend)  │                           │  (Backend)   ││
│  │              │                           │              ││
│  │ React + Vite │                           │ Node.js +    ││
│  │              │                           │ Express +    ││
│  │              │                           │ Socket.io    ││
│  └──────────────┘                           └──────┬───────┘│
│                                                     │        │
│                                              MongoDB Atlas  │
│                                                     │        │
│                                              ┌──────▼───────┐│
│                                              │   Database   ││
│                                              │  (Cluster)   ││
│                                              └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Platform Choices

| Component | Platform | Reason |
|-----------|----------|--------|
| Frontend | Vercel | Optimized for React/Vite, instant deployments, global CDN |
| Backend | Render | Native Node.js support, Socket.io compatible, Git integration |
| Database | MongoDB Atlas | Managed service, free tier, global distribution |

---

## Database Setup (MongoDB Atlas)

### Step 1: Create Cluster

1. Navigate to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign up or log in to your account
3. Click **"Build a Database"**
4. Select **M0 (Free)** tier:
   - Storage: 512 MB
   - Shared RAM
   - Suitable for development and small production workloads

5. Configure cluster:
   - **Cloud Provider**: AWS/GCP/Azure (choose closest region)
   - **Region**: Select geographically closest to your users
   - **Cluster Name**: `videohub-cluster` (or custom name)

6. Click **"Create Cluster"** (provisioning takes 1-3 minutes)

### Step 2: Configure Database Access

1. In left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Configure user:
   ```
   Authentication Method: Password
   Username: videohub_admin
   Password: [Click "Autogenerate Secure Password"]
   ```
   
   ⚠️ **CRITICAL**: Copy and save the password immediately - it cannot be retrieved later

4. Set **Database User Privileges**: `Read and write to any database`
5. Click **"Add User"**

### Step 3: Configure Network Access

1. In left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to whitelist
   - Required for cloud platform deployments (Render, Vercel)
   - **Note**: In production, restrict to specific IPs if known

4. Click **"Confirm"**

### Step 4: Get Connection String

1. Click **"Databases"** in left sidebar
2. On your cluster, click **"Connect"**
3. Select **"Connect your application"**
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. Modify the connection string:
   - Replace `<username>` with: `videohub_admin`
   - Replace `<password>` with your saved password
   - Add database name before `?`: `/video-platform`
   
   **Final format**:
   ```
   mongodb+srv://videohub_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/video-platform?retryWrites=true&w=majority
   ```

6. Save this string securely - you'll need it for Render configuration

---

## Backend Deployment (Render)

### Step 1: Prepare Repository

Ensure your code is pushed to GitHub:

```bash
cd "path/to/Videohub"

# Verify .gitignore excludes .env files
cat .gitignore | grep .env

# Add and commit all changes
git add .
git commit -m "Production-ready codebase"
git push origin main
```

### Step 2: Create Render Service

1. Navigate to [Render Dashboard](https://dashboard.render.com)
2. Sign up with GitHub (recommended for seamless integration)
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect GitHub"** and authorize Render
5. Select your `Videohub` repository from the list
6. Click **"Connect"**

### Step 3: Configure Service Settings

Fill in the configuration form with these **exact** values:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `videohub-api` | Becomes part of your URL |
| **Region** | `Oregon (US West)` | Or closest to your users |
| **Branch** | `main` | Git branch to deploy |
| **Root Directory** | `backend` | ⚠️ Critical for monorepo |
| **Runtime** | `Node` | Auto-detected from package.json |
| **Build Command** | `npm install` | Installs dependencies |
| **Start Command** | `npm start` | Runs your server |
| **Instance Type** | `Free` | $0/month, 512MB RAM |

**⚠️ Common Mistake**: Forgetting to set `Root Directory` to `backend` - this will cause deployment failure

### Step 4: Configure Environment Variables

Scroll to **"Environment Variables"** section and add these key-value pairs:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Port number (required by Render) |
| `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
| `JWT_SECRET` | See below | Cryptographic secret for tokens |
| `JWT_EXPIRE` | `7d` | Token validity period |
| `FRONTEND_URL` | `https://videohub.vercel.app` | For CORS (update later) |
| `BACKEND_URL` | `https://videohub-api.onrender.com` | Your backend URL |
| `MAX_FILE_SIZE` | `524288000` | 500MB upload limit (in bytes) |

#### Generating JWT_SECRET

Run this command in your terminal to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output (128-character hex string) and use as `JWT_SECRET` value.

**Security Note**: Never reuse secrets across environments. Generate unique secrets for development, staging, and production.

### Step 5: Deploy

1. Review all settings carefully
2. Click **"Create Web Service"**
3. Deployment begins automatically (5-10 minutes first time)

Monitor the deployment logs:
- ✅ Green checkmarks indicate successful steps
- ❌ Red errors should be investigated immediately

### Step 6: Note Your Backend URL

After successful deployment, Render provides your backend URL:

```
https://videohub-api.onrender.com
```

**Save this URL** - you'll need it for frontend configuration.

---

## Frontend Deployment (Vercel)

### Step 1: Import Project

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Sign up with GitHub (recommended)
3. Click **"Add New..."** → **"Project"**
4. Find and select your `Videohub` repository
5. Click **"Import"**

### Step 2: Configure Build Settings

| Field | Value | Notes |
|-------|-------|-------|
| **Project Name** | `videohub` | Becomes part of URL |
| **Framework Preset** | `Vite` | Auto-detected from package.json |
| **Root Directory** | `frontend` | Click Edit to set |
| **Build Command** | `npm run build` | Auto-detected |
| **Output Directory** | `dist` | Vite default output |
| **Install Command** | `npm install` | Auto-detected |

### Step 3: Configure Environment Variables

Click **"Environment Variables"** section:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_API_URL` | `https://videohub-api.onrender.com/api` | Your backend API URL |

⚠️ **Important**: Use your **actual** Render backend URL, not the example above.

**Note**: Vite environment variables must be prefixed with `VITE_` to be accessible in client-side code.

### Step 4: Deploy

1. Review settings
2. Click **"Deploy"**
3. Deployment completes in 1-2 minutes

### Step 5: Note Your Frontend URL

Vercel provides your frontend URL:

```
https://videohub-rust.vercel.app
```

(Actual URL will vary - Vercel auto-generates subdomain)

---

## Post-Deployment Configuration

### Critical: Update CORS Configuration

The backend needs to know the frontend's URL for CORS (Cross-Origin Resource Sharing).

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your `videohub-api` service
3. Navigate to **"Environment"** tab
4. Find the `FRONTEND_URL` variable
5. Update value to your **actual Vercel URL**:
   ```
   https://videohub-rust.vercel.app
   ```
6. Click **"Save Changes"**

Render will automatically redeploy (30-60 seconds).

**Why This Matters**: Without correct CORS configuration, the frontend cannot communicate with the backend, causing "Failed to fetch" errors.

---

## Environment Variables Reference

### Backend (.env on Render)

```bash
# Server Configuration
NODE_ENV=production                    # Environment mode
PORT=5000                              # Server port

# Database
MONGODB_URI=mongodb+srv://...          # MongoDB Atlas connection string

# Authentication
JWT_SECRET=<64-char-hex-string>        # Cryptographic secret
JWT_EXPIRE=7d                          # Token expiry (days)

# URLs
FRONTEND_URL=https://your-app.vercel.app    # Frontend domain
BACKEND_URL=https://your-api.onrender.com   # Backend domain

# File Upload
MAX_FILE_SIZE=524288000                # 500MB in bytes
```

### Frontend (.env on Vercel)

```bash
# API Configuration
VITE_API_URL=https://your-api.onrender.com/api
```

---

## Verification & Testing

### Backend Health Check

1. Open browser and navigate to:
   ```
   https://videohub-api.onrender.com/api/health
   ```

2. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "status": "ok",
       "message": "Server is running",
       "timestamp": "2024-12-26T10:30:00.000Z"
     }
   }
   ```

3. If you see this, backend is operational ✅

### Frontend Access

1. Navigate to your Vercel URL:
   ```
   https://videohub-rust.vercel.app
   ```

2. You should see the login page

### End-to-End Testing Checklist

- [ ] **Registration**: Create a new user account
- [ ] **Login**: Sign in with credentials
- [ ] **Dashboard**: View statistics and recent videos
- [ ] **Upload**: Upload a small test video (< 50MB)
- [ ] **Real-time Updates**: Observe processing status changes
- [ ] **Video Library**: See uploaded video in grid
- [ ] **Video Player**: Click and watch the video
- [ ] **Logout**: Sign out successfully

---

## Troubleshooting

### Issue: "Failed to fetch" or CORS Errors

**Symptoms**: Frontend cannot connect to backend, browser console shows CORS errors

**Root Cause**: `FRONTEND_URL` in Render doesn't match actual Vercel URL

**Solution**:
1. Verify exact Vercel URL (including https://)
2. Update `FRONTEND_URL` in Render environment variables
3. Wait for automatic redeploy
4. Clear browser cache and retry

### Issue: Database Connection Failed

**Symptoms**: Backend logs show "MongooseError: Connection failed"

**Possible Causes**:
1. Incorrect username/password in connection string
2. Network access not configured (0.0.0.0/0 missing)
3. Database name missing from connection string

**Solution**:
1. Verify MongoDB Atlas → Network Access includes `0.0.0.0/0`
2. Check connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/video-platform?...`
3. Ensure password doesn't contain special characters (URL encode if needed)

### Issue: Backend Returns 503 (Service Unavailable)

**Symptoms**: First request after inactivity takes 30-60 seconds

**Root Cause**: Render free tier sleeps after 15 minutes of inactivity

**Solution**: This is expected behavior on free tier. Consider:
- Upgrading to paid tier for always-on service
- Using a ping service to keep backend awake
- Warning users about initial delay

### Issue: Video Upload Fails

**Symptoms**: Upload progress bar stops, error message displayed

**Possible Causes**:
1. File exceeds `MAX_FILE_SIZE` (500MB)
2. Unsupported video format
3. Network timeout

**Solution**:
1. Verify file size < 500MB
2. Use supported formats: MP4, MOV, WEBM, MKV, AVI
3. Check Render logs for specific error messages

### Issue: Videos Lost After Redeploy

**Symptoms**: Previously uploaded videos disappear

**Root Cause**: Render free tier uses ephemeral filesystem

**Solution**: This is a known limitation. For persistent storage:
- Upgrade to Render paid tier with persistent disk
- Integrate cloud storage (Cloudinary, AWS S3)
- Document this limitation for users

---

## Production Considerations

### Scalability

**Current Limitations**:
- Free tier: 512MB RAM, single instance
- No horizontal scaling
- Cold starts after inactivity

**Scaling Path**:
1. Upgrade to Render Starter ($7/mo) for better performance
2. Implement Redis for session management (distributed state)
3. Use AWS S3/Cloudinary for video storage (persistent, CDN)
4. Add load balancer for multiple backend instances

### Security Enhancements

**Implemented**:
- ✅ JWT authentication
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation

**Recommended Additions**:
- [ ] HTTPS enforcement (handled by Render/Vercel)
- [ ] Content Security Policy tuning
- [ ] DDoS protection (Cloudflare)
- [ ] Secrets management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Security headers audit (securityheaders.com)

### Monitoring & Logging

**Current State**:
- Basic logging with Winston
- Render provides deployment logs
- No application performance monitoring

**Recommended**:
- Integrate APM (New Relic, Datadog, Sentry)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure log aggregation (LogDNA, Papertrail)
- Create health check endpoints for monitoring

### Backup Strategy

**Database**:
- MongoDB Atlas provides automatic backups (7-day retention on free tier)
- Configure backup schedule in Atlas dashboard
- Test restore procedure periodically

**Code**:
- GitHub serves as version control and backup
- Tag releases: `git tag v1.0.0 && git push --tags`
- Maintain deployment changelog

### Cost Optimization

**Current Monthly Cost**: $0 (all free tiers)

**Cost Breakdown**:
| Service | Free Tier Limit | Overages |
|---------|----------------|----------|
| MongoDB Atlas | 512MB storage | Upgrade required |
| Render | 750 hours/mo | Service paused if exceeded |
| Vercel | 100GB bandwidth | $20/100GB overage |

**Optimization Tips**:
- Monitor MongoDB storage usage
- Implement video compression before upload
- Use aggressive caching strategies
- Offload static assets to CDN

---

## Deployment Checklist

Use this checklist before going live:

### Pre-Deployment
- [ ] All environment variables documented
- [ ] Secrets rotated (new JWT secret, MongoDB password)
- [ ] `.env` files in `.gitignore`
- [ ] Git repository clean (no secrets in history)
- [ ] Database indexes created
- [ ] Error handling tested

### Deployment
- [ ] MongoDB Atlas cluster created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Backend deployed to Render
- [ ] All backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend VITE_API_URL configured
- [ ] CORS updated with frontend URL

### Post-Deployment
- [ ] Health check endpoint returns 200
- [ ] User registration works
- [ ] Video upload works
- [ ] Video playback works
- [ ] Admin dashboard accessible
- [ ] Real-time updates functioning
- [ ] All 17 features tested

### Monitoring
- [ ] Uptime monitor configured
- [ ] Error tracking enabled
- [ ] Log aggregation set up
- [ ] Backup strategy documented

---

## Support & Resources

### Official Documentation
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)

### Community
- [Render Community](https://community.render.com)
- [Vercel Discussions](https://github.com/vercel/vercel/discussions)

### Project Specific
- Architecture Details: See `ARCHITECTURE.md`
- Development Setup: See `README.md`
- API Reference: See `README.md` → API Endpoints section

---

**Last Updated**: December 26, 2024  
**Version**: 1.0.0  
**Maintained By**: Shivam Verma
