# 🏗️ VideoHub Architecture Documentation

> **System Architecture and Design Decisions**  
> Version 1.0.0 | Last Updated: December 2024

This document provides a comprehensive overview of VideoHub's architecture, design patterns, data flows, and technical decisions.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Technology Stack](#technology-stack)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Real-Time Communication](#real-time-communication)
8. [Security Architecture](#security-architecture)
9. [Design Decisions](#design-decisions)
10. [Scalability Considerations](#scalability-considerations)

---

## System Overview

VideoHub is a **full-stack, production-ready video processing platform** built with modern web technologies. The system follows a **client-server architecture** with clear separation between frontend, backend, and data layers.

### Core Capabilities

- **User Management**: JWT-based authentication with role-based access control
- **Video Processing**: Automated metadata extraction and thumbnail generation
- **Content Moderation**: Keyword-based sensitivity detection with admin oversight
- **Real-Time Updates**: WebSocket communication for live status updates
- **Secure Streaming**: Range-request video delivery with access control

---

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          React SPA (Single Page Application)               │ │
│  │                                                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Login   │  │Dashboard │  │  Upload  │  │   Watch  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │          State Management (React Query)              │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │     Services Layer (API, Socket, Auth)               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                         ▲                    ▲                   │
│                         │ HTTPS/WSS          │ HTTPS             │
│                         │                    │                   │
└─────────────────────────┼────────────────────┼───────────────────┘
                          │                    │
┌─────────────────────────┼────────────────────┼───────────────────┐
│                         │   SERVER LAYER     │                   │
├─────────────────────────┼────────────────────┼───────────────────┤
│                         │                    │                   │
│  ┌──────────────────────▼─┐            ┌─────▼────────────────┐ │
│  │   Socket.io Server     │            │   Express REST API   │ │
│  │  (Real-Time Updates)   │            │   (Business Logic)   │ │
│  └────────────┬───────────┘            └─────┬────────────────┘ │
│               │                              │                   │
│               │         ┌────────────────────┼──────────────┐    │
│               │         │    Middleware Stack              │    │
│               │         │  ┌────────────────────────────┐  │    │
│               │         │  │  Authentication (JWT)      │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  Authorization (RBAC)      │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  File Upload (Multer)      │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  Error Handling            │  │    │
│               │         │  └────────────────────────────┘  │    │
│               │         └─────────────────────────────────┘    │
│               │                              │                   │
│               │         ┌────────────────────┼──────────────┐    │
│               │         │  Controller Layer               │    │
│               │         │  ┌────────────────────────────┐  │    │
│               │         │  │  Auth Controller           │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  Video Controller          │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  Admin Controller          │  │    │
│               │         │  └────────────────────────────┘  │    │
│               │         └─────────────────────────────────┘    │
│               │                              │                   │
│               │         ┌────────────────────┼──────────────┐    │
│               │         │  Utility Layer                   │    │
│               │         │  ┌────────────────────────────┐  │    │
│               │         │  │  Video Processor (FFmpeg)  │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  Logger (Winston)          │  │    │
│               │         │  ├────────────────────────────┤  │    │
│               │         │  │  Sensitivity Analyzer      │  │    │
│               │         │  └────────────────────────────┘  │    │
│               │         └─────────────────────────────────┘    │
│               │                              │                   │
└───────────────┼──────────────────────────────┼───────────────────┘
                │                              │
┌───────────────┼──────────────────────────────┼───────────────────┐
│               │      DATA LAYER              │                   │
├───────────────┼──────────────────────────────┼───────────────────┤
│               │                              │                   │
│           ┌───▼───────────┐              ┌───▼───────────┐      │
│           │  File System  │              │   MongoDB     │      │
│           │  (Ephemeral)  │              │   (Atlas)     │      │
│           │               │              │               │      │
│           │  ┌─────────┐  │              │  ┌─────────┐  │      │
│           │  │ Videos  │  │              │  │  Users  │  │      │
│           │  └─────────┘  │              │  ├─────────┤  │      │
│           │  ┌─────────┐  │              │  │ Videos  │  │      │
│           │  │Thumbnail│  │              │  │ (Meta)  │  │      │
│           │  └─────────┘  │              │  └─────────┘  │      │
│           └───────────────┘              └───────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

```
React 18
├── Vite (Build Tool)
├── React Router v6 (Routing)
├── TanStack React Query (Server State)
├── Axios (HTTP Client)
├── Socket.io-client (WebSocket)
├── Lucide React (Icons)
└── Custom CSS (Styling)
```

**Rationale**:
- **React 18**: Industry standard, large ecosystem, concurrent features
- **Vite**: Fast HMR, optimized production builds, native ESM support
- **React Query**: Declarative data fetching, automatic caching, background refetching
- **Axios**: Promise-based HTTP client, request/response interceptors
- **Socket.io-client**: Reliable WebSocket with fallback mechanisms

### Backend Stack

```
Node.js 18+
└── Express.js 4.18
    ├── Mongoose 8.0 (ODM)
    ├── Socket.io 4.8 (WebSocket)
    ├── Multer 1.4 (File Upload)
    ├── FFmpeg via fluent-ffmpeg (Video Processing)
    ├── JWT (jsonwebtoken)
    ├── bcryptjs (Password Hashing)
    ├── Helmet (Security Headers)
    ├── CORS (Cross-Origin)
    ├── Morgan (HTTP Logging)
    └── express-rate-limit (Rate Limiting)
```

**Rationale**:
- **Express.js**: Minimalist, flexible, extensive middleware ecosystem
- **Mongoose**: Schema-based ODM, validation, middleware hooks, query helpers
- **Socket.io**: Bidirectional communication, auto-reconnection, namespace support
- **FFmpeg**: Industry-standard video processing, metadata extraction

---

## Data Flow Diagrams

### 1. Authentication Flow

```
┌──────────┐                    ┌──────────┐                   ┌──────────┐
│          │   1. POST /register│          │  2. Hash password │          │
│  Client  │───────────────────>│  Backend │──────────────────>│  bcrypt  │
│          │                    │          │                   │          │
│          │                    │          │<──────────────────│          │
│          │                    │          │  3. Hashed value  └──────────┘
│          │                    │          │
│          │                    │    │     │
│          │                    │    │ 4. Save user
│          │                    │    ▼     │
│          │                    │ ┌───────────┐
│          │                    │ │  MongoDB  │
│          │                    │ │   Users   │
│          │                    │ └───────────┘
│          │                    │          │
│          │   5. User created  │          │
│          │<───────────────────│          │
│          │   + JWT token      │          │
└──────────┘                    └──────────┘
     │
     │ 6. Store JWT in localStorage
     ▼
[Subsequent Requests]
     │
     │ 7. Attach JWT in Authorization header
     ▼
┌──────────┐                    ┌──────────┐
│          │   GET /api/videos  │          │
│  Client  │───────────────────>│  Backend │
│          │   Authorization:   │          │
│          │   Bearer <JWT>     │    │     │
│          │                    │    │ 8. Verify JWT
│          │                    │    ▼     │
│          │                    │ ┌────────────┐
│          │                    │ │jwt.verify()│
│          │                    │ └────────────┘
│          │                    │    │     │
│          │                    │    │ 9. Extract userId
│          │                    │    ▼     │
│          │                    │ ┌───────────┐
│          │                    │ │  MongoDB  │
│          │                    │ │   Find    │
│          │                    │ │   User    │
│          │                    │ └───────────┘
│          │   10. Protected    │          │
│          │<───────────────────│          │
│          │   resource         │          │
└──────────┘                    └──────────┘
```

### 2. Video Upload & Processing Flow

```
┌──────────┐                 ┌──────────┐                    ┌──────────┐
│  Client  │                 │  Backend │                    │  MongoDB │
│ (React)  │                 │(Express) │                    │  (Atlas) │
└────┬─────┘                 └────┬─────┘                    └────┬─────┘
     │                            │                               │
     │ 1. Select video file       │                               │
     │    (via <input>)           │                               │
     │                            │                               │
     │ 2. POST /api/videos/upload │                               │
     │    multipart/form-data      │                               │
     │───────────────────────────>│                               │
     │                            │                               │
     │                            │ 3. Multer parses file         │
     │                            │    Validation:                │
     │                            │    - File type (MP4, MOV...)  │
     │                            │    - Size (<500MB)            │
     │                            │                               │
     │                            │ 4. Save to disk               │
     │                            │    uploads/videos/            │
     │                            │    UUID_timestamp.mp4         │
     │                            │                               │
     │                            │ 5. Create video document      │
     │                            │    status: 'uploading'        │
     │                            │───────────────────────────────>│
     │                            │                               │
     │ 6. 202 Accepted            │<───────────────────────────────│
     │<───────────────────────────│                               │
     │    { videoId, status }     │                               │
     │                            │                               │
     │ 7. Socket.io connect       │                               │
     │───────────────────────────>│                               │
     │    Join room: user_<id>    │                               │
     │                            │                               │
     │                            │ 8. Background processing      │
     │                            │    async function             │
     │                            │                               │
     │                            │ 9. Update status:             │
     │                            │    'processing'               │
     │                            │───────────────────────────────>│
     │                            │                               │
     │                            │ 10. Emit via Socket.io        │
     │<───────────────────────────│    videoStatusUpdate          │
     │  status: 'processing'      │                               │
     │                            │                               │
     │                            │ 11. FFmpeg metadata           │
     │                            │    - Duration                 │
     │                            │    - Resolution               │
     │                            │    - Codec                    │
     │                            │                               │
     │                            │ 12. Generate thumbnail        │
     │                            │    ffmpeg screenshot          │
     │                            │    uploads/thumbnails/        │
     │                            │                               │
     │                            │ 13. Analyze sensitivity       │
     │                            │    - Keyword check            │
     │                            │    - 10% random (demo)        │
     │                            │                               │
     │                            │ 14. Update final status:      │
     │                            │    'completed'                │
     │                            │───────────────────────────────>│
     │                            │                               │
     │                            │ 15. Emit completion           │
     │<───────────────────────────│    videoStatusUpdate          │
     │  status: 'completed'       │                               │
     │  thumbnailPath: '...'      │                               │
     │  duration: 120             │                               │
     │                            │                               │
     │ 16. UI updates             │                               │
     │    automatically           │                               │
     │    (React Query refetch)   │                               │
     │                            │                               │
```

### 3. Video Streaming Flow

```
┌──────────┐              ┌──────────┐              ┌──────────┐
│  Browser │              │  Backend │              │Filesystem│
│ (Player) │              │ (Express)│              │          │
└────┬─────┘              └────┬─────┘              └────┬─────┘
     │                         │                         │
     │ 1. Click video          │                         │
     │    Navigate to          │                         │
     │    /watch/:id           │                         │
     │                         │                         │
     │ 2. Construct stream URL │                         │
     │    /api/videos/stream/:id?token=<JWT>            │
     │                         │                         │
     │ 3. <video> tag sends    │                         │
     │    GET request          │                         │
     │    with Range header    │                         │
     │────────────────────────>│                         │
     │    Range: bytes=0-      │                         │
     │                         │                         │
     │                         │ 4. Extract JWT from     │
     │                         │    query parameter      │
     │                         │                         │
     │                         │ 5. Verify JWT &         │
     │                         │    check ownership /    │
     │                         │    admin role           │
     │                         │                         │
     │                         │ 6. Check video status   │
     │                         │    (must be 'completed')│
     │                         │                         │
     │                         │ 7. Check sensitivity    │
     │                         │    (allow if safe or    │
     │                         │    admin)               │
     │                         │                         │
     │                         │ 8. Read file metadata   │
     │                         │────────────────────────>│
     │                         │                         │
     │                         │<────────────────────────│
     │                         │    fileSize, path       │
     │                         │                         │
     │                         │ 9. Parse Range header   │
     │                         │    start=0, end=fileSize│
     │                         │                         │
     │                         │ 10. Create read stream  │
     │                         │     with byte range     │
     │                         │────────────────────────>│
     │                         │                         │
     │ 11. 206 Partial Content │<────────────────────────│
     │<────────────────────────│    stream chunks        │
     │    Content-Range:       │                         │
     │    bytes 0-1024/102400  │                         │
     │                         │                         │
     │ 12. Browser plays       │                         │
     │     chunk               │                         │
     │                         │                         │
     │ [User seeks forward]    │                         │
     │                         │                         │
     │ 13. New request with    │                         │
     │     different range     │                         │
     │────────────────────────>│                         │
     │    Range: bytes=50000-  │                         │
     │                         │                         │
     │                         │ 14. Stream from offset  │
     │                         │────────────────────────>│
     │                         │                         │
     │<────────────────────────│<────────────────────────│
     │    206 Partial Content  │    new chunk            │
     │                         │                         │
```

---

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  username: "john_doe",                    // Unique, lowercase, 3-30 chars
  email: "john@example.com",               // Unique, validated
  password: "$2a$12$...",                  // Bcrypt hashed (12 rounds)
  role: "editor",                          // Enum: viewer, editor, admin
  organization: "Acme Corp",               // Optional, nullable
  isActive: true,                          // Soft delete flag
  lastLogin: ISODate("2024-12-26T10:30:00Z"),
  passwordChangedAt: null,                 // Track password resets
  createdAt: ISODate("2024-01-15T09:00:00Z"),
  updatedAt: ISODate("2024-12-26T10:30:00Z")
}
```

**Indexes**:
- `{ username: 1 }` - Unique, for login lookups
- `{ email: 1 }` - Unique, for registration validation
- `{ organization: 1, role: 1 }` - Compound, for tenant queries

### Videos Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  title: "Product Demo 2024",
  description: "Annual product demonstration...",
  filename: "abc123-1703597400-demo.mp4",  // UUID-timestamp-safe
  originalFilename: "My Video.mp4",        // User's original name
  filepath: "/app/uploads/videos/abc123-1703597400-demo.mp4",
  filesize: 52428800,                      // Bytes (50MB)
  duration: 180,                           // Seconds
  mimeType: "video/mp4",
  resolution: {
    width: 1920,
    height: 1080
  },
  bitrate: 2500000,                        // bps
  codec: "h264",
  uploadedBy: ObjectId("507f1f77bcf86cd799439011"), // Ref: User
  organization: "Acme Corp",
  status: "completed",                     // Enum: uploading, processing, completed, failed
  sensitivityStatus: "safe",               // Enum: pending, safe, flagged
  sensitivityDetails: {
    score: null,                           // Future: ML confidence score
    categories: [],                        // Future: Detected categories
    analyzedAt: null
  },
  processingProgress: 100,                 // 0-100
  processingError: null,                   // Error message if failed
  thumbnailPath: "uploads/thumbnails/thumb_abc123.png",
  thumbnails: [],                          // Future: Multiple thumbnails
  tags: ["demo", "product"],
  viewCount: 42,
  isPublic: false,                         // Public vs private
  isDeleted: false,                        // Soft delete
  deletedAt: null,
  createdAt: ISODate("2024-12-20T14:00:00Z"),
  updatedAt: ISODate("2024-12-26T10:30:00Z")
}
```

**Indexes**:
- `{ filename: 1 }` - Unique, for file deduplication
- `{ uploadedBy: 1, createdAt: -1 }` - User's videos (recent first)
- `{ organization: 1, status: 1 }` - Tenant filtering
- `{ status: 1, sensitivityStatus: 1 }` - Admin filtering
- `{ isDeleted: 1, isPublic: 1 }` - Visibility queries

---

## API Design

### RESTful Principles

The API follows REST conventions:

```
POST   /api/auth/register     - Create user (201 Created)
POST   /api/auth/login        - Authenticate (200 OK + JWT)
GET    /api/auth/profile      - Read current user (200 OK)
PUT    /api/auth/profile      - Update profile (200 OK)

GET    /api/videos            - List videos (200 OK)
POST   /api/videos/upload     - Upload video (202 Accepted)
GET    /api/videos/:id        - Get video metadata (200 OK)
PUT    /api/videos/:id        - Update metadata (200 OK)
DELETE /api/videos/:id        - Soft delete (204 No Content)
GET    /api/videos/stream/:id - Stream video (206 Partial Content)
```

### Response Format

All API responses follow this structure:

```javascript
// Success Response
{
  "success": true,
  "data": { /* payload */ },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### Error Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 202 | Accepted | Async operation started (upload) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate (email, username) |
| 413 | Payload Too Large | File exceeds MAX_FILE_SIZE |
| 500 | Internal Server Error | Unexpected server error |

---

## Real-Time Communication

### Socket.io Architecture

```
┌─────────────────────────────────────────────────────┐
│               Socket.io Server                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Namespace: / (default)                             │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          Connection Middleware                 │ │
│  │  - Authenticate via JWT (handshake query)      │ │
│  │  - Extract userId from token                   │ │
│  │  - Attach user object to socket                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │              Room Management                   │ │
│  │                                                │ │
│  │  User-specific rooms: `user_${userId}`         │ │
│  │  - User joins own room on connection           │ │
│  │  - Enables targeted updates                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │              Event Handlers                    │ │
│  │                                                │ │
│  │  Client Events:                                │ │
│  │  - 'disconnect' → Leave room, cleanup          │ │
│  │                                                │ │
│  │  Server Events:                                │ │
│  │  - 'videoStatusUpdate' → Processing progress   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Event Payloads

**videoStatusUpdate Event**:
```javascript
{
  videoId: "507f1f77bcf86cd799439012",
  status: "processing",              // uploading | processing | completed | failed
  progress: 75,                      // 0-100
  duration: 180,                     // Set when completed
  thumbnailPath: "uploads/thumbnails/thumb_abc123.png",
  error: null                        // Set when failed
}
```

---

## Security Architecture

### Multi-Layered Security

```
┌─────────────────────────────────────────────────────┐
│                   Security Layers                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: Transport (HTTPS/WSS)                     │
│  ├── Enforced by Render/Vercel                      │
│  └── TLS 1.2+ certificates                          │
│                                                     │
│  Layer 2: HTTP Headers (Helmet)                     │
│  ├── Content-Security-Policy                        │
│  ├── X-Frame-Options: DENY                          │
│  ├── X-Content-Type-Options: nosniff                │
│  ├── Strict-Transport-Security                      │
│  └── X-XSS-Protection                               │
│                                                     │
│  Layer 3: CORS                                      │
│  ├── Origin: whitelist (FRONTEND_URL)               │
│  ├── Credentials: true                              │
│  └── Methods: GET, POST, PUT, PATCH, DELETE         │
│                                                     │
│  Layer 4: Rate Limiting                             │
│  ├── Window: 15 minutes                             │
│  ├── Max requests: 100 per IP                       │
│  └── Applied to /api/* routes                       │
│                                                     │
│  Layer 5: Authentication (JWT)                      │
│  ├── Algorithm: HS256                               │
│  ├── Expiry: 7 days                                 │
│  ├── Secret: 64-char random hex                     │
│  └── Stored: localStorage (client)                  │
│                                                     │
│  Layer 6: Authorization (RBAC)                      │
│  ├── Roles: viewer, editor, admin                   │
│  ├── Middleware: restrictTo(['admin'])              │
│  └── Resource-level: ownership checks               │
│                                                     │
│  Layer 7: Input Validation                          │
│  ├── File type whitelist (video/*)                  │
│  ├── File size limit (500MB)                        │
│  ├── Schema validation (Mongoose)                   │
│  └── Sanitization (prevent NoSQL injection)         │
│                                                     │
│  Layer 8: Password Security                         │
│  ├── Hashing: bcrypt                                │
│  ├── Salt rounds: 12                                │
│  ├── Min length: 8 characters                       │
│  └── Never logged or exposed                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Design Decisions

### 1. JWT in Query Parameter for Video Streaming

**Decision**: Pass JWT token as query parameter for video streaming

**Rationale**:
- HTML5 `<video>` tag doesn't support custom headers
- Alternative (cookies) requires complex SameSite configuration
- Query parameter allows direct URL usage in video src

**Security Mitigation**:
- Short-lived tokens (7 days)
- HTTPS-only transmission
- Token validated on every request
- Logged access attempts

**Code Example**:
```javascript
// Frontend
const streamUrl = `/api/videos/stream/${videoId}?token=${jwt}`;
<video src={streamUrl} controls />

// Backend
const token = req.query.token;
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 2. Soft Delete for Videos

**Decision**: Set `isDeleted: true` instead of removing documents

**Rationale**:
- Enables data recovery (undo delete)
- Maintains referential integrity
- Allows audit trails and analytics
- Compliance with data retention policies

**Implementation**:
```javascript
// Soft delete
await video.updateOne({ isDeleted: true, deletedAt: new Date() });

// Always filter out deleted in queries
Video.find({ isDeleted: false });
```

### 3. Middleware-Based Authorization

**Decision**: Use Express middleware for RBAC instead of controller-level checks

**Rationale**:
- Separation of concerns (auth logic separate from business logic)
- Reusability across routes
- Declarative route protection
- Easy to audit and test

**Implementation**:
```javascript
// routes/videoRoutes.js
router.delete('/admin/:id',
  protect,                    // Authenticate
  restrictTo('admin'),        // Authorize
  deleteVideoAdmin            // Business logic
);
```

### 4. Socket.io for Real-Time Updates

**Decision**: Use WebSocket (Socket.io) instead of polling

**Rationale**:
- True real-time updates (no delay)
- Reduced server load (no repeated requests)
- Bidirectional communication
- Automatic reconnection handling

**Alternatives Considered**:
- **HTTP Polling**: Too many requests, wasteful
- **Server-Sent Events (SSE)**: Unidirectional only
- **WebSocket (native)**: Lacks fallback mechanisms

### 5. Multi-File Comment Convention

**Decision**: Use JSDoc for functions, block comments for sections, single-line for inline

**Format**:
```javascript
/**
 * File header
 * Description of module purpose
 */

/**
 * Function description
 * @param {string} videoId - Video unique identifier
 * @returns {Promise<Video>} - Video document
 */
function getVideo(videoId) {
  // Inline comment explaining non-obvious code
  const cached = cache.get(videoId);
  return cached || Video.findById(videoId);
}

// =====================================
// SECTION: Video Processing
// =====================================
```

**Rationale**:
- JSDoc enables IDE autocomplete and type hints
- Sections improve code navigation
- Inline comments explain "why", not "what"
- Self-documenting codebase

---

## Scalability Considerations

### Current Limitations

| Component | Limitation | Impact |
|-----------|------------|--------|
| File Storage | Ephemeral disk (Render free) | Videos lost on redeploy |
| Compute | Single instance (512MB RAM) | No horizontal scaling |
| Database | 512MB storage (Atlas free) | Limited data retention |
| Real-time | In-memory rooms | Lost on server restart |

### Scaling Path

```
Phase 1: Current (Free Tier)
├── Render Free (512MB)
├── Vercel Free (100GB bandwidth)
└── MongoDB Atlas M0 (512MB)

Phase 2: Paid Tier ($25/mo)
├── Render Standard (2GB RAM)
├── Persistent disk for videos
└── MongoDB Atlas M10 (2GB)

Phase 3: Cloud Storage ($50/mo)
├── AWS S3 / Cloudinary for videos
├── CDN for global delivery
└── Load balancer for multiple instances

Phase 4: Microservices ($200+/mo)
├── Separate video processing service
├── Message queue (RabbitMQ/SQS)
├── Redis for session/cache
└── Auto-scaling based on load
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│           Production Environment                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Frontend (Vercel)                              │
│  ├── Global CDN (Edge Network)                  │
│  ├── Automatic HTTPS                            │
│  ├── Serverless Functions (optional)            │
│  └── Environment: VITE_API_URL                  │
│                                                 │
│  Backend (Render)                               │
│  ├── Container (Docker-like)                    │
│  ├── Automatic HTTPS                            │
│  ├── Health checks (/api/health)                │
│  ├── Auto-deploy on git push                    │
│  └── Environment: 8 variables                   │
│                                                 │
│  Database (MongoDB Atlas)                       │
│  ├── 3-node replica set                         │
│  ├── Automatic backups (7-day retention)        │
│  ├── Global distribution                        │
│  └── IP whitelist: 0.0.0.0/0                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Performance Optimizations

### Frontend

- **Code Splitting**: React.lazy() for route-based splitting
- **Bundle Optimization**: Vite tree-shaking, minification
- **Image Optimization**: Lazy thumbnail loading
- **State Caching**: React Query caching with stale-while-revalidate
- **Prefetching**: Navigate to video page prefetches metadata

### Backend

- **Database Indexes**: Compound indexes on queries
- **Connection Pooling**: Mongoose default pool (5 connections)
- **Streaming**: Chunked video delivery (range requests)
- **Logging**: Log levels (production = warn, error only)
- **CPU**: GPU acceleration hints for CSS animations

---

## Monitoring Points

### Application Metrics

- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Video upload success rate
- Processing duration (avg, max)

### Infrastructure Metrics

- CPU utilization
- Memory usage
- Disk I/O
- Network throughput
- Database connections

### Business Metrics

- Active users (DAU, MAU)
- Videos uploaded (per day)
- Storage consumed
- Bandwidth used
- User retention rate

---

**Document Version**: 1.0.0  
**Last Updated**: December 26, 2024  
**Maintained By**: Shivam Verma  
**Related Docs**: [README.md](README.md), [DEPLOYMENT.md](DEPLOYMENT.md)
