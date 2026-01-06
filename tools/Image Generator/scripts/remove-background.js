#!/usr/bin/env node
/**
 * Background Removal Tool using Replicate API
 * Uses the 'cjwbw/rembg' model to remove backgrounds from images
 */

import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { dirname, basename, extname, resolve, join } from 'path';
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
const REMBG_MODEL = process.env.REPLICATE_REMBG_MODEL;

/**
 * Remove background from an image using Replicate's rembg model
 * @param {string} inputPath - Path to local input image
 * @param {string} outputPath - Path to save the result (optional)
 * @returns {Promise<string|null>} Path to saved image or null if failed
 */
async function removeBackground(inputPath, outputPath = null) {
  if (!REPLICATE_API_TOKEN) {
    console.log('Error: REPLICATE_API_TOKEN not configured');
    return null;
  }

  if (!REMBG_MODEL) {
    console.log('Error: REPLICATE_REMBG_MODEL not configured');
    console.log('Please add REPLICATE_REMBG_MODEL to your .env file');
    return null;
  }

  if (!existsSync(inputPath)) {
    console.log(`Error: Input file not found: ${inputPath}`);
    return null;
  }

  try {
    console.log(`Removing background from: ${inputPath}`);
    console.log(`Using model: ${REMBG_MODEL.split(':')[0]}`);

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

    // Read the image file and convert to base64 data URI
    const imageBuffer = readFileSync(inputPath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = inputPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64}`;

    console.log('Sending image to Replicate API...');

    const output = await replicate.run(REMBG_MODEL, {
      input: {
        image: dataUri,
        model: 'u2net_human_seg',
        return_mask: false,
        alpha_matting: true,
        alpha_matting_foreground_threshold: 250,
        alpha_matting_background_threshold: 20,
        alpha_matting_erode_size: 20
      }
    });

    if (!output) {
      console.log('Error: No output from model');
      return null;
    }

    // The output is a URL string
    const imageUrl = output;

    console.log('Downloading result...');
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.log(`Error downloading result: HTTP ${response.status}`);
      return null;
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());

    // Generate output path if not provided
    let finalPath = outputPath;
    if (!finalPath) {
      const dir = dirname(inputPath);
      const name = basename(inputPath, extname(inputPath));
      finalPath = join(dir, `${name}_nobg.png`);
    }

    // Save the result
    writeFileSync(finalPath, resultBuffer);

    const fileSize = statSync(finalPath).size / 1024;
    console.log(`Background removed! Saved to: ${finalPath}`);
    console.log(`File size: ${fileSize.toFixed(2)} KB`);

    return finalPath;
  } catch (e) {
    console.log(`Error: ${e.message}`);
    return null;
  }
}

/**
 * Full pipeline: Remove background -> Resize to 1000px wide (maintain aspect)
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save result (optional)
 * @returns {Promise<boolean>} Success status
 */
async function processHeadshot(inputPath, outputPath = null) {
  // 1. Remove background
  const tempOutput = await removeBackground(inputPath, outputPath);

  if (!tempOutput) {
    return false;
  }

  // 2. Resize to 1000px wide
  try {
    console.log('Resizing to 1000px width...');

    const image = sharp(tempOutput);
    const metadata = await image.metadata();

    const targetWidth = 1000;
    const aspectRatio = metadata.height / metadata.width;
    const targetHeight = Math.round(targetWidth * aspectRatio);

    await image
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(tempOutput + '.tmp');

    // Rename temp file to final
    const { renameSync } = await import('fs');
    renameSync(tempOutput + '.tmp', tempOutput);

    console.log(`Resized to ${targetWidth}x${targetHeight}`);
    console.log(`Final processed headshot ready: ${tempOutput}`);
    return true;
  } catch (e) {
    console.log(`Error resizing image: ${e.message}`);
    return false;
  }
}

// CLI
function showHelp() {
  console.log(`
Background Removal Tool using Replicate API

Usage:
  node remove-background.js input_image.jpg [output_path.png]

Arguments:
  input_image     Path to the input image
  output_path     Path to save the result (optional, defaults to input_nobg.png)

The tool removes the background and resizes to 1000px width (maintaining aspect ratio).
Output is always PNG format to preserve transparency.

Requires: REPLICATE_API_TOKEN and REPLICATE_REMBG_MODEL in .env file
`);
  process.exit(0);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const inputFile = args[0];
const outputFile = args[1] || null;

const success = await processHeadshot(inputFile, outputFile);
process.exit(success ? 0 : 1);

