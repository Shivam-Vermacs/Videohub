/**
 * Video Controller
 * ----------------
 * Handles video upload, retrieval, and management operations.
 */

import Video, { VideoStatus, SensitivityStatus } from '../models/Video.js';
import logger from '../utils/logger.js';
import { 
  successResponse, 
  createdResponse, 
  errorResponse, 
  paginatedResponse,
  HttpStatus 
} from '../utils/apiResponse.js';
import { deleteFile, formatFileSize, getVideoPath } from '../utils/fileUpload.js';
import { processVideo, checkFFmpegAvailable, analyzeSensitivity } from '../utils/videoProcessor.js'; // Phase 8: Import analyzeSensitivity
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// ES module __dirname equivalent 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Upload a new video
 * @route   POST /api/videos/upload
 * @access  Private (requires authentication)
 */
export const uploadVideo = async (req, res, next) => {
  let uploadedFilePath = null;
  let video = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return errorResponse(
        res,
        'No video file uploaded. Please select a video file.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Store the file path for cleanup in case of error
    uploadedFilePath = req.file.path;

    // Validate required fields
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      // Delete uploaded file since validation failed
      await deleteFile(uploadedFilePath);
      return errorResponse(
        res,
        'Video title is required.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Create video document with uploading status
    const videoData = {
      title: title.trim(),
      description: req.body.description ? req.body.description.trim() : '',
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filepath: req.file.path,
      filesize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
      organization: req.user.organization || null,
      status: VideoStatus.UPLOADING,
      sensitivityStatus: SensitivityStatus.PENDING,
      processingProgress: 0,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [],
    };

    video = await Video.create(videoData);

    // Update status to processing
    video.status = VideoStatus.PROCESSING;
    video.processingProgress = 10;
    await video.save();

    logger.info(`Video uploaded: ${video.filename} by user ${req.user.email}`);

    // Start video processing (non-blocking for the response)
    // We'll return immediately and process in background
    const videoId = video._id;
    
    // Process video in background
    processVideoInBackground(videoId, uploadedFilePath);

    // Return success response immediately
    return createdResponse(res, {
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        originalFilename: video.originalFilename,
        filesize: video.filesize,
        filesizeFormatted: formatFileSize(video.filesize),
        mimeType: video.mimeType,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        processingProgress: video.processingProgress,
        createdAt: video.createdAt,
      },
    }, 'Video uploaded successfully. Processing started.');

  } catch (error) {
    // CRITICAL: Clean up uploaded file if database save failed
    if (uploadedFilePath && !video) {
      logger.warn(`Cleaning up file after error: ${uploadedFilePath}`);
      await deleteFile(uploadedFilePath);
    }
    
    logger.error('Video upload error:', error);
    next(error);
  }
};

/**
 * Process video in background (non-blocking)
 * Emits socket events for real-time status updates
 * @param {string} videoId - Video document ID
 * @param {string} filePath - Path to video file
 */
