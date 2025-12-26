# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                   React + Vite (Port 5173)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Pages     │  │  Components  │  │      Services          │  │
│  │ - Login     │  │ - Layout     │  │ - api.js (Axios)       │  │
│  │ - Register  │  │ - Sidebar    │  │ - authService.js       │  │
│  │ - Dashboard │  │ - VideoCard  │  │ - videoService.js      │  │
│  │ - Upload    │  │              │  │ - socketService.js     │  │
│  │ - Watch     │  └──────────────┘  └────────────────────────┘  │
│  │ - Admin     │                                                 │
│  └─────────────┘                                                 │
│          │                               │                       │
│          ▼                               ▼                       │
│    REST API (HTTP)              WebSocket (Socket.io)            │
└─────────────────────────────────────────────────────────────────┘
                           │                    │
                           ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│               Node.js + Express (Port 5000)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Middleware                            │    │
│  │  - helmet (security headers)                             │    │
│  │  - cors (cross-origin)                                   │    │
│  │  - rate-limiter (DDoS protection)                        │    │
│  │  - authMiddleware (JWT verification)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Routes                              │    │
│  │  /api/auth/*      → authController                       │    │
│  │  /api/videos/*    → videoController                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Controllers                            │    │
│  │  - authController.js   (register, login, profile)        │    │
│  │  - videoController.js  (upload, stream, process)         │    │
│  └─────────────────────────────────────────────────────────┘    │
│          │               │                │                      │
│          ▼               ▼                ▼                      │
│     ┌────────┐    ┌───────────┐    ┌────────────┐               │
│     │ Models │    │  Utils    │    │  Socket.io │               │
│     │ - User │    │ - logger  │    │  (realtime)│               │
│     │ - Video│    │ - FFmpeg  │    └────────────┘               │
│     └────────┘    └───────────┘                                  │
│          │                                                       │
└──────────│───────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│                    MongoDB (Atlas/Local)                         │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │    users         │    │           videos                  │   │
│  │  - username      │    │  - title, description             │   │
│  │  - email         │    │  - filename, filepath             │   │
│  │  - password      │    │  - uploadedBy (ref: User)         │   │
│  │  - role          │    │  - status (processing/completed)  │   │
│  │  - organization  │    │  - sensitivityStatus (safe/flagged)│  │
│  └──────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Authentication Flow

```
User                Frontend                 Backend                 Database
 │                     │                        │                       │
 │  Enter credentials  │                        │                       │
 │────────────────────>│                        │                       │
 │                     │  POST /api/auth/login  │                       │
 │                     │───────────────────────>│                       │
 │                     │                        │  Find user by email   │
 │                     │                        │──────────────────────>│
 │                     │                        │<──────────────────────│
 │                     │                        │  Compare password     │
 │                     │                        │  (bcrypt)             │
 │                     │   JWT token + user     │                       │
 │                     │<───────────────────────│                       │
 │                     │  Store in localStorage │                       │
 │   Redirect to /     │                        │                       │
 │<────────────────────│                        │                       │
```

### 2. Video Upload & Processing Flow

```
User                Frontend                 Backend              Socket.io
 │                     │                        │                      │
 │  Select video file  │                        │                      │
 │────────────────────>│                        │                      │
 │                     │  POST /api/videos/upload│                     │
 │                     │  (multipart/form-data)  │                     │
 │                     │────────────────────────>│                     │
 │                     │                        │  Validate & save file│
 │                     │                        │  Create video doc    │
 │                     │   202 Accepted         │                      │
 │                     │<───────────────────────│                      │
 │                     │                        │  Background processing│
 │                     │                        │─────────────────────>│
 │                     │<──────────────────────────────────────────────│
 │                     │   videoStatusUpdate (10%)                     │
 │                     │<──────────────────────────────────────────────│
 │                     │   videoStatusUpdate (50%)                     │
 │                     │<──────────────────────────────────────────────│
 │                     │   videoStatusUpdate (100% + thumbnail)        │
 │   UI updates live   │                        │                      │
 │<────────────────────│                        │                      │
```

### 3. Video Streaming Flow

```
User                Frontend                 Backend              FileSystem
 │                     │                        │                      │
 │  Click play video   │                        │                      │
 │────────────────────>│                        │                      │
 │                     │  Construct stream URL  │                      │
 │                     │  + JWT token in query  │                      │
 │                     │                        │                      │
 │<────────────────────│ <video src="...?token=JWT">                   │
 │                     │                        │                      │
 │  Browser requests   │  GET /api/videos/stream/:id?token=JWT         │
 │  with Range header  │───────────────────────>│                      │
 │                     │                        │  Verify JWT          │
 │                     │                        │  Check ownership     │
 │                     │                        │  Read file chunk     │
 │                     │                        │─────────────────────>│
 │                     │                        │<─────────────────────│
 │                     │  206 Partial Content   │                      │
 │                     │  + video bytes         │                      │
 │<────────────────────│<───────────────────────│                      │
 │  Video plays        │                        │                      │
```

---

## Design Decisions

### 1. JWT in Query for Video Streaming
**Problem:** HTML5 `<video>` tag cannot send Authorization headers.
**Solution:** Pass JWT token as query parameter for `/stream/:id?token=JWT`.
**Trade-off:** Tokens in URLs may be logged; mitigated with short expiry.

### 2. Soft Delete for Videos
**Problem:** Data recovery requirements.
**Solution:** Videos marked `isDeleted: true` instead of actual deletion.
**Benefit:** Admin can recover accidentally deleted videos.

### 3. Role-Based Authorization
**Implementation:** Middleware-based with `restrictTo('admin')` pattern.
**Roles:** viewer (watch), editor (upload), admin (full access).

### 4. Real-time Updates via Socket.io
**Why:** Long-running video processing needs feedback.
**Implementation:** JWT auth on socket connection, user-specific rooms.

### 5. Multi-file Comment Convention
**Single-line:** Short inline explanations.
**Multi-line JSDoc:** Function/class documentation with @param/@returns.

---

## Security Measures

| Layer | Protection |
|-------|------------|
| Transport | HTTPS (production) |
| Headers | Helmet.js (XSS, CSRF, etc.) |
| Authentication | JWT with 7-day expiry |
| Password | bcrypt (12 rounds) |
| Rate Limiting | 100 req/15min per IP |
| CORS | Whitelist frontend origin |
| Input | Mongoose validation |
| Files | Type + size validation |

---

## Assumptions

1. **Single Server:** App designed for single-server deployment (not microservices).
2. **Local Storage:** Videos stored on local filesystem (can extend to S3).
3. **FFmpeg Optional:** Video processing gracefully degrades without FFmpeg.
4. **Browser Compatibility:** Modern browsers with WebSocket support.
5. **MongoDB Atlas:** Production database hosted externally.
