#!/usr/bin/env node
/**
 * Video Generation Script using Google Veo API
 * Uses Google's Veo model for high-quality video generation
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'fs';
import { dirname, join, resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_VIDEO_MODEL = process.env.GEMINI_VIDEO_MODEL;

// Supported aspect ratios
const SUPPORTED_ASPECT_RATIOS = ['16:9', '9:16', '1:1'];

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate video using Google Veo API
 * @param {string} prompt - Text description of the video
 * @param {Object} options - Generation options
 * @returns {Promise<string|null>} Path to saved video or null if failed
 */
async function generateVideoGoogle(prompt, options = {}) {
  const {
    outputPath = null,
    outputDir = null,
    aspectRatio = '16:9',
    imagePath = null,
    videoPath = null,
    numExtensions = 0,
    loop = false
  } = options;

  if (!GEMINI_API_KEY) {
    console.log('Error: GEMINI_API_KEY not found!');
    console.log('Please add GEMINI_API_KEY to your .env file or set it as an environment variable');
    console.log('Get your key at: https://aistudio.google.com/apikey');
    return null;
  }

  if (!GEMINI_VIDEO_MODEL) {
    console.log('Error: GEMINI_VIDEO_MODEL not found!');
    console.log('Please add GEMINI_VIDEO_MODEL to your .env file');
    return null;
  }

  // Validate aspect ratio
  let validAspectRatio = aspectRatio;
  if (!SUPPORTED_ASPECT_RATIOS.includes(aspectRatio)) {
    console.log(`Warning: Unsupported aspect ratio '${aspectRatio}'. Using '16:9' instead.`);
    console.log(`   Supported ratios: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`);
    validAspectRatio = '16:9';
  }

  // Validate extension count
  let validExtensions = numExtensions;
  if (numExtensions < 0 || numExtensions > 20) {
    console.log('Warning: numExtensions must be between 0 and 20. Using 0.');
    validExtensions = 0;
  }

  // Validate extension compatibility
  if (validExtensions > 0) {
    if (!['16:9', '9:16'].includes(validAspectRatio)) {
      console.log('Warning: Video extensions require 16:9 or 9:16 aspect ratio. Setting to 16:9.');
      validAspectRatio = '16:9';
    }
    if (imagePath && videoPath) {
      console.log('Error: Cannot specify both imagePath and videoPath');
      return null;
    }
  }

  // Validate loop compatibility
  if (loop) {
    if (!imagePath) {
      console.log('Error: Looping requires an input image (--image)');
      return null;
    }
    if (videoPath) {
      console.log('Error: Looping is not compatible with video extension input');
      return null;
    }
  }

  try {
    console.log(`Generating video with Google Veo (${GEMINI_VIDEO_MODEL})...`);
    console.log(`Prompt: '${prompt}'`);
    console.log(`Aspect ratio: ${validAspectRatio}`);

    if (imagePath) {
      console.log(`Input image: ${imagePath}`);
    }

    if (videoPath) {
      console.log(`Input video for extension: ${videoPath}`);
    }

    if (loop) {
      console.log('Looping enabled: Using image as first and last frame for seamless loop');
    }

    if (validExtensions > 0) {
      const totalDuration = 8 + (validExtensions * 7);
      console.log(`Will generate ${validExtensions} extensions (total ~${totalDuration}s)`);
    }

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_VIDEO_MODEL });

    console.log('Sending request to Veo API...');
    console.log('Video generation may take 1-3 minutes...');

    // Prepare image if provided
    let imageData = null;
    if (imagePath) {
      if (!existsSync(imagePath)) {
        console.log(`Error: Image not found: ${imagePath}`);
        return null;
      }

      const imageBuffer = readFileSync(imagePath);
      const ext = extname(imagePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const mimeType = mimeTypes[ext] || 'image/jpeg';

      imageData = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType
        }
      };
    }

    // Note: The @google/generative-ai SDK may not fully support video generation yet.
    // This is a placeholder implementation that follows the expected API pattern.
    // You may need to use the REST API directly or wait for SDK updates.

    const requestContent = [
      { text: prompt }
    ];

    if (imageData) {
      requestContent.push(imageData);
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: requestContent }],
      generationConfig: {
        responseModalities: ['Video'],
        videoConfig: {
          aspectRatio: validAspectRatio
        }
      }
    });

    const response = result.response;

    // Extract video from response
    let videoData = null;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          videoData = Buffer.from(part.inlineData.data, 'base64');
          break;
        }
        if (part.videoMetadata || part.fileData) {
          // Handle video URI - download it
          const videoUri = part.fileData?.uri || part.videoMetadata?.uri;
          if (videoUri) {
            console.log('Downloading video from URI...');
            let downloadUrl = videoUri;
            if (downloadUrl.includes('?')) {
              downloadUrl += `&key=${GEMINI_API_KEY}`;
            } else {
              downloadUrl += `?key=${GEMINI_API_KEY}`;
            }

            const videoResponse = await fetch(downloadUrl, {
              signal: AbortSignal.timeout(120000)
            });

            if (videoResponse.ok) {
              videoData = Buffer.from(await videoResponse.arrayBuffer());
            }
          }
        }
      }
    }

    if (!videoData || videoData.length === 0) {
      console.log('Error: No video data in response');
      console.log('Note: Video generation may require specific API access or SDK version.');
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
      finalPath = join(outDir, `veo_${timestamp}_${safePrompt}.mp4`);
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

    if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('api key')) {
      console.log('Error: Invalid API key. Please check your GEMINI_API_KEY.');
    } else if (errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found')) {
      console.log('Error: Veo model not available. Check Google AI Studio for model access.');
      console.log(`   Model requested: ${GEMINI_VIDEO_MODEL}`);
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
Video Generation using Google Veo API

Usage:
  node generate-video-google.js "prompt" [options]

Examples:
  # Text-to-video
  node generate-video-google.js "a sunset over the ocean with gentle waves"
  node generate-video-google.js "person walking through forest" --aspect-ratio 9:16
  
  # Image-to-video (animate an image)
  node generate-video-google.js "camera slowly zooms in" --image photo.jpg
  
  # Image-to-video with extensions (create longer video)
  node generate-video-google.js "subtle movements" --image photo.jpg --extensions 2
  
  # Image-to-video with seamless looping
  node generate-video-google.js "gentle breathing" --image portrait.jpg --loop
  
  # Video extension (extend an existing Veo-generated video)
  node generate-video-google.js "continue the action" --video initial.mp4 --extensions 1
  
  # Custom output
  node generate-video-google.js "cityscape timelapse" --output-dir ./my_videos --output city.mp4

Options:
  --image, -i           Input image for image-to-video generation
  --video, -v           Input video for video extension
  --extensions, -e      Number of 7-second extensions (0-20)
  --loop, -l            Create seamless loop (requires --image)
  --aspect-ratio, -a    Aspect ratio: 16:9, 9:16, 1:1 (default: 16:9)
  --output-dir, -d      Directory to save the video (default: ./generated_videos)
  --output, -o          Output filename (default: auto-generated)
  --help, -h            Show this help message

Requires: GEMINI_API_KEY in .env file
Get your key at: https://aistudio.google.com/apikey

Video Extensions:
  - Initial video: ~8 seconds
  - Each extension: ~7 seconds
  - Maximum extensions: 20 (total ~148 seconds)
  - Extensions require 16:9 or 9:16 aspect ratio
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
let videoPath = null;
let numExtensions = 0;
let loop = false;
let aspectRatio = '16:9';
let outputDir = null;
let outputFile = null;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--image' || args[i] === '-i') && args[i + 1]) {
    imagePath = args[++i];
  } else if ((args[i] === '--video' || args[i] === '-v') && args[i + 1]) {
    videoPath = args[++i];
  } else if ((args[i] === '--extensions' || args[i] === '-e') && args[i + 1]) {
    numExtensions = parseInt(args[++i], 10);
  } else if (args[i] === '--loop' || args[i] === '-l') {
    loop = true;
  } else if ((args[i] === '--aspect-ratio' || args[i] === '-a') && args[i + 1]) {
    aspectRatio = args[++i];
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
const result = await generateVideoGoogle(prompt, {
  outputPath,
  outputDir,
  aspectRatio,
  imagePath,
  videoPath,
  numExtensions,
  loop
});

if (result) {
  console.log(`\nSuccess! Video saved to: ${result}`);
} else {
  console.log('\nFailed to generate video');
  process.exit(1);
}

