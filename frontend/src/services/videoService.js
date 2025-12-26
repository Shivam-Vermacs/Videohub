/**
 * Video Service
 * -------------
 * API calls for video-related operations with upload progress tracking.
 */

import api from './api';

/**
 * Upload a video with progress tracking
 * @param {FormData} formData - Form data containing video file and metadata
 * @param {function} onProgress - Callback for upload progress (0-100)
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<object>} - Upload response
 */
export const uploadVideo = async (formData, onProgress = null, signal = null) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentage);
      }
    },
  };

  if (signal) {
    config.signal = signal;
  }

  const response = await api.post('/videos/upload', formData, config);
  return response.data;
};

/**
 * Get all videos for current user
 * @param {object} params - Query parameters (page, limit, status, sort)
 * @returns {Promise<object>} - Videos with pagination
 */
export const getVideos = async (params = {}) => {
  const response = await api.get('/videos', { params });
  return response.data;
};

/**
 * Get single video by ID
 * @param {string} videoId - Video ID
 * @returns {Promise<object>} - Video data
 */
export const getVideoById = async (videoId) => {
  const response = await api.get(`/videos/${videoId}`);
  return response.data;
};

/**
 * Update video metadata
 * @param {string} videoId - Video ID
 * @param {object} data - Updated fields (title, description, tags, isPublic)
 * @returns {Promise<object>} - Updated video
 */
export const updateVideo = async (videoId, data) => {
  const response = await api.put(`/videos/${videoId}`, data);
  return response.data;
};

/**
 * Delete a video
 * @param {string} videoId - Video ID
 * @returns {Promise<object>} - Deletion confirmation
 */
export const deleteVideo = async (videoId) => {
  const response = await api.delete(`/videos/${videoId}`);
  return response.data;
};

/**
 * Get video statistics for dashboard
 * @returns {Promise<object>} - Video stats
 */
export const getVideoStats = async () => {
  const response = await api.get('/videos/stats');
  return response.data;
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

/**
 * Get ALL videos (Admin only - for moderation panel)
 * @param {object} params - Query parameters (page, limit, status, sensitivityStatus, sort)
 * @returns {Promise<object>} - All videos with pagination
 */
export const getAllVideosAdmin = async (params = {}) => {
  const response = await api.get('/videos/admin/all', { params });
  return response.data;
};

/**
 * Toggle video sensitivity status (Admin moderation)
 * @param {string} videoId - Video ID
 * @param {string} status - 'safe' or 'flagged'
 * @returns {Promise<object>} - Updated video
 */
export const toggleSensitivityStatus = async (videoId, status) => {
  const response = await api.patch(`/videos/admin/${videoId}/sensitivity`, { status });
  return response.data;
};

export default {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getVideoStats,
  getAllVideosAdmin,
  toggleSensitivityStatus,
};
