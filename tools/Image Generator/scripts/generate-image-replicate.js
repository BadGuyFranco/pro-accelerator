#!/usr/bin/env node
/**
 * Image Generation Script using Replicate API
 * Uses your configured image model for high-quality image generation
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';
import sharp from 'sharp';

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const memoryEnvPath = resolve(__dirname, '../../../../memory/Image Generator/.env');

if (existsSync(memoryEnvPath)) {
  config({ path: memoryEnvPath });
} else {
  console.log(`Warning: .env not found at ${memoryEnvPath}`);
  console.log('   Please create /memory/Image Generator/.env with your API keys');
}

// Configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_IMAGE_MODEL = process.env.REPLICATE_IMAGE_MODEL;

// Aspect ratio mappings
const ASPECT_RATIO_MAP = {
  '1:1': { ratio: 1.0, width: 1024, height: 1024 },
  '16:9': { ratio: 1.778, width: 1344, height: 768 },
  '21:9': { ratio: 2.333, width: 1536, height: 640 },
  '4:3': { ratio: 1.333, width: 1152, height: 896 },
  '3:2': { ratio: 1.5, width: 1216, height: 832 },
  '9:16': { ratio: 0.5625, width: 768, height: 1344 }
};

/**
 * Generate image using Replicate API
 * @param {string} prompt - Text description of the image to generate
 * @param {Object} options - Generation options
 * @param {string} options.outputPath - Full path to save the image
 * @param {number} options.width - Target width (default: 1024)
 * @param {number} options.height - Target height (default: 1024)
 * @returns {Promise<string|null>} Path to saved image or null if failed
 */
async function generateImageReplicate(prompt, options = {}) {
  const { outputPath = null, width = 1024, height = 1024 } = options;

  if (!REPLICATE_API_TOKEN) {
    console.log('Error: REPLICATE_API_TOKEN not configured');
    return null;
  }

  if (!REPLICATE_IMAGE_MODEL) {
    console.log('Error: REPLICATE_IMAGE_MODEL not configured');
    console.log('Please add REPLICATE_IMAGE_MODEL to your .env file');
    return null;
  }

  // Calculate aspect ratio and find closest match
  const requestedRatio = width / height;
  let closestRatio = '1:1';
  let minDiff = Infinity;

  for (const [key, value] of Object.entries(ASPECT_RATIO_MAP)) {
    const diff = Math.abs(value.ratio - requestedRatio);
    if (diff < minDiff) {
      minDiff = diff;
      closestRatio = key;
    }
  }

  const { width: nativeWidth, height: nativeHeight } = ASPECT_RATIO_MAP[closestRatio];
  const needsResize = nativeWidth !== width || nativeHeight !== height;

  console.log(`Requested: ${width}x${height} (ratio: ${requestedRatio.toFixed(2)})`);
  console.log(`Using aspect ratio: ${closestRatio} (native: ${nativeWidth}x${nativeHeight})`);

  try {
    console.log(`Generating image with Replicate ${REPLICATE_IMAGE_MODEL.split('/').pop()}...`);
    console.log(`Prompt: '${prompt}'`);

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

    console.log('Sending request to Replicate API...');

    const output = await replicate.run(REPLICATE_IMAGE_MODEL, {
      input: {
        prompt,
        aspect_ratio: closestRatio,
        steps: 50,
        guidance: 3.0,
        safety_tolerance: 2,
        output_format: 'png',
        output_quality: 100
      }
    });

    if (!output) {
      console.log('Error: No image data in response');
      return null;
    }

    // Extract image URL from various output formats
    let imageUrl = null;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output.url) {
      imageUrl = output.url;
    } else if (output[Symbol.iterator]) {
      const firstItem = [...output][0];
      imageUrl = firstItem?.url || firstItem;
    }

    if (!imageUrl) {
      console.log(`Error: Could not extract image URL from output (type: ${typeof output})`);
      return null;
    }

    console.log('Image generated');
    console.log('Downloading image...');

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.log(`Error downloading image: HTTP ${response.status}`);
      return null;
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log('Image downloaded');

    // Process with sharp
    let image = sharp(imageBuffer);
    const metadata = await image.metadata();
    console.log(`Native size: ${metadata.width}x${metadata.height}`);

    // Resize if needed
    if (needsResize) {
      console.log(`Resizing to target dimensions: ${width}x${height}`);
      image = image.resize(width, height, { fit: 'fill' });
    }

    // Generate output path if not provided
    let finalPath = outputPath;
    if (!finalPath) {
      const outDir = 'generated_images';
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const safePrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/ /g, '-');
      finalPath = join(outDir, `${timestamp}_${safePrompt}_replicate.png`);
    }

    // Ensure parent directory exists
    const parentDir = dirname(finalPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Save the image
    await image.png({ compressionLevel: 9 }).toFile(finalPath);

    const fileSize = statSync(finalPath).size / 1024;
    console.log(`Image saved to: ${finalPath}`);
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
      console.log(`Error generating image: ${e.name}: ${errorMsg}`);
      console.error(e.stack);
    }

    return null;
  }
}

// CLI
function showHelp() {
  console.log(`
Image Generation using Replicate API

Usage:
  node generate-image-replicate.js "prompt" [output_path] [width] [height]

Examples:
  node generate-image-replicate.js "A futuristic cityscape at dusk, cyberpunk style"
  node generate-image-replicate.js "a professional podcast studio with modern design"
  node generate-image-replicate.js "entrepreneur working on laptop" custom_image.png
  node generate-image-replicate.js "startup office" output.png 1440 810

Model: ${REPLICATE_IMAGE_MODEL || '(not configured)'}

Note: Most models use aspect ratio presets (1:1, 16:9, 21:9, 4:3, 3:2, 9:16)
      Images are generated at native resolution and resized to target dimensions

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
const outputPath = args[1] || null;
const width = args[2] ? parseInt(args[2], 10) : 1024;
const height = args[3] ? parseInt(args[3], 10) : 1024;

// Run generation
const result = await generateImageReplicate(prompt, { outputPath, width, height });

if (result) {
  console.log(`\nSuccess! Image saved to: ${result}`);
} else {
  console.log('\nFailed to generate image');
  process.exit(1);
}