async function processVideoInBackground(videoId, filePath) {
  let video = null;
  
  try {
    logger.info(`Starting background processing for video: ${videoId}`);

    // Fetch the video to get the uploadedBy userId
    video = await Video.findById(videoId);
    if (!video) {
      logger.error(`Video not found for processing: ${videoId}`);
      return;
    }

    const userId = video.uploadedBy?.toString();

    // Emit processing started event
    if (global.io && userId) {
      global.io.to(userId).emit('videoStatusUpdate', {
        videoId: videoId.toString(),
        status: 'processing',
        progress: 10,
        message: 'Processing started',
      });
    }

    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    
    if (!ffmpegAvailable) {
      logger.warn('FFmpeg not available, skipping video processing');
      // Just mark as completed without processing
      await Video.findByIdAndUpdate(videoId, {
        status: VideoStatus.COMPLETED,
        processingProgress: 100,
      });
      
      // Emit completed event (no thumbnail)
      if (global.io && userId) {
        global.io.to(userId).emit('videoStatusUpdate', {
          videoId: videoId.toString(),
          status: 'completed',
          progress: 100,
          message: 'Video uploaded (FFmpeg not available for processing)',
        });
      }
      return;
    }

    // Update and emit progress
    await Video.findByIdAndUpdate(videoId, { processingProgress: 30 });
    if (global.io && userId) {
      global.io.to(userId).emit('videoStatusUpdate', {
        videoId: videoId.toString(),
        status: 'processing',
        progress: 30,
        message: 'Extracting metadata...',
      });
    }

    // Phase 8: Analyze sensitivity BEFORE processing (works even if FFmpeg fails)
    const videoMetadata = {
      title: video.title,
      description: video.description,
    };
    const sensitivityStatus = analyzeSensitivity(videoMetadata);
    logger.info(`Sensitivity analysis result: ${sensitivityStatus}`);
    
    // Save sensitivity status immediately
    await Video.findByIdAndUpdate(videoId, { sensitivityStatus });

    // Process video (extract metadata and generate thumbnail)
    const result = await processVideo(filePath, videoMetadata);
    
    // Update and emit progress
    await Video.findByIdAndUpdate(videoId, { processingProgress: 80 });
    if (global.io && userId) {
      global.io.to(userId).emit('videoStatusUpdate', {
        videoId: videoId.toString(),
        status: 'processing',
        progress: 80,
        message: 'Generating thumbnail...',
      });
    }

    // Update video document with processing results
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
      status: VideoStatus.COMPLETED,
      duration: result.duration,
      thumbnailPath: result.thumbnailPath,
      // sensitivityStatus already saved earlier (line 201)
      processingProgress: 100,
      'metadata.width': result.metadata?.width,
      'metadata.height': result.metadata?.height,
      'metadata.fps': result.metadata?.fps,
      'metadata.codec': result.metadata?.codec,
      'metadata.bitrate': result.metadata?.bitrate,
    }, { new: true });

    logger.info(`Video processing completed: ${videoId}`);

    // Emit completion event with full data
    if (global.io && userId) {
      global.io.to(userId).emit('videoStatusUpdate', {
        videoId: videoId.toString(),
        status: 'completed',
        progress: 100,
        message: 'Processing complete',
        thumbnailPath: result.thumbnailPath,
        duration: result.duration,
        durationFormatted: formatDuration(result.duration),
        sensitivityStatus: sensitivityStatus, // Phase 8: Use earlier analysis result
      });
      logger.info(`Socket event emitted to user ${userId} for video ${videoId}`);
    }

  } catch (error) {
    logger.error(`Video processing failed for ${videoId}:`, error);
    
    // Mark video as failed
    await Video.findByIdAndUpdate(videoId, {
      status: VideoStatus.FAILED,
      processingProgress: 0,
      'processingError': error.message,
    });

    // Emit failure event
    const userId = video?.uploadedBy?.toString();
    if (global.io && userId) {
      global.io.to(userId).emit('videoStatusUpdate', {
        videoId: videoId.toString(),
        status: 'failed',
        progress: 0,
        message: `Processing failed: ${error.message}`,
        error: error.message,
      });
    }
  }
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}


/**
 * @desc    Get all videos for current user
 * @route   GET /api/videos
 * @access  Private (requires authentication)
 */
export const getVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, sort = '-createdAt' } = req.query;
    
    // Build query
    const query = {
      uploadedBy: req.user.userId,
      isDeleted: false,
    };

    // Filter by status if provided
    if (status && Object.values(VideoStatus).includes(status)) {
      query.status = status;
    }

    // If user has organization, also show organization videos
    if (req.user.organization) {
      query.$or = [
        { uploadedBy: req.user.userId },
        { organization: req.user.organization, isPublic: true },
      ];
      delete query.uploadedBy;
    }

    // Get total count
    const total = await Video.countDocuments(query);

    // Get videos with pagination
    const videos = await Video.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-filepath -__v')
      .populate('uploadedBy', 'username email');

    // Format response
    const formattedVideos = videos.map(video => ({
      id: video._id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      originalFilename: video.originalFilename,
      filesize: video.filesize,
      filesizeFormatted: formatFileSize(video.filesize),
      duration: video.duration,
      durationFormatted: video.durationFormatted,
      mimeType: video.mimeType,
      status: video.status,
      sensitivityStatus: video.sensitivityStatus,
      processingProgress: video.processingProgress,
      thumbnailPath: video.thumbnailPath,
      uploadedBy: video.uploadedBy,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    }));

    return paginatedResponse(res, formattedVideos, parseInt(page), parseInt(limit), total, 'Videos retrieved successfully');

  } catch (error) {
    logger.error('Get videos error:', error);
    next(error);
  }
};

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Private (requires authentication)
 */
