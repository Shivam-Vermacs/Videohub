/**
 * Video Processor Utility
 * -----------------------
 * FFmpeg-based video processing for duration extraction and thumbnail generation.
 */

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import logger from './logger.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find FFmpeg path on Windows
 */
const findFFmpegPath = () => {
  try {
    // Try to find ffmpeg in PATH
    const result = execSync('where ffmpeg', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const ffmpegPath = result.trim().split('\n')[0].trim();
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      logger.info(`Found FFmpeg at: ${ffmpegPath}`);
      return ffmpegPath;
    }
  } catch (e) {
    // FFmpeg not in PATH, try common locations
    const commonPaths = [
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
    ];
    
    // Check winget install location
    const userProfile = process.env.USERPROFILE || process.env.HOME;
    if (userProfile) {
      const wingetPath = path.join(userProfile, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe');
      commonPaths.unshift(wingetPath);
    }

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        logger.info(`Found FFmpeg at: ${p}`);
        return p;
      }
    }
  }
  return null;
};

// Configure FFmpeg paths
const ffmpegPath = findFFmpegPath();
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
  // Set ffprobe path (same directory)
  const ffprobePath = ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe');
  if (fs.existsSync(ffprobePath)) {
    ffmpeg.setFfprobePath(ffprobePath);
    logger.info(`FFprobe configured at: ${ffprobePath}`);
  }
}

/**
 * Content sensitivity keywords for automated flagging
 */
const UNSAFE_KEYWORDS = ['nsfw', 'explicit', 'violence', 'attack', 'kill', 'abuse', 'test-flag'];

/**
 * Default thumbnail settings
 */
const THUMBNAIL_SIZE = '320x240';
const THUMBNAIL_SEEK_PERCENT = '50%';

/**
 * Ensure thumbnails directory exists
 */
const THUMBNAILS_DIR = path.join(__dirname, '..', '..', 'uploads', 'thumbnails');

const ensureThumbnailsDir = () => {
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }
  return THUMBNAILS_DIR;
};

// Initialize on module load
ensureThumbnailsDir();

/**
 * Analyze content sensitivity based on metadata
 * 
 * EXTENSIBILITY: This function can be enhanced with ML services:
 * 
 * TODO: For production ML integration:
 * 1. AWS Rekognition: await rekognition.detectModerationLabels(frameBuffer)
 * 2. Google Video Intelligence: await videoIntelligence.annotateVideo(filePath)
 * 3. Azure Content Moderator: await contentModerator.imageModeration(frameUrl)
 * 4. Custom TensorFlow model: await model.predict(tensorFrames)
 * 
 * The function signature remains the same - just add async and API calls.
 * The rest of the system (database, frontend, security) doesn't change.
 * 
 * @param {object} metadata - Video metadata with title and description
 * @param {string} filePath - Optional: Path to video file for frame analysis
 * @returns {string} - 'safe' or 'flagged'
 */
export const analyzeSensitivity = (metadata, filePath = null) => {
  if (!metadata || (!metadata.title && !metadata.description)) {
    // No metadata to analyze, default to safe
    return 'safe';
  }

  // LAYER 1: Metadata-based detection (fast, instant)
  const content = `${metadata.title || ''} ${metadata.description || ''}`.toLowerCase();
  const hasUnsafeContent = UNSAFE_KEYWORDS.some(keyword => content.includes(keyword));

  if (hasUnsafeContent) {
    logger.info('Content flagged: Unsafe keyword detected');
    return 'flagged';
  }

  // LAYER 2: TODO - Add ML frame analysis here
  // Example integration point:
  // if (filePath) {
  //   const frames = await extractKeyFrames(filePath);
  //   const mlResult = await awsRekognition.detectModerationLabels(frames[0]);
  //   if (mlResult.ModerationLabels.length > 0) {
  //     return 'flagged';
  //   }
  // }

  // LAYER 3: TODO - Add audio transcription + hate speech detection
  // Example integration point:
  // const transcript = await googleSpeechToText(filePath);
  // const hateSpeech = await perspectiveAPI.analyze(transcript);
  // if (hateSpeech.score > 0.8) return 'flagged';

  // SIMULATION: 10% false positive rate (for demo purposes)
  // This simulates AI content moderation for demonstration
  // Remove this block in production when real ML is integrated
  const simulatedFlag = Math.random() < 0.1;
  if (simulatedFlag) {
    logger.info('Content flagged: Simulated AI detection (demo mode)');
    return 'flagged';
  }

  return 'safe';
};

