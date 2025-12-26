# 🚀 Getting Started with VideoHub

> **Quick Start Guide for New Users and Contributors**

Welcome! This guide will help you get VideoHub running on your local machine in **under 10 minutes**.

---

## 📌 What is VideoHub?

VideoHub is a video processing platform that lets you:
- ✅ Upload videos (MP4, MOV, WEBM)
- ✅ Process videos automatically (thumbnails, metadata)
- ✅ Stream videos with seek support
- ✅ Moderate content (admin features)
- ✅ See real-time processing updates

**Live Demo:** [https://videohub-rust.vercel.app](https://videohub-rust.vercel.app)

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Shivam-Vermacs/Videohub.git
cd Videohub
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Set Up Environment Variables

**Backend** (`backend/.env`):
```bash
# Copy the example file
cp .env.example .env

# Edit with your values
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/videohub
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
MAX_FILE_SIZE=524288000
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB: https://www.mongodb.com/try/download/community
mongod
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `backend/.env`

### Step 5: Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# ✅ Backend runs on http://localhost:5000

# Terminal 2: Start frontend
cd frontend
npm run dev
# ✅ Frontend runs on http://localhost:5173
```

### Step 6: Open in Browser

Navigate to **http://localhost:5173**

---

## 🎯 First Time Usage

### 1. Create an Account

1. Click **"Register"**
2. Fill in:
   - Username: `admin`
   - Email: `admin@example.com`
   - Password: `password123`
3. Click **"Sign Up"**

### 2. Upload Your First Video

1. Click **"Upload Video"** in sidebar
2. Drag and drop a small video file (< 50MB recommended)
3. Enter title: "My First Video"
4. Click **"Upload"**
5. Watch the progress bar

### 3. View Your Video

1. Click **"Videos"** in sidebar
2. Click on your video thumbnail
3. Video starts playing!

---

## 📁 Project Structure

```
Videohub/
├── backend/           # Node.js + Express server
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Database schemas
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, validation
│   │   └── server.js      # Entry point
│   └── uploads/           # Video storage (local)
│
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/    # Reusable UI
│   │   ├── pages/         # App screens
│   │   ├── services/      # API calls
│   │   └── App.jsx        # Root component
│   └── dist/              # Build output
│
├── README.md          # Main documentation
├── DEPLOYMENT.md      # Production deployment
├── ARCHITECTURE.md    # Technical details
└── GETTING_STARTED.md # This file
```

---

## 🔧 Common Setup Issues

### Issue: "Cannot connect to MongoDB"

**Solution**:
```bash
# Check if MongoDB is running
mongo --version

# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/videohub
```

### Issue: "Port 5000 already in use"

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=5001
```

### Issue: "CORS error in browser"

**Solution**:
Make sure `FRONTEND_URL` in `backend/.env` matches your frontend URL:
```bash
FRONTEND_URL=http://localhost:5173
```

### Issue: "FFmpeg not found"

**Solution**:
Video processing requires FFmpeg (optional for basic usage):

```bash
# Windows (with Chocolatey)
choco install ffmpeg

# Mac
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

---

## 🎨 User Roles

VideoHub has 3 user roles:

| Role | Can Do |
|------|--------|
| **Viewer** | Watch own videos |
| **Editor** | Upload and manage own videos |
| **Admin** | View all videos, moderate content, manage users |

**Default role**: Editor (can upload videos)

**To become admin**: Manually update in MongoDB:
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 📚 Learn More

### Documentation

- **README.md** - Project overview, features, tech stack
- **DEPLOYMENT.md** - Deploy to production (Render + Vercel)
- **ARCHITECTURE.md** - System design, data flows, decisions

### API Documentation

Once running, test the API:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Code Examples

**Frontend: Upload a video**
```javascript
import { uploadVideo } from './services/videoService';

const file = document.querySelector('input[type="file"]').files[0];
const response = await uploadVideo(file, {
  title: "My Video",
  description: "Test upload"
}, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

**Backend: Stream a video**
```javascript
import express from 'express';
const app = express();

app.get('/api/videos/stream/:id', async (req, res) => {
  const video = await Video.findById(req.params.id);
  const stream = fs.createReadStream(video.filepath);
  stream.pipe(res);
});
```

---

## 🤝 Contributing

Want to improve VideoHub?

### Reporting Bugs

Found a bug? Open an issue:
1. Go to [Issues](https://github.com/Shivam-Vermacs/Videohub/issues)
2. Click "New Issue"
3. Describe the problem
4. Include error messages and screenshots

### Feature Requests

Have an idea? We'd love to hear it!
1. Open an issue with "Feature Request" label
2. Describe the feature
3. Explain why it's useful

### Pull Requests

Want to contribute code?
1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Video upload works
- [ ] Video appears in library
- [ ] Video plays without errors
- [ ] Logout works

### Running Tests

```bash
# Backend tests (if available)
cd backend
npm test

# Frontend tests (if available)
cd frontend
npm test
```

---

## 🔐 Security Note

⚠️ **Never commit `.env` files to Git!**

The `.gitignore` file excludes `.env` files, but always double-check:

```bash
# Check what will be committed
git status

# If .env appears, remove it
git rm --cached backend/.env
git rm --cached frontend/.env
```

---

## 📞 Need Help?

- **Documentation Issues**: Open an issue on GitHub
- **General Questions**: Check README.md first
- **Deployment Help**: See DEPLOYMENT.md
- **Technical Details**: See ARCHITECTURE.md

---

## 🎉 Success!

If you see the login page at http://localhost:5173, you're all set! 

**Next Steps**:
1. Create an account
2. Upload a test video
3. Explore the features
4. Read the full documentation
5. Consider deploying to production

---

**Happy Coding! 🚀**

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: Shivam Verma
