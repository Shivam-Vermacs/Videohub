/**
 * Video Routes
 * ------------
 * Routes for video upload, retrieval, and management.
 */

import express from 'express';
import {
  uploadVideo as uploadVideoController,
  getVideos,
  getVideoById,
  deleteVideo,
  updateVideo,
  getVideoStats,
  streamVideo,
  getAllVideosAdmin,
  toggleSensitivityStatus,
} from '../controllers/videoController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadVideo, handleMulterError } from '../utils/fileUpload.js';

const router = express.Router();

// ==========================================
// ADMIN ROUTES (must be before :id routes)
// ==========================================

/**
 * @route   GET /api/videos/admin/all
 * @desc    Get ALL videos (Admin moderation panel)
 * @access  Private (Admin only)
 */
router.get('/admin/all', protect, restrictTo('admin'), getAllVideosAdmin);

/**
 * @route   PATCH /api/videos/admin/:id/sensitivity
 * @desc    Toggle video sensitivity status (Admin moderation)
 * @access  Private (Admin only)
 */
router.patch('/admin/:id/sensitivity', protect, restrictTo('admin'), toggleSensitivityStatus);

// ==========================================
// PUBLIC & USER ROUTES
// ==========================================

/**
 * @route   GET /api/videos/stats
 * @desc    Get video statistics for dashboard
 * @access  Private
 */
router.get('/stats', protect, getVideoStats);

/**
 * @route   GET /api/videos/stream/:id
 * @desc    Stream video with HTTP Range Request support
 * @access  Public (manual JWT verification via query param)
 * @note    NO protect middleware - HTML5 video tag can't send Auth header
 */
router.get('/stream/:id', streamVideo);

/**
 * @route   POST /api/videos/upload
 * @desc    Upload a new video
 * @access  Private (Editor, Admin roles recommended)
 */
router.post(
  '/upload',
  protect,
  uploadVideo.single('video'),
  handleMulterError,
  uploadVideoController
);

/**
 * @route   GET /api/videos
 * @desc    Get all videos for current user
 * @access  Private
 */
router.get('/', protect, getVideos);

/**
 * @route   GET /api/videos/:id
 * @desc    Get single video by ID
 * @access  Private
 */
router.get('/:id', protect, getVideoById);

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video metadata
 * @access  Private (owner or admin)
 */
router.put('/:id', protect, updateVideo);

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete a video (soft delete)
 * @access  Private (owner or admin)
 */
router.delete('/:id', protect, deleteVideo);

export default router;
