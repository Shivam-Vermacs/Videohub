/**
 * Reprocess Videos Script
 * -----------------------
 * Run this to regenerate thumbnails for existing videos.
 * Usage: node scripts/reprocess-videos.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import after env is loaded
import Video from '../src/models/Video.js';
import { processVideo, checkFFmpegAvailable } from '../src/utils/videoProcessor.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform';

async function reprocessVideos() {
  console.log('🎬 Video Reprocessing Script');
  console.log('============================\n');

  // Check FFmpeg
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.error('❌ FFmpeg is not available. Please install FFmpeg first.');
    process.exit(1);
  }
  console.log('✅ FFmpeg is available\n');

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Get all videos without thumbnails
  const videos = await Video.find({
    isDeleted: false,
    $or: [
      { thumbnailPath: null },
      { thumbnailPath: '' },
      { duration: null },
      { duration: 0 },
    ],
  });

  console.log(`Found ${videos.length} videos to reprocess\n`);

  let success = 0;
  let failed = 0;

  for (const video of videos) {
    console.log(`Processing: ${video.title} (${video.filename})`);
    
    // Check if file exists
    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', video.filename);
    
    if (!fs.existsSync(videoPath)) {
      console.log(`  ⚠️  File not found: ${videoPath}`);
      failed++;
      continue;
    }

    try {
      const result = await processVideo(videoPath);
      
      // Update video document
      video.duration = result.duration;
      video.thumbnailPath = result.thumbnailPath;
      video.status = 'completed';
      video.processingProgress = 100;
      
      if (result.metadata) {
        video.metadata = {
          ...video.metadata,
          width: result.metadata.width,
          height: result.metadata.height,
          fps: result.metadata.fps,
          codec: result.metadata.codec,
          bitrate: result.metadata.bitrate,
        };
      }
      
      await video.save();
      
      console.log(`  ✅ Done - Duration: ${result.duration}s, Thumbnail: ${result.thumbnailPath ? 'Yes' : 'No'}`);
      success++;
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n============================');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('============================\n');

  await mongoose.disconnect();
  process.exit(0);
}

reprocessVideos().catch(console.error);