export const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      isDeleted: false,
    }).populate('uploadedBy', 'username email');

    if (!video) {
      return errorResponse(res, 'Video not found', HttpStatus.NOT_FOUND);
    }

    // Check access permissions
    const isOwner = video.uploadedBy._id.toString() === req.user.userId;
    const sameOrg = video.organization && video.organization === req.user.organization;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin && !(sameOrg && video.isPublic)) {
      return errorResponse(res, 'You do not have permission to view this video', HttpStatus.FORBIDDEN);
    }

    // Increment view count if not owner
    if (!isOwner) {
      await video.incrementViews();
    }

    return successResponse(res, {
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        originalFilename: video.originalFilename,
        filesize: video.filesize,
        filesizeFormatted: formatFileSize(video.filesize),
        duration: video.duration,
        durationFormatted: video.durationFormatted,
        mimeType: video.mimeType,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        processingProgress: video.processingProgress,
        thumbnailPath: video.thumbnailPath,
        viewCount: video.viewCount,
        uploadedBy: video.uploadedBy,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
    }, 'Video retrieved successfully');

  } catch (error) {
    logger.error('Get video by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Delete a video
 * @route   DELETE /api/videos/:id
 * @access  Private (requires authentication, owner or admin)
 */
export const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
      return errorResponse(res, 'Video not found', HttpStatus.NOT_FOUND);
    }

    // Check permissions
    const isOwner = video.uploadedBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You do not have permission to delete this video', HttpStatus.FORBIDDEN);
    }

    // Soft delete
    await video.softDelete();

    // Optionally delete file from disk (uncomment for hard delete)
    // await deleteFile(video.filepath);

    logger.info(`Video deleted: ${video.filename} by user ${req.user.email}`);

    return successResponse(res, null, 'Video deleted successfully');

  } catch (error) {
    logger.error('Delete video error:', error);
    next(error);
  }
};

/**
 * @desc    Update video metadata
 * @route   PUT /api/videos/:id
 * @access  Private (requires authentication, owner or admin)
 */
export const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, tags, isPublic } = req.body;

    const video = await Video.findById(id);

    if (!video || video.isDeleted) {
      return errorResponse(res, 'Video not found', HttpStatus.NOT_FOUND);
    }

    // Check permissions
    const isOwner = video.uploadedBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You do not have permission to update this video', HttpStatus.FORBIDDEN);
    }

    // Update fields
    if (title !== undefined) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (tags !== undefined) {
      video.tags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
    }
    if (isPublic !== undefined) video.isPublic = isPublic;

    await video.save();

    logger.info(`Video updated: ${video.filename} by user ${req.user.email}`);

    return successResponse(res, {
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        tags: video.tags,
        isPublic: video.isPublic,
        updatedAt: video.updatedAt,
      },
    }, 'Video updated successfully');

  } catch (error) {
    logger.error('Update video error:', error);
    next(error);
  }
};

/**
 * @desc    Get video statistics for dashboard
 * @route   GET /api/videos/stats
 * @access  Private (requires authentication)
 */
export const getVideoStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const organization = req.user.organization;

    // Build base query
    const baseQuery = { isDeleted: false };
    
    if (organization) {
      baseQuery.organization = organization;
    } else {
      baseQuery.uploadedBy = userId;
    }

    // Get counts by status
    const stats = await Video.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSize: { $sum: '$filesize' },
        },
      },
    ]);

    // Get total counts
    const totalVideos = await Video.countDocuments(baseQuery);
    const totalSize = await Video.aggregate([
      { $match: baseQuery },
      { $group: { _id: null, total: { $sum: '$filesize' } } },
    ]);

    // Format stats
    const statusCounts = {};
    stats.forEach(stat => {
      statusCounts[stat._id] = {
        count: stat.count,
        totalSize: stat.totalSize,
        totalSizeFormatted: formatFileSize(stat.totalSize),
      };
    });

    return successResponse(res, {
      totalVideos,
      totalSize: totalSize[0]?.total || 0,
      totalSizeFormatted: formatFileSize(totalSize[0]?.total || 0),
      byStatus: statusCounts,
    }, 'Video statistics retrieved successfully');

  } catch (error) {
    logger.error('Get video stats error:', error);
    next(error);
  }
};

/**
 * @desc    Stream video with HTTP Range Request support (206 Partial Content)
 * @route   GET /api/videos/stream/:id
 * @access  Public (manual JWT verification via query param)
 */
