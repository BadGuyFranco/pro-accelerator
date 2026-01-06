#!/usr/bin/env node
/**
 * Video Generation Script using Replicate API
 * Uses Google Veo 3 model for high-quality video generation
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { dirname, join, resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const memoryEnvPath = resolve(__dirname, '../../../../memory/Video Generator/.env');

if (existsSync(memoryEnvPath)) {
  config({ path: memoryEnvPath });
} else {
  console.log(`Warning: .env not found at ${memoryEnvPath}`);
  console.log('   Please create /memory/Video Generator/.env with your API keys');
}

// Configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_VIDEO_MODEL = process.env.REPLICATE_VIDEO_MODEL;

/**
 * Generate video using Replicate API
 * @param {string} prompt - Text description of the video to generate
 * @param {Object} options - Generation options
 * @param {string} options.outputPath - Full path to save the video
 * @param {string} options.outputDir - Directory to save the video
 * @param {string} options.imagePath - Path to input image for image-to-video
 * @returns {Promise<string|null>} Path to saved video or null if failed
 */
async function generateVideoReplicate(prompt, options = {}) {
  const { outputPath = null, outputDir = null, imagePath = null } = options;

  if (!REPLICATE_API_TOKEN) {
    console.log('Error: REPLICATE_API_TOKEN not found!');
    console.log('Please add REPLICATE_API_TOKEN to your .env file');
    return null;
  }

  if (!REPLICATE_VIDEO_MODEL) {
    console.log('Error: REPLICATE_VIDEO_MODEL not found!');
    console.log('Please add REPLICATE_VIDEO_MODEL to your .env file');
    return null;
  }

  try {
    console.log(`Generating video with Replicate (${REPLICATE_VIDEO_MODEL})...`);
    console.log(`Prompt: '${prompt}'`);

    if (imagePath) {
      console.log(`Input image: ${imagePath}`);
    }

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

    console.log('Sending request to Replicate API...');
    console.log('Video generation may take 1-2 minutes...');

    // Prepare input parameters
    const inputParams = { prompt };

    // Add image for image-to-video if provided
    if (imagePath) {
      if (!existsSync(imagePath)) {
        console.log(`Error: Image not found: ${imagePath}`);
        return null;
      }

      const imageBuffer = readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');
      const ext = extname(imagePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      inputParams.first_frame_image = `data:${mimeType};base64,${base64}`;
    }

    const output = await replicate.run(REPLICATE_VIDEO_MODEL, { input: inputParams });

    if (!output) {
      console.log('Error: No video data in response');
      return null;
    }

    // Extract video URL from various output formats
    let videoUrl = null;
    if (Array.isArray(output) && output.length > 0) {
      videoUrl = output[0];
    } else if (typeof output === 'string') {
      videoUrl = output;
    } else if (output.url) {
      videoUrl = output.url;
    } else if (output[Symbol.iterator]) {
      const firstItem = [...output][0];
      videoUrl = firstItem?.url || firstItem;
    }

    if (!videoUrl) {
      console.log(`Error: Could not extract video URL from output (type: ${typeof output})`);
      return null;
    }

    console.log('Video generated');
    console.log('Downloading video...');

    const response = await fetch(videoUrl, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) {
      console.log(`Error downloading video: HTTP ${response.status}`);
      return null;
    }

    const videoData = Buffer.from(await response.arrayBuffer());

    if (videoData.length === 0) {
      console.log('Error: Empty video data received');
      return null;
    }

    console.log(`Video downloaded (${(videoData.length / 1024).toFixed(1)} KB)`);

    // Determine output path
    let finalPath;
    if (outputPath) {
      finalPath = outputPath;
    } else {
      const outDir = outputDir || 'generated_videos';
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const safePrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/ /g, '-');
      finalPath = join(outDir, `${timestamp}_${safePrompt}_replicate.mp4`);
    }

    // Ensure parent directory exists
    const parentDir = dirname(finalPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Save the video
    writeFileSync(finalPath, videoData);

    const fileSize = statSync(finalPath).size / 1024;
    console.log(`Video saved to: ${finalPath}`);
    console.log(`File size: ${fileSize.toFixed(2)} KB`);

    return finalPath;
  } catch (e) {
    const errorMsg = e.message || String(e);

    if (errorMsg.includes('401') || errorMsg.includes('Authentication')) {
      console.log('Error: Invalid API token. Please check your REPLICATE_API_TOKEN.');
    } else if (errorMsg.toLowerCase().includes('rate') || errorMsg.includes('429')) {
      console.log('Error: Rate limit exceeded. Please wait a moment and try again.');
    } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('connection')) {
      console.log('Error: Network error. Please check your internet connection.');
    } else {
      console.log(`Error generating video: ${e.name}: ${errorMsg}`);
      console.error(e.stack);
    }

    return null;
  }
}

// CLI
function showHelp() {
  console.log(`
Video Generation using Replicate API

Usage:
  node generate-video-replicate.js "prompt" [options]

Examples:
  # Text-to-video
  node generate-video-replicate.js "a person walking through a forest"
  
  # Image-to-video (animate an image)
  node generate-video-replicate.js "camera slowly zooms in" --image photo.jpg
  
  # Custom output
  node generate-video-replicate.js "sunset timelapse" --output-dir ./videos --output sunset.mp4

Options:
  --image, -i         Input image for image-to-video generation
  --output-dir, -d    Directory to save the video (default: ./generated_videos)
  --output, -o        Output filename (default: auto-generated with timestamp)
  --help, -h          Show this help message

Requires: REPLICATE_API_TOKEN in .env file
`);
  process.exit(0);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const prompt = args[0];
let imagePath = null;
let outputDir = null;
let outputFile = null;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--image' || args[i] === '-i') && args[i + 1]) {
    imagePath = args[++i];
  } else if ((args[i] === '--output-dir' || args[i] === '-d') && args[i + 1]) {
    outputDir = args[++i];
  } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputFile = args[++i];
  }
}

// Determine output path
let outputPath = null;
if (outputFile) {
  outputPath = outputDir ? join(outputDir, outputFile) : outputFile;
}

// Run generation
const result = await generateVideoReplicate(prompt, { outputPath, outputDir, imagePath });

if (result) {
  console.log(`\nSuccess! Video saved to: ${result}`);
} else {
  console.log('\nFailed to generate video');
  process.exit(1);
}

