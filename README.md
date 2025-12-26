# 🎬 VideoHub - Video Processing Platform

A production-ready, full-stack video processing platform with real-time updates, content moderation, and secure streaming capabilities.

**Live Demo:** [https://videohub-rust.vercel.app](https://videohub-rust.vercel.app)  
**API Backend:** [https://videohub-ucxa.onrender.com/api](https://videohub-ucxa.onrender.com/api)

---

## 📺 Demo Video



Uploading DEMO OF THE APPLICATION.mp4…




---

## 🚀 Features

### Core Functionality (17 Features Implemented)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | **User Authentication** | ✅ | JWT-based signup/login with bcrypt password hashing |
| 2 | **Role-Based Access Control** | ✅ | Viewer, Editor, Admin roles with permission middleware |
| 3 | **Multi-Tenant Isolation** | ✅ | User-specific video management and organization support |
| 4 | **Video Upload System** | ✅ | Drag-and-drop with file validation and progress tracking |
| 5 | **Video Storage** | ✅ | Secure local storage with UUID-based naming |
| 6 | **Metadata Database** | ✅ | MongoDB storage for all video metadata |
| 7 | **Processing Pipeline** | ✅ | FFmpeg integration for metadata extraction and thumbnails |
| 8 | **Content Sensitivity Analysis** | ✅ | Keyword detection + 10% AI simulation for demo |
| 9 | **Real-Time Updates** | ✅ | Socket.io for live processing status updates |
| 10 | **Video Library** | ✅ | Grid view with filters, status badges, thumbnails |
| 11 | **Video Streaming** | ✅ | HTTP Range Request support for seek functionality |
| 12 | **Video Player** | ✅ | Custom player with controls and metadata display |
| 13 | **Access Control** | ✅ | JWT-protected streaming with owner/admin checks |
| 14 | **Admin Dashboard** | ✅ | User management, video moderation, role changes |
| 15 | **Error Handling** | ✅ | Comprehensive error middleware with logging |
| 16 | **Security** | ✅ | Helmet, CORS, rate limiting, input validation |
| 17 | **Frontend UI** | ✅ | React SPA with dark mode and responsive design |

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.io
- **Video Processing:** FFmpeg (fluent-ffmpeg)
- **Security:** Helmet, CORS, express-rate-limit

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **State Management:** TanStack React Query
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Real-time:** Socket.io-client
- **Icons:** Lucide React
- **Styling:** Custom CSS with CSS Variables

### Deployment
- **Backend Hosting:** Render.com
- **Frontend Hosting:** Vercel
- **Database:** MongoDB Atlas
- **Version Control:** Git + GitHub

---

## 📋 Development Workflow

### Phase 1: Project Foundation & Setup
- ✅ Initialized monorepo with `backend/` and `frontend/` structure
- ✅ Set up Express server with middleware (CORS, Helmet, Morgan)
- ✅ Configured MongoDB connection with retry logic
- ✅ Created React app with Vite and routing

### Phase 2: User Authentication System
- ✅ Built User model with role-based schema
- ✅ Implemented JWT token generation and verification
- ✅ Created `protect` and `restrictTo` middleware
- ✅ Built Login/Register pages with form validation

### Phase 3: Video Upload System
- ✅ Configured Multer for multipart/form-data handling
- ✅ Added file type and size validation
- ✅ Implemented upload progress tracking with Axios
- ✅ Created UploadVideo page with drag-and-drop

### Phase 4: Video Processing Pipeline
- ✅ Integrated FFmpeg for metadata extraction
- ✅ Built video processor utility with thumbnail generation
- ✅ Implemented status tracking (uploading → processing → completed)
- ✅ Added error handling for processing failures

### Phase 5: Real-Time Updates (Socket.io)
- ✅ Set up Socket.io server with JWT authentication
- ✅ Implemented user-specific rooms for targeted updates
- ✅ Built `socketService.js` for client connection management
- ✅ Added live progress updates during video processing

### Phase 6: Video Streaming System
- ✅ Implemented HTTP Range Request support (206 Partial Content)
- ✅ Built `streamVideo` controller with seek functionality
- ✅ Added JWT token validation via query parameter
- ✅ Created WatchVideo page with HTML5 video player

### Phase 7: Frontend Development
- ✅ Built responsive Layout with Sidebar navigation
- ✅ Implemented AuthContext and ThemeContext
- ✅ Created Dashboard with statistics and recent videos
- ✅ Designed VideoCard component with status badges
- ✅ Added dark/light mode toggle

### Phase 8: Content Sensitivity Analysis
- ✅ Implemented keyword-based detection (nsfw, violence, etc.)
- ✅ Added 10% random flagging to simulate AI moderation
- ✅ Built sensitivity status badges (safe/flagged)
- ✅ Restricted flagged content to admin-only access

### Phase 9: Admin Dashboard & RBAC
- ✅ Created AdminDashboard with user/video management
- ✅ Implemented role change functionality
- ✅ Added sensitivity status toggle for admins
- ✅ Built admin bypass for viewing all videos

### Phase 10: Security & Performance Hardening
- ✅ Enhanced Helmet CSP for blob: URLs and production domains
- ✅ Configured rate limiting (100 req/15min)
- ✅ Added database indexes for performance
- ✅ Implemented React.lazy() for code splitting
- ✅ Cleaned up debug console.logs to logger.debug

### Phase 11: Production Deployment
- ✅ Created comprehensive DEPLOYMENT.md guide
- ✅ Configured environment variables for production
- ✅ Deployed backend to Render.com
- ✅ Deployed frontend to Vercel
- ✅ Connected MongoDB Atlas cluster

---

## 🐛 Bugs Encountered & Fixes

### Bug 1: Button Text Disappearing on Hover
**Issue:** Primary button text became invisible on hover in light mode  
**Cause:** Global `a:hover` CSS rule overriding button text color  
**Fix:** Added explicit `color: white` to `.btn-primary:hover` and `.btn-danger:hover`  
**File:** `frontend/src/index.css`

### Bug 2: Sidebar Toggle Button Spacing
**Issue:** Toggle button had incorrect padding causing visual misalignment  
**Fix:** Adjusted padding values and fixed collapsed state positioning  
**File:** `frontend/src/index.css` (sidebar styles)

### Bug 3: Empty State Card Padding
**Issue:** "No videos" card had insufficient bottom padding  
**Fix:** Increased padding from 56px to 80px for proper spacing  
**File:** `frontend/src/App.jsx` (inline styles)

### Bug 4: Admin Video Streaming Access
**Issue:** Admins couldn't view private videos uploaded by other users  
**Cause:** Missing admin bypass in authorization check  
**Fix:** Added `if (decoded.role === 'admin')` check before ownership validation  
**File:** `backend/src/controllers/videoController.js` (streamVideo function)

### Bug 5: MongoDB Credentials Leaked to GitHub
**Issue:** `.env` file with MongoDB credentials was committed to repository  
**Cause:** Missing root-level `.gitignore` file  
**Fix:**  
1. Created root `.gitignore` with `.env` exclusion
2. Removed `.env` from git tracking: `git rm --cached backend/.env`
3. Rotated MongoDB Atlas password
4. Deleted and recreated GitHub repository
**File:** `.gitignore` (root level)

### Bug 6: Helmet CSP Blocking Video Streaming
**Issue:** Content Security Policy blocking blob: URLs in production  
**Fix:** Updated Helmet configuration to allow `blob:` and `self` in `mediaSrc` directive  
**File:** `backend/src/server.js`

### Bug 7: CORS Errors After Deployment
**Issue:** Frontend couldn't connect to backend due to CORS restrictions  
**Cause:** `FRONTEND_URL` environment variable not updated with actual Vercel domain  
**Fix:** Updated Render environment variable with correct Vercel URL  
**Platform:** Render Dashboard → Environment tab

### Bug 8: Excessive Debug Logging in Production
**Issue:** 40+ console.log statements in streamVideo causing log pollution  
**Fix:** Replaced all `console.log`/`console.error` with `logger.debug`/`logger.warn`  
**File:** `backend/src/controllers/videoController.js`

---

## 🎨 UI/UX Improvements

1. **Logout Confirmation Modal** - Replaced `alert()` with custom modal
2. **Button Hover Animation** - Changed from expanding ripple to lift + glow effect
3. **LoadingSpinner Component** - Added Suspense fallback for lazy-loaded pages
4. **Empty State Cards** - Improved spacing and visual hierarchy
5. **Sidebar Performance** - Added GPU acceleration with `will-change` and `transform`

---

## 📦 Project Structure

```
Videohub/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js        # Auth logic
│   │   │   └── videoController.js       # Video CRUD + streaming
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js        # JWT verification + RBAC
│   │   │   └── errorHandler.js          # Global error handling
│   │   ├── models/
│   │   │   ├── User.js                  # User schema (roles, auth)
│   │   │   └── Video.js                 # Video schema (metadata)
│   │   ├── routes/
│   │   │   ├── authRoutes.js            # /api/auth/*
│   │   │   └── videoRoutes.js           # /api/videos/*
│   │   ├── utils/
│   │   │   ├── apiResponse.js           # Response helpers
│   │   │   ├── fileUpload.js            # Multer config
│   │   │   ├── logger.js                # Winston logger
│   │   │   └── videoProcessor.js        # FFmpeg processing
│   │   └── server.js                    # Express + Socket.io
│   ├── uploads/                         # Video storage (gitignored)
│   ├── .env                             # Environment variables (gitignored)
│   ├── .env.example                     # Template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx               # Main layout wrapper
│   │   │   ├── ProtectedRoute.jsx       # Auth guard
│   │   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   │   └── VideoCard.jsx            # Video grid item
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Auth state management
│   │   │   └── ThemeContext.jsx         # Dark/light mode
│   │   ├── hooks/
│   │   │   ├── useAuth.js               # Auth context hook
│   │   │   └── useTheme.js              # Theme context hook
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx       # Admin panel
│   │   │   ├── Login.jsx                # Login page
│   │   │   ├── Register.jsx             # Signup page
│   │   │   ├── UploadVideo.jsx          # Upload interface
│   │   │   └── WatchVideo.jsx           # Video player
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance
│   │   │   ├── authService.js           # Auth API calls
│   │   │   ├── socketService.js         # Socket.io client
│   │   │   └── videoService.js          # Video API calls
│   │   ├── App.jsx                      # Root component + routing
│   │   ├── index.css                    # Global styles
│   │   └── main.jsx                     # Entry point
│   ├── .env                             # Environment variables (gitignored)
│   └── package.json
│
├── .gitignore                           # Git ignore rules
├── ARCHITECTURE.md                      # System architecture docs
├── DEPLOYMENT.md                        # Deployment guide
└── README.md                            # This file
```

---

## 🔐 Environment Variables

### Backend (`.env`)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...           # MongoDB Atlas connection string
JWT_SECRET=your-64-char-random-secret   # Generate with crypto.randomBytes(64)
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.onrender.com
MAX_FILE_SIZE=524288000                 # 500MB
```

### Frontend (`.env`)
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- FFmpeg (optional, for video processing)

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Videohub.git
cd Videohub

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

1. **Backend**: Copy `backend/.env.example` to `backend/.env` and fill in values
2. **Frontend**: Create `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Running Locally

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2: Start frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🌐 Deployment

Detailed deployment guide available in [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Summary

1. **MongoDB Atlas**: Create free cluster and get connection string
2. **Render (Backend)**:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Add environment variables
3. **Vercel (Frontend)**:
   - Root Directory: `frontend`
   - Framework: Vite
   - Add `VITE_API_URL` environment variable
4. **Update CORS**: Set `FRONTEND_URL` in Render to Vercel domain

---

## 🧪 Testing

### Manual Testing Checklist
- [x] User registration and login
- [x] Video upload with progress tracking
- [x] Real-time processing updates via Socket.io
- [x] Video playback with seek functionality
- [x] Content sensitivity flagging (keyword + random)
- [x] Admin dashboard access and moderation
- [x] Role-based permissions (viewer/editor/admin)
- [x] Dark/light mode toggle
- [x] Responsive design on mobile

---

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: Enum ['viewer', 'editor', 'admin'],
  organization: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Video Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  filename: String (unique),
  filepath: String,
  filesize: Number,
  duration: Number,
  uploadedBy: ObjectId (ref: User),
  organization: String,
  status: Enum ['uploading', 'processing', 'completed', 'failed'],
  sensitivityStatus: Enum ['pending', 'safe', 'flagged'],
  processingProgress: Number (0-100),
  thumbnailPath: String,
  isPublic: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/logout` - Logout

### Videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos` - Get user's videos
- `GET /api/videos/:id` - Get video details
- `PUT /api/videos/:id` - Update video metadata
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/stream/:id` - Stream video (with JWT in query)
- `GET /api/videos/stats` - Get user statistics

### Admin
- `GET /api/videos/admin/all` - Get all videos (admin)
- `PATCH /api/videos/admin/:id/sensitivity` - Toggle sensitivity status

---

## ⚠️ Known Limitations

1. **Ephemeral Storage**: Render free tier uses ephemeral disk - uploaded videos are lost on redeploy
2. **Cold Starts**: Backend sleeps after 15 min inactivity (30-60s wake time)
3. **File Size**: 500MB upload limit
4. **AI Simulation**: Content moderation is 10% random for demo (not real ML)

### Future Enhancements
- [ ] Cloudinary/S3 integration for persistent video storage
- [ ] Real ML content moderation (AWS Rekognition/Google Video Intelligence)
- [ ] Video transcoding to multiple resolutions
- [ ] CDN integration for faster streaming
- [ ] User notifications system
- [ ] Video comments and reactions

---

## 🤝 Contributing

This was a solo project developed as part of an assignment. No contributions are currently accepted.

---

## 📝 License

MIT License - feel free to use this project for learning purposes.

---

## 👨‍💻 Author

**Shivam Verma**
- GitHub: [@Shivam-Vermacs](https://github.com/Shivam-Vermacs)
- Project Link: [VideoHub](https://github.com/Shivam-Vermacs/Videohub)

---

## 🙏 Acknowledgments

- MongoDB Atlas for free database hosting
- Render.com for free backend hosting
- Vercel for free frontend hosting
- FFmpeg for video processing capabilities
- React and Vite communities for excellent documentation

---

## 📸 Screenshots

<!-- Add screenshots here after taking them -->
### Login Page
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Video Upload
![Upload](screenshots/upload.png)

### Video Player
![Player](screenshots/player.png)

### Admin Dashboard
![Admin](screenshots/admin.png)

---

**Built with ❤️ for learning and demonstration purposes**
