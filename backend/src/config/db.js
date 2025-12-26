/**
 * Database Configuration
 * ----------------------
 * MongoDB connection setup with connection pooling, retry logic,
 * and proper event handling for production environments.
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * MongoDB connection options optimized for production
 */
const connectionOptions = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  
  // Timeout settings
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  
  // Buffering
  bufferCommands: false,
  
  // Heartbeat frequency
  heartbeatFrequencyMS: 10000,
};

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 */
const connectDB = async (retries = 5, delay = 5000) => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    logger.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`MongoDB connection attempt ${attempt}/${retries}...`);
      
      const conn = await mongoose.connect(mongoURI, connectionOptions);
      
      logger.info(`MongoDB connected successfully: ${conn.connection.host}`);
      
      // Set up connection event listeners
      setupConnectionListeners();
      
      return conn;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === retries) {
        logger.error('All MongoDB connection attempts failed. Exiting...');
        process.exit(1);
      }
      
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Set up MongoDB connection event listeners
 */
const setupConnectionListeners = () => {
  const db = mongoose.connection;

  db.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
  });

  db.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);
  });

  db.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
  });

  db.on('reconnected', () => {
    logger.info('Mongoose reconnected to MongoDB');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await db.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      logger.error(`Error closing MongoDB connection: ${err.message}`);
      process.exit(1);
    }
  });
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Check if MongoDB is connected
 * @returns {boolean} Connection status
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

export { connectDB, disconnectDB, isConnected };
export default connectDB;