/**
 * Get video metadata using ffprobe
 * @param {string} filePath - Path to video file
 * @returns {Promise<object>} - Video metadata
 */
export const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error('FFprobe error:', err);
        reject(new Error(`Failed to read video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration || 0,
        size: metadata.format.size || 0,
        bitrate: metadata.format.bit_rate || 0,
        format: metadata.format.format_name,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          fps: eval(videoStream.r_frame_rate) || 0,
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate,
        } : null,
      });
    });
  });
};

/**
 * Generate thumbnail from video
 * @param {string} filePath - Path to video file
 * @param {string} outputDir - Directory to save thumbnail
 * @param {object} options - Thumbnail options
 * @returns {Promise<string>} - Path to generated thumbnail
 */
export const generateThumbnail = (filePath, outputDir = null, options = {}) => {
  return new Promise((resolve, reject) => {
    const thumbnailDir = outputDir || ensureThumbnailsDir();
    const thumbnailFilename = `thumb_${uuidv4()}_${Date.now()}.png`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Ensure output directory exists
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const size = options.size || THUMBNAIL_SIZE;
    const seek = options.seek || THUMBNAIL_SEEK_PERCENT;

    ffmpeg(filePath)
      .on('error', (err) => {
        logger.error('Thumbnail generation error:', err);
        reject(new Error(`Failed to generate thumbnail: ${err.message}`));
      })
      .on('end', () => {
        logger.info(`Thumbnail generated: ${thumbnailFilename}`);
        // Return relative path for storage
        resolve(`uploads/thumbnails/${thumbnailFilename}`);
      })
      .screenshots({
        count: 1,
        folder: thumbnailDir,
        filename: thumbnailFilename,
        size: size,
        timestamps: [seek],
      });
  });
};

/**
 * Process video: extract metadata and generate thumbnail
 * @param {string} filePath - Path to video file
 * @param {object} videoMetadata - Video metadata (title, description) for sensitivity analysis
 * @param {string} outputDir - Optional output directory for thumbnail
 * @returns {Promise<object>} - Processing result with duration, thumbnail path, and sensitivity status
 */
export const processVideo = async (filePath, videoMetadata = {}, outputDir = null) => {
  logger.info(`Processing video: ${filePath}`);

  try {
    // Get video metadata
    const metadata = await getVideoMetadata(filePath);
    logger.info(`Video metadata extracted: duration=${metadata.duration}s`);

    // Generate thumbnail
    let thumbnailPath = null;
    try {
      thumbnailPath = await generateThumbnail(filePath, outputDir);
      logger.info(`Thumbnail generated: ${thumbnailPath}`);
    } catch (thumbError) {
      // Thumbnail generation is not critical, continue without it
      logger.warn(`Thumbnail generation failed: ${thumbError.message}`);
    }

    // Analyze content sensitivity
    const sensitivityStatus = analyzeSensitivity(videoMetadata);
    logger.info(`Sensitivity analysis result: ${sensitivityStatus}`);

    return {
      duration: Math.round(metadata.duration || 0),
      thumbnailPath,
      sensitivityStatus,
      metadata: {
        width: metadata.video?.width,
        height: metadata.video?.height,
        fps: metadata.video?.fps,
        codec: metadata.video?.codec,
        bitrate: metadata.bitrate,
        hasAudio: !!metadata.audio,
      },
    };
  } catch (error) {
    logger.error('Video processing error:', error);
    throw new Error(`Video processing failed: ${error.message}`);
  }
};

/**
 * Check if FFmpeg is available
 * @returns {Promise<boolean>}
 */
export const checkFFmpegAvailable = () => {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      if (err) {
        logger.warn('FFmpeg not available:', err.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

export default {
  processVideo,
  getVideoMetadata,
  generateThumbnail,
  checkFFmpegAvailable,
  analyzeSensitivity,
};
