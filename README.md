# 🎬 VideoHub - Video Processing Platform

A **production-ready**, multi-tenant video processing platform with real-time updates, content sensitivity analysis, and secure streaming capabilities.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **User Authentication** | JWT-based login/register with password hashing |
| **Role-Based Access Control** | Viewer, Editor, Admin roles with permission management |
| **Multi-Tenant Isolation** | User-specific video management |
| **Video Upload** | Drag-and-drop with progress tracking |
| **Real-time Updates** | Live WebSocket updates during processing |
| **Content Analysis** | Sensitivity detection (safe/flagged) |
| **Secure Streaming** | HTTP Range request streaming with JWT |
| **Admin Dashboard** | Video moderation, user management |
| **Responsive UI** | Modern React interface with dark mode |

---

## 📁 Project Structure

```
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Business logic
│   │   │   ├── authController.js
│   │   │   └── videoController.js
│   │   ├── middleware/        # Express middleware
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   └── Video.js
│   │   ├── routes/            # API route definitions
│   │   ├── utils/             # Helpers & utilities
│   │   └── server.js          # Entry point + Socket.io
│   ├── uploads/               # Video & thumbnail storage
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── VideoCard.jsx
│   │   ├── context/           # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── UploadVideo.jsx
│   │   │   ├── WatchVideo.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/          # API layer
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Entry point
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | JavaScript runtime |
| Express.js | Web framework |
| MongoDB | Database (Mongoose ODM) |
| JWT | Authentication tokens |
| Socket.io | Real-time updates |
| FFmpeg | Video processing |
| Helmet/CORS | Security |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router | Client routing |
| TanStack Query | Server state |
| Axios | HTTP client |
| Socket.io-client | Real-time |

---

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- FFmpeg (optional, for video processing)

### Installation

```bash
# 1. Clone/navigate to project
cd "Pulsegen.IO Assignment"

# 2. Install backend dependencies
cd backend && npm install

# 3. Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/video-platform
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=524288000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the App

```bash
# Terminal 1: Start backend
cd backend && npm run dev
# Server: http://localhost:5000

# Terminal 2: Start frontend
cd frontend && npm run dev
# App: http://localhost:5173
```

---

## 📋 API Reference

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Create account | Public |
| POST | `/api/auth/login` | Get JWT token | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/profile` | Get profile | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/password` | Change password | Private |

### Videos

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/videos/upload` | Upload video | Private |
| GET | `/api/videos` | List user videos | Private |
| GET | `/api/videos/:id` | Get video details | Private |
| PUT | `/api/videos/:id` | Update metadata | Owner/Admin |
| DELETE | `/api/videos/:id` | Delete video | Owner/Admin |
| GET | `/api/videos/stream/:id` | Stream video | Token in query |
| GET | `/api/videos/stats` | Get statistics | Private |

### Admin

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/videos/admin/all` | All videos | Admin |
| PATCH | `/api/videos/admin/:id/sensitivity` | Toggle flag | Admin |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api` | API info |

---

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **viewer** | Watch own videos |
| **editor** | Upload, manage own videos |
| **admin** | Full access, moderation, view all videos |

---

## 📡 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `videoStatusUpdate` | Server → Client | Processing progress updates |

**Payload:**
```javascript
{
  videoId: "...",
  status: "processing" | "completed" | "failed",
  progress: 0-100,
  message: "Processing...",
  thumbnailPath: "...",  // on completion
  sensitivityStatus: "safe" | "flagged"
}
```

---

## 🛡️ Content Sensitivity Analysis

The platform includes automated content moderation that flags potentially unsafe videos.

### How It Works

| Layer | Detection Method | Description |
|-------|------------------|-------------|
| **1. Keyword** | Instant | Scans title/description for unsafe keywords |
| **2. AI Simulation** | 10% rate | Demo mode - simulates ML detection |

### Unsafe Keywords (Automatic Flag)
`nsfw`, `explicit`, `violence`, `attack`, `kill`, `abuse`, `test-flag`

### Demo Mode Note
> ⚠️ **For demonstration purposes**, 10% of videos are randomly flagged to simulate AI content moderation. In production, this would be replaced with real ML services like AWS Rekognition, Google Video Intelligence, or Azure Content Moderator.

### Sensitivity Status
- **safe** - Content approved for all users
- **flagged** - Requires admin review, only admins can view

---

## ✅ Implemented Phases

- [x] **Phase 1**: Project Foundation & Setup
- [x] **Phase 2**: User Authentication (JWT)
- [x] **Phase 3**: Video Upload System
- [x] **Phase 4**: Video Processing Pipeline
- [x] **Phase 5**: Real-Time Updates (Socket.io)
- [x] **Phase 6**: Video Streaming (Range Requests)
- [x] **Phase 7**: Frontend Development
- [x] **Phase 8**: Content Sensitivity Analysis
- [x] **Phase 9**: Admin Dashboard & RBAC
- [x] **Phase 10**: Security & Performance Hardening

---

## 🎨 UI Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User authentication |
| Register | `/register` | Create account |
| Dashboard | `/` | Overview & stats |
| Upload | `/upload` | Upload videos |
| Videos | `/videos` | Video library |
| Watch | `/watch/:id` | Video player |
| Admin | `/admin` | Moderation panel |

---

## 📦 Scripts

### Backend
```bash
npm run dev      # Development with nodemon
npm start        # Production start
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
```

---

## 🔒 Security Features

- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ JWT authentication
- ✅ Protected API routes
- ✅ Role-based access control
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ File type validation
- ✅ Graceful error handling

---

## 📄 License

MIT License - see LICENSE file for details.
