#!/usr/bin/env node
/**
 * Image Generation Script using X.ai (Grok) API
 * Uses Grok's image generation model for high-quality image generation
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
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
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL;
const XAI_API_URL = 'https://api.x.ai/v1/images/generations';

/**
 * Generate image using X.ai (Grok) API
 * @param {string} prompt - Text description of the image to generate
 * @param {Object} options - Generation options
 * @param {string} options.outputPath - Full path to save the image
 * @param {string} options.outputDir - Directory to save the image
 * @param {number} options.n - Number of images to generate (1-10)
 * @returns {Promise<string|null>} Path to saved image or null if failed
 */
async function generateImageXai(prompt, options = {}) {
  const { outputPath = null, outputDir = null, n = 1 } = options;

  if (!XAI_API_KEY) {
    console.log('Error: XAI_API_KEY not found!');
    console.log('Please add XAI_API_KEY to your .env file or set it as an environment variable');
    console.log('Get your key at: https://console.x.ai');
    return null;
  }

  if (!XAI_IMAGE_MODEL) {
    console.log('Error: XAI_IMAGE_MODEL not found!');
    console.log('Please add XAI_IMAGE_MODEL to your .env file');
    return null;
  }

  try {
    console.log(`Generating image with X.ai (${XAI_IMAGE_MODEL})...`);
    console.log(`Prompt: '${prompt}'`);

    console.log('Sending request to X.ai API...');

    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: XAI_IMAGE_MODEL,
        prompt,
        n,
        response_format: 'url'
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    });

    if (!response.ok) {
      console.log(`Error: API returned status ${response.status}`);
      try {
        const errorDetail = await response.json();
        console.log(`   Detail: ${JSON.stringify(errorDetail)}`);
      } catch {
        console.log(`   Response: ${await response.text()}`);
      }
      return null;
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      console.log('Error: No image data in response');
      return null;
    }

    const imageUrl = result.data[0].url;

    if (!imageUrl) {
      console.log('Error: No image URL in response');
      return null;
    }

    // Check for revised prompt
    const revisedPrompt = result.data[0].revised_prompt;
    if (revisedPrompt && revisedPrompt !== prompt) {
      console.log(`Revised prompt: '${revisedPrompt}'`);
    }

    console.log('Downloading image...');

    const imgResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(60000)
    });

    if (!imgResponse.ok) {
      console.log(`Error downloading image: HTTP ${imgResponse.status}`);
      return null;
    }

    const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Image generated (${metadata.width}x${metadata.height})`);

    // Determine output path
    let finalPath;
    if (outputPath) {
      finalPath = outputPath;
    } else {
      const outDir = outputDir || 'generated_images';
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const safePrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/ /g, '-');
      finalPath = join(outDir, `xai_${timestamp}_${safePrompt}.png`);
    }

    // Ensure parent directory exists
    const parentDir = dirname(finalPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Save the image
    await sharp(imageBuffer).png({ compressionLevel: 9 }).toFile(finalPath);

    const fileSize = statSync(finalPath).size / 1024;
    console.log(`Image saved to: ${finalPath}`);
    console.log(`File size: ${fileSize.toFixed(2)} KB`);

    return finalPath;
  } catch (e) {
    if (e.name === 'TimeoutError') {
      console.log('Error: Request timed out. Please try again.');
      return null;
    }

    const errorMsg = e.message || String(e);

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      console.log('Error: Invalid API key. Please check your XAI_API_KEY.');
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
Image Generation using X.ai (Grok) API

Usage:
  node generate-image-xai.js "prompt" [options]

Examples:
  node generate-image-xai.js "a futuristic cityscape at sunset"
  node generate-image-xai.js "professional headshot" --output-dir ./my_images
  node generate-image-xai.js "product shot" --output product.png

Options:
  --output-dir, -d    Directory to save the image (default: ./generated_images)
  --output, -o        Output filename (default: auto-generated with timestamp)
  --count, -n         Number of images to generate (1-10, default: 1)
  --help, -h          Show this help message

Note: X.ai does not support aspect ratio or size parameters.
      Images are generated at the model's native resolution.

Requires: XAI_API_KEY in .env file or as environment variable
Get your key at: https://console.x.ai
`);
  process.exit(0);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const prompt = args[0];
let outputDir = null;
let outputFile = null;
let count = 1;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--output-dir' || args[i] === '-d') && args[i + 1]) {
    outputDir = args[++i];
  } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputFile = args[++i];
  } else if ((args[i] === '--count' || args[i] === '-n') && args[i + 1]) {
    count = Math.min(10, Math.max(1, parseInt(args[++i], 10)));
  }
}

// Determine output path
let outputPath = null;
if (outputFile) {
  outputPath = outputDir ? join(outputDir, outputFile) : outputFile;
}

// Run generation
const result = await generateImageXai(prompt, { outputPath, outputDir, n: count });

if (result) {
  console.log(`\nSuccess! Image saved to: ${result}`);
} else {
  console.log('\nFailed to generate image');
  process.exit(1);
}

