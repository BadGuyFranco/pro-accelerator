#!/usr/bin/env node
/**
 * Image Generation Script using Google Gemini API (Nano Banana)
 * Uses Google's Gemini model for high-quality image generation
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_IMAGE_MODEL = process.env.GEMINI_MODEL;

// Supported aspect ratios
const SUPPORTED_ASPECT_RATIOS = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

/**
 * Generate image using Google Gemini API
 * @param {string} prompt - Text description of the image to generate
 * @param {Object} options - Generation options
 * @param {string} options.outputPath - Full path to save the image
 * @param {string} options.outputDir - Directory to save the image
 * @param {string} options.aspectRatio - Aspect ratio (1:1, 16:9, etc.)
 * @returns {Promise<string|null>} Path to saved image or null if failed
 */
async function generateImageGemini(prompt, options = {}) {
  const { outputPath = null, outputDir = null, aspectRatio = '1:1' } = options;

  if (!GEMINI_API_KEY) {
    console.log('Error: GEMINI_API_KEY not found!');
    console.log('Please add GEMINI_API_KEY to your .env file or set it as an environment variable');
    console.log('Get your key at: https://aistudio.google.com/apikey');
    return null;
  }

  if (!GEMINI_IMAGE_MODEL) {
    console.log('Error: GEMINI_MODEL not found!');
    console.log('Please add GEMINI_MODEL to your .env file');
    return null;
  }

  // Validate aspect ratio
  let validAspectRatio = aspectRatio;
  if (!SUPPORTED_ASPECT_RATIOS.includes(aspectRatio)) {
    console.log(`Warning: Unsupported aspect ratio '${aspectRatio}'. Using '1:1' instead.`);
    console.log(`   Supported ratios: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`);
    validAspectRatio = '1:1';
  }

  try {
    console.log(`Generating image with Google Gemini (${GEMINI_IMAGE_MODEL})...`);
    console.log(`Prompt: '${prompt}'`);
    console.log(`Aspect ratio: ${validAspectRatio}`);

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_IMAGE_MODEL,
      generationConfig: {
        responseModalities: ['Text', 'Image']
      }
    });

    console.log('Sending request to Gemini API...');

    // Generate the image
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        imageConfig: {
          aspectRatio: validAspectRatio
        }
      }
    });

    const response = result.response;

    if (!response || !response.candidates || response.candidates.length === 0) {
      console.log('Error: No response from Gemini API');
      return null;
    }

    // Extract image from response
    let imageData = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageData = Buffer.from(part.inlineData.data, 'base64');
        break;
      }
    }

    if (!imageData) {
      console.log('Error: No image data in response');
      // Check for text response (might indicate an error)
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(`   API Response: ${part.text}`);
        }
      }
      return null;
    }

    console.log('Processing image...');

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
      finalPath = join(outDir, `gemini_${timestamp}_${safePrompt}.png`);
    }

    // Ensure parent directory exists
    const parentDir = dirname(finalPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Save the image
    writeFileSync(finalPath, imageData);

    // Get file size
    const fileSize = statSync(finalPath).size / 1024;
    console.log(`Image saved to: ${finalPath}`);
    console.log(`File size: ${fileSize.toFixed(2)} KB`);

    return finalPath;
  } catch (e) {
    const errorMsg = e.message || String(e);

    if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('api key')) {
      console.log('Error: Invalid API key. Please check your GEMINI_API_KEY.');
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
Image Generation using Google Gemini API (Nano Banana)

Usage:
  node generate-image-gemini.js "prompt" [options]

Examples:
  node generate-image-gemini.js "a futuristic cityscape at sunset"
  node generate-image-gemini.js "professional headshot" --aspect-ratio 1:1
  node generate-image-gemini.js "landscape photo" --aspect-ratio 16:9
  node generate-image-gemini.js "product shot" --output-dir ./my_images --output product.png

Options:
  --aspect-ratio, -a    Aspect ratio (default: 1:1)
                        Supported: ${SUPPORTED_ASPECT_RATIOS.join(', ')}
  --output-dir, -d      Directory to save the image (default: ./generated_images)
  --output, -o          Output filename (default: auto-generated with timestamp)
  --help, -h            Show this help message

Requires: GEMINI_API_KEY and GEMINI_MODEL in .env file
Get your key at: https://aistudio.google.com/apikey
`);
  process.exit(0);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const prompt = args[0];
let aspectRatio = '1:1';
let outputDir = null;
let outputFile = null;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--aspect-ratio' || args[i] === '-a') && args[i + 1]) {
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
const result = await generateImageGemini(prompt, { outputPath, outputDir, aspectRatio });

if (result) {
  console.log(`\nSuccess! Image saved to: ${result}`);
} else {
  console.log('\nFailed to generate image');
  process.exit(1);
}

