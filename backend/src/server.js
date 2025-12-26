/**
 * Express Server with Socket.io
 * ==============================
 * Main entry point for the video processing platform backend.
 * Includes real-time updates via Socket.io with JWT authentication.
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { successResponse, HttpStatus } from './utils/apiResponse.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Initialize Express application
 */
const app = express();

/**
 * Create HTTP Server (for Socket.io)
 */
const httpServer = createServer(app);

/**
 * ===========================================
 * SOCKET.IO INITIALIZATION
 * ===========================================
 */

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io globally accessible for controllers
global.io = io;

/**
 * Socket.io Authentication Middleware
 * Validates JWT token before allowing connection
 */
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    logger.warn('Socket connection without token');
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // IMPORTANT: JWT payload uses 'userId' not 'id'
    socket.userId = decoded.userId?.toString();
    socket.user = decoded;
    logger.info(`Socket auth successful for user: ${socket.userId}`);
    next();
  } catch (err) {
    logger.warn('Socket authentication failed:', err.message);
    return next(new Error('Invalid token'));
  }
});

/**
 * Socket.io Connection Handler
 */
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

  // Auto-join user's personal room for targeted updates
  if (socket.userId) {
    socket.join(socket.userId);
    logger.info(`User ${socket.userId} joined personal room`);
  }

  // Manual room join (fallback)
  socket.on('join', (userId) => {
    if (userId && userId === socket.userId) {
      socket.join(userId);
      logger.info(`User ${userId} manually joined room`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

/**
 * ===========================================
 * SECURITY MIDDLEWARE
 * ===========================================
 */

// Security headers with Content Security Policy
// CSP configured dynamically based on environment
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const wsUrl = backendUrl.replace('http', 'ws').replace('https', 'wss');

app.use(helmet({
  // Allow cross-origin resource loading for video streaming
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Configure CSP for blob: URLs (video streaming) and production domains
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", backendUrl],
      mediaSrc: ["'self'", "blob:", backendUrl],
      connectSrc: ["'self'", wsUrl, backendUrl, frontendUrl],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

/**
 * ===========================================
 * PARSING MIDDLEWARE
 * ===========================================
 */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * ===========================================
 * LOGGING MIDDLEWARE
 * ===========================================
 */

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }));
}

/**
 * ===========================================
 * STATIC FILES
 * ===========================================
 */

const uploadsPath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadsPath));

/**
 * ===========================================
 * API ROUTES
 * ===========================================
 */

// Health check endpoint
app.get('/api/health', (req, res) => {
  successResponse(res, {
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    socketConnections: io.engine.clientsCount,
  });
});

// API info
app.get('/api', (req, res) => {
  successResponse(res, {
    name: 'Video Processing Platform API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    features: ['auth', 'video-upload', 'real-time-updates'],
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Video routes
app.use('/api/videos', videoRoutes);

/**
 * ===========================================
 * ERROR HANDLING
 * ===========================================
 */

app.use(notFoundHandler);
app.use(errorHandler);

/**
 * ===========================================
 * SERVER STARTUP
 * ===========================================
 */

const PORT = parseInt(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start HTTP server (with Socket.io attached)
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📍 API info: http://localhost:${PORT}/api`);
      logger.info(`🔌 Socket.io ready for connections`);
    });

    /**
     * Graceful shutdown handling
     */
    const gracefulShutdown = (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      // Close all socket connections
      io.close(() => {
        logger.info('Socket.io connections closed');
      });

      httpServer.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        logger.info('HTTP server closed');
        
        try {
          const mongoose = await import('mongoose');
          await mongoose.default.connection.close();
          logger.info('MongoDB connection closed');
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error closing database connection:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', { reason, promise });
      httpServer.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing
export { app, io };
export default app;