export const streamVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.query.token;
    
    logger.debug(`Stream request for video: ${id}`);

    // STEP 1: JWT Token Verification
    if (!token) {
      logger.warn('Stream request without token');
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.debug(`JWT verified for user: ${decoded.userId}`);
    } catch (err) {
      logger.warn(`JWT verification failed: ${err.message}`);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Find video in database
    const video = await Video.findById(id);
    if (!video) {
      logger.warn(`Video not found: ${id}`);
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Video not found',
      });
    }

    logger.debug(`Streaming video: ${video.filename}`);

    // STEP 2: User Authorization Check
    try {
      // ADMIN BYPASS: Admins can view any video for moderation
      if (decoded.role === 'admin') {
        logger.debug('Admin access granted');
      } else {
        // Handle both populated (object) and non-populated (ObjectId) uploadedBy
        const videoOwnerId = video.uploadedBy?._id 
          ? video.uploadedBy._id.toString() 
          : video.uploadedBy?.toString();
        
        if (videoOwnerId !== decoded.userId) {
          // Check if video is public or user has org access
          if (!video.isPublic && (!decoded.organization || video.organization !== decoded.organization)) {
            logger.warn(`Unauthorized access attempt by user: ${decoded.userId}`);
            return res.status(HttpStatus.FORBIDDEN).json({
              success: false,
              message: 'You do not have permission to access this video',
            });
          }
        }
      }
    } catch (authError) {
      logger.error('Authorization check error:', authError.message);
    }

    // STEP 3: Video Status Check
    if (video.status !== VideoStatus.COMPLETED) {
      logger.warn(`Video not ready for streaming: ${video.status}`);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Video is still being processed',
      });
    }

    // STEP 4: Sensitivity Check (Phase 8)
    if (video.sensitivityStatus === 'flagged' && decoded.role !== 'admin') {
      logger.warn(`Flagged content access denied to non-admin: ${decoded.userId}`);
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Content flagged as sensitive. Admin access required.',
      });
    }

    // Get the video file path
    const videoPath = video.filepath;
    
    if (!videoPath || !fs.existsSync(videoPath)) {
      logger.error(`Video file not found: ${videoPath}`);
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Video file not found',
      });
    }

    // Get file stats
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // If no range, send whole file
    if (!range) {
      logger.debug(`Sending full file: ${fileSize} bytes`);
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
      return;
    }

    // Parse range
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;

    logger.debug(`Sending chunk: ${start}-${end}/${fileSize}`);

    // Send partial content
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(videoPath, { start, end }).pipe(res);

  } catch (error) {
    logger.error('Stream error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Streaming error',
      });
    }
  }
};

/**
 * @desc    Get ALL videos (Admin only - for moderation)
 * @route   GET /api/videos/admin/all
 * @access  Private (Admin only)
 */
export const getAllVideosAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, sensitivityStatus, sort = '-createdAt' } = req.query;
    
    // Build query - Admin sees ALL videos
    const query = { isDeleted: false };

    // Filter by status if provided
    if (status && Object.values(VideoStatus).includes(status)) {
      query.status = status;
    }

    // Filter by sensitivity status if provided
    if (sensitivityStatus) {
      query.sensitivityStatus = sensitivityStatus;
    }

    // Get total count
    const total = await Video.countDocuments(query);

    // Get ALL videos with uploader info
    const videos = await Video.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v')
      .populate('uploadedBy', 'username email role');

    // Format response with uploader info
    const formattedVideos = videos.map(video => ({
      id: video._id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      originalFilename: video.originalFilename,
      filepath: video.filepath, // Admin can see filepath
      filesize: video.filesize,
      filesizeFormatted: formatFileSize(video.filesize),
      duration: video.duration,
      durationFormatted: video.durationFormatted,
      mimeType: video.mimeType,
      status: video.status,
      sensitivityStatus: video.sensitivityStatus,
      processingProgress: video.processingProgress,
      thumbnailPath: video.thumbnailPath,
      uploadedBy: video.uploadedBy,
      organization: video.organization,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    }));

    logger.info(`Admin fetched ${formattedVideos.length} videos`);

    return paginatedResponse(res, formattedVideos, parseInt(page), parseInt(limit), total, 'All videos retrieved successfully');

  } catch (error) {
    logger.error('Admin get all videos error:', error);
    next(error);
  }
};

/**
 * @desc    Toggle video sensitivity status (Admin moderation)
 * @route   PATCH /api/videos/admin/:id/sensitivity
 * @access  Private (Admin only)
 */
export const toggleSensitivityStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'safe' or 'flagged'

    if (!['safe', 'flagged'].includes(status)) {
      return errorResponse(res, 'Invalid status. Must be "safe" or "flagged"', HttpStatus.BAD_REQUEST);
    }

    const video = await Video.findById(id);
    
    if (!video) {
      return errorResponse(res, 'Video not found', HttpStatus.NOT_FOUND);
    }

    const previousStatus = video.sensitivityStatus;
    video.sensitivityStatus = status;
    await video.save();

    logger.info(`Admin toggled video ${id} sensitivity: ${previousStatus} -> ${status}`);

    return successResponse(res, {
      video: {
        id: video._id,
        title: video.title,
        sensitivityStatus: video.sensitivityStatus,
        previousStatus,
      }
    }, `Video marked as ${status}`);

  } catch (error) {
    logger.error('Toggle sensitivity error:', error);
    next(error);
  }
};

export default {
  uploadVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  updateVideo,
  getVideoStats,
  streamVideo,
  getAllVideosAdmin,
  toggleSensitivityStatus,
};
