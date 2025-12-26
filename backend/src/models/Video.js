/**
 * Video Model
 * -----------
 * Mongoose schema for video metadata, processing status, and sensitivity analysis.
 * Supports multi-tenant architecture with organization-based isolation.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Video processing status enum
 */
export const VideoStatus = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Video sensitivity status enum
 */
export const SensitivityStatus = {
  PENDING: 'pending',
  SAFE: 'safe',
  FLAGGED: 'flagged',
};

/**
 * Video Schema Definition
 */
const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      unique: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    filepath: {
      type: String,
      required: [true, 'Filepath is required'],
    },
    filesize: {
      type: Number,
      required: [true, 'Filesize is required'],
      min: [0, 'Filesize cannot be negative'],
    },
    duration: {
      type: Number, // Duration in seconds
      default: null,
      min: [0, 'Duration cannot be negative'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/webm',
          'video/x-matroska',
        ],
        message: 'Unsupported video format',
      },
    },
    resolution: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    bitrate: {
      type: Number, // Bitrate in bps
      default: null,
    },
    codec: {
      type: String,
      default: null,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
      index: true,
    },
    organization: {
      type: String,
      trim: true,
      default: null,
      index: true, // Index for multi-tenant queries
    },
    status: {
      type: String,
      enum: {
        values: Object.values(VideoStatus),
        message: 'Status must be one of: uploading, processing, completed, failed',
      },
      default: VideoStatus.UPLOADING,
      index: true,
    },
    sensitivityStatus: {
      type: String,
      enum: {
        values: Object.values(SensitivityStatus),
        message: 'Sensitivity status must be one of: pending, safe, flagged',
      },
      default: SensitivityStatus.PENDING,
      index: true,
    },
    sensitivityDetails: {
      score: { type: Number, min: 0, max: 100, default: null },
      categories: [{ type: String }],
      analyzedAt: { type: Date, default: null },
    },
    processingProgress: {
      type: Number,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot exceed 100'],
      default: 0,
    },
    processingError: {
      type: String,
      default: null,
    },
    thumbnailPath: {
      type: String,
      default: null,
    },
    thumbnails: [{
      path: String,
      timestamp: Number, // Timestamp in seconds
    }],
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Indexes for performance
 */
videoSchema.index({ filename: 1 }, { unique: true });
videoSchema.index({ uploadedBy: 1, createdAt: -1 });
videoSchema.index({ organization: 1, status: 1 });
videoSchema.index({ organization: 1, createdAt: -1 });
videoSchema.index({ status: 1, sensitivityStatus: 1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ isDeleted: 1, isPublic: 1 });

/**
 * Virtual: Human-readable filesize
 */
videoSchema.virtual('filesizeFormatted').get(function () {
  const bytes = this.filesize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

/**
 * Virtual: Human-readable duration
 */
videoSchema.virtual('durationFormatted').get(function () {
  if (!this.duration) return null;
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

/**
 * Pre-save middleware: Set organization from uploader
 */
videoSchema.pre('save', async function (next) {
  // If organization is not set and we have an uploader, get it from the user
  if (!this.organization && this.uploadedBy) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.uploadedBy);
      if (user?.organization) {
        this.organization = user.organization;
      }
    } catch (error) {
      // Silently continue if user lookup fails
    }
  }
  next();
});

/**
 * Instance method: Update processing progress
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} status - Optional status update
 */
videoSchema.methods.updateProgress = async function (progress, status = null) {
  this.processingProgress = Math.min(100, Math.max(0, progress));
  
  if (status) {
    this.status = status;
  }
  
  if (progress >= 100 && this.status === VideoStatus.PROCESSING) {
    this.status = VideoStatus.COMPLETED;
  }
  
  await this.save();
};

/**
 * Instance method: Mark video as failed
 * @param {string} error - Error message
 */
videoSchema.methods.markAsFailed = async function (error) {
  this.status = VideoStatus.FAILED;
  this.processingError = error;
  await this.save();
};

/**
 * Instance method: Soft delete video
 */
videoSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

/**
 * Instance method: Increment view count
 */
videoSchema.methods.incrementViews = async function () {
  this.viewCount += 1;
  await this.save({ validateBeforeSave: false });
};

/**
 * Static method: Find videos by organization (excluding deleted)
 * @param {string} organization - Organization name
 * @param {object} options - Query options (page, limit, sort)
 */
videoSchema.statics.findByOrganization = function (organization, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  
  return this.find({ organization, isDeleted: false })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('uploadedBy', 'username email');
};

/**
 * Static method: Find videos by user (excluding deleted)
 * @param {string} userId - User ID
 * @param {object} options - Query options
 */
videoSchema.statics.findByUser = function (userId, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  
  return this.find({ uploadedBy: userId, isDeleted: false })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Static method: Get processing statistics
 * @param {string} organization - Optional organization filter
 */
videoSchema.statics.getProcessingStats = async function (organization = null) {
  const match = { isDeleted: false };
  if (organization) {
    match.organization = organization;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSize: { $sum: '$filesize' },
      },
    },
  ]);
  
  return stats.reduce((acc, curr) => {
    acc[curr._id] = { count: curr.count, totalSize: curr.totalSize };
    return acc;
  }, {});
};

const Video = mongoose.model('Video', videoSchema);

export default Video;
