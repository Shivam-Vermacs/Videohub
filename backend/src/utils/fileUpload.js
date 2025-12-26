/**
 * File Upload Utility
 * -------------------
 * Multer configuration for video file uploads with validation,
 * unique naming, and disk storage management.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Allowed video MIME types
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-matroska',
  'video/avi',
  'video/mkv',
];

/**
 * Allowed video extensions
 */
export const ALLOWED_EXTENSIONS = ['.mp4', '.mpeg', '.mov', '.avi', '.webm', '.mkv'];

/**
 * Default max file size (500MB)
 */
const DEFAULT_MAX_SIZE = 500 * 1024 * 1024;

/**
 * Upload directory paths
 */
const UPLOAD_BASE_DIR = path.join(__dirname, '..', '..', 'uploads');
const VIDEO_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, 'videos');
const THUMBNAIL_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, 'thumbnails');

/**
 * Ensure a directory exists, create if not
 * @param {string} dirPath - Directory path to check/create
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Initialize upload directories
 */
export const initializeUploadDirectories = () => {
  ensureDirectoryExists(UPLOAD_BASE_DIR);
  ensureDirectoryExists(VIDEO_UPLOAD_DIR);
  ensureDirectoryExists(THUMBNAIL_UPLOAD_DIR);
};

// Initialize directories on module load
initializeUploadDirectories();

/**
 * Generate a unique, safe filename
 * @param {object} file - Multer file object
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const timestamp = Date.now();
  const uniqueId = uuidv4().replace(/-/g, '');
  
  // Create a safe filename: uuid_timestamp.extension
  return `${uniqueId}_${timestamp}${ext}`;
};

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  // Remove path separators and null bytes
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\0/g, '')
    .trim();
};

/**
 * Multer disk storage configuration
 */
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    ensureDirectoryExists(VIDEO_UPLOAD_DIR);
    cb(null, VIDEO_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file);
    cb(null, uniqueName);
  },
});

/**
 * File filter to validate video files
 * @param {object} req - Express request
 * @param {object} file - Multer file object
 * @param {function} cb - Callback
 */
const videoFileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    const error = new Error(`Invalid file type. Allowed types: MP4, MPEG, MOV, AVI, WebM, MKV`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    error.code = 'INVALID_EXTENSION';
    return cb(error, false);
  }

  cb(null, true);
};

/**
 * Get max file size from environment or use default
 * @returns {number} - Max file size in bytes
 */
const getMaxFileSize = () => {
  const envSize = process.env.MAX_FILE_SIZE;
  if (envSize && !isNaN(parseInt(envSize))) {
    return parseInt(envSize);
  }
  return DEFAULT_MAX_SIZE;
};

/**
 * Multer upload instance for single video file
 * Field name: 'video'
 */
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: getMaxFileSize(),
    files: 1,
  },
});

/**
 * Format file size to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Delete a file from disk
 * @param {string} filepath - Path to file
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export const deleteFile = async (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filepath}:`, error);
    return false;
  }
};

/**
 * Get the full path to a video file
 * @param {string} filename - Video filename
 * @returns {string} - Full file path
 */
export const getVideoPath = (filename) => {
  return path.join(VIDEO_UPLOAD_DIR, filename);
};

/**
 * Get file stats
 * @param {string} filepath - Path to file
 * @returns {Promise<object|null>} - File stats or null
 */
export const getFileStats = async (filepath) => {
  try {
    return await fs.promises.stat(filepath);
  } catch (error) {
    return null;
  }
};

/**
 * Multer error handler middleware
 * @param {Error} error - Multer error
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Next middleware
 */
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${formatFileSize(getMaxFileSize())}`,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one file can be uploaded at a time',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "video" as the field name',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
  }
  
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_EXTENSION') {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  next(error);
};

export default {
  uploadVideo,
  formatFileSize,
  deleteFile,
  getVideoPath,
  getFileStats,
  ensureDirectoryExists,
  initializeUploadDirectories,
  handleMulterError,
  sanitizeFilename,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_EXTENSIONS,
};
