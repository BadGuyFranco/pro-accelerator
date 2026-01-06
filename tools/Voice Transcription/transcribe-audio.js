#!/usr/bin/env node
/**
 * Voice Recording Transcription Tool (LOCAL EXECUTION)
 *
 * This script transcribes audio files locally using Whisper via Transformers.js
 * NO API KEYS REQUIRED!
 *
 * Usage:
 *     node transcribe-audio.js <path_to_audio_file> [--model MODEL_SIZE]
 *
 * Model Sizes (trade-off between speed and accuracy):
 *     - tiny     : Fastest, least accurate
 *     - base     : Fast, good for most use cases [DEFAULT]
 *     - small    : Balanced
 *     - medium   : High accuracy (may be slow)
 *
 * Requirements:
 *     - Node.js 18+
 *     - ffmpeg installed (for audio conversion)
 *     - npm dependencies from package.json
 *     - No API keys needed - runs 100% locally!
 */

import { pipeline } from '@xenova/transformers';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import WaveFile from 'wavefile';

// Supported audio formats
const SUPPORTED_FORMATS = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.flac'];

// Available Whisper models (ONNX versions available via Transformers.js)
const WHISPER_MODELS = {
  'tiny': 'Xenova/whisper-tiny',
  'base': 'Xenova/whisper-base',
  'small': 'Xenova/whisper-small',
  'medium': 'Xenova/whisper-medium'
};

// Target sample rate for Whisper
const TARGET_SAMPLE_RATE = 16000;

/**
 * Convert audio file to 16kHz mono WAV using ffmpeg
 * @param {string} inputPath - Path to input audio file
 * @returns {string} Path to temporary WAV file
 */
function convertToWav(inputPath) {
  const tempWavPath = join(tmpdir(), `transcribe_${Date.now()}.wav`);
  
  console.log('Converting audio to WAV format...');
  
  try {
    // Use ffmpeg to convert to 16kHz mono WAV
    execSync(
      `ffmpeg -y -i "${inputPath}" -ar ${TARGET_SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${tempWavPath}"`,
      { stdio: 'pipe' }
    );
    return tempWavPath;
  } catch (e) {
    throw new Error(
      'Failed to convert audio. Make sure ffmpeg is installed.\n' +
      'Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)'
    );
  }
}

/**
 * Read WAV file and return Float32Array of samples
 * @param {string} wavPath - Path to WAV file
 * @returns {Float32Array} Audio samples normalized to [-1, 1]
 */
function readWavSamples(wavPath) {
  const buffer = readFileSync(wavPath);
  const wav = new WaveFile.WaveFile(buffer);
  
  // Convert to 32-bit float
  wav.toBitDepth('32f');
  
  // Get samples as Float64Array and convert to Float32Array
  const samples = wav.getSamples(false, Float64Array);
  return new Float32Array(samples);
}

/**
 * Transcribe audio file using local Whisper model
 * @param {string} audioFilePath - Path to the audio file
 * @param {string} modelSize - Whisper model size (tiny, base, small, medium)
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioFilePath, modelSize = 'base') {
  const modelName = WHISPER_MODELS[modelSize];
  if (!modelName) {
    throw new Error(`Unknown model size: ${modelSize}. Available: ${Object.keys(WHISPER_MODELS).join(', ')}`);
  }

  console.log(`\nLoading Whisper model '${modelSize}'...`);
  console.log('(First run will download the model - this may take a few minutes)');

  let tempWavPath = null;

  try {
    // Load the automatic speech recognition pipeline
    const transcriber = await pipeline('automatic-speech-recognition', modelName, {
      quantized: true // Use quantized model for better performance
    });

    // Convert audio to WAV format
    tempWavPath = convertToWav(audioFilePath);
    
    // Read WAV samples
    console.log('Reading audio samples...');
    const audioSamples = readWavSamples(tempWavPath);

    console.log(`Starting transcription of: ${audioFilePath}`);
    console.log(`Audio duration: ~${Math.round(audioSamples.length / TARGET_SAMPLE_RATE / 60)} minutes`);
    console.log('This may take a few minutes depending on file length...\n');

    // Transcribe the audio data (pass raw samples, not file path)
    const result = await transcriber(audioSamples, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
      return_timestamps: false,
      sampling_rate: TARGET_SAMPLE_RATE
    });

    const transcription = result.text.trim();

    console.log('Transcription completed successfully');
    return transcription;
  } catch (e) {
    console.error(`Error during transcription: ${e.message}`);
    throw e;
  } finally {
    // Clean up temp file
    if (tempWavPath && existsSync(tempWavPath)) {
      try {
        unlinkSync(tempWavPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Save transcription as text file in the same directory as the audio file
 * @param {string} audioFilePath - Original audio file path
 * @param {string} transcription - Full transcription text
 * @returns {string} Path to transcription file
 */
function saveOutputs(audioFilePath, transcription) {
  const baseName = basename(audioFilePath, extname(audioFilePath));
  const outputDir = dirname(audioFilePath);

  // Save full transcription as plain text in the same directory
  const transcriptionFile = join(outputDir, `${baseName}_transcription.txt`);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const content = `TRANSCRIPTION

Audio File: ${basename(audioFilePath)}
Date: ${now}

---

${transcription}`;

  writeFileSync(transcriptionFile, content, 'utf-8');

  console.log(`Transcription saved to: ${transcriptionFile}`);

  return transcriptionFile;
}

// CLI
function showHelp() {
  console.log(`
Voice Transcription Tool (LOCAL EXECUTION)
100% Local - No API Keys - No Cloud Services - Completely Free

Usage:
  node transcribe-audio.js <audio_file> [options]

Arguments:
  audio_file    Path to the audio file to transcribe

Options:
  --model SIZE  Whisper model size (default: base)
                Available: tiny, base, small, medium
  --help, -h    Show this help message

Model Comparison:
  tiny    : Fastest, good for quick transcriptions
  base    : Balanced speed and accuracy (default)
  small   : Better accuracy
  medium  : High accuracy (may be slow)

Supported Formats:
  mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, flac

Requirements:
  ffmpeg must be installed for audio conversion

Examples:
  node transcribe-audio.js recording.m4a
  node transcribe-audio.js meeting.mp3 --model small
`);
  process.exit(0);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const audioFilePath = args[0];
let modelSize = 'base';

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--model' && args[i + 1]) {
    modelSize = args[++i];
  }
}

// Validate file exists
if (!existsSync(audioFilePath)) {
  console.error(`Error: File not found: ${audioFilePath}`);
  process.exit(1);
}

// Validate file format
const fileExtension = extname(audioFilePath).toLowerCase();
if (!SUPPORTED_FORMATS.includes(fileExtension)) {
  console.error(`Error: Unsupported file format: ${fileExtension}`);
  console.error(`Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
  process.exit(1);
}

// Validate model
if (!WHISPER_MODELS[modelSize]) {
  console.error(`Error: Unknown model size: ${modelSize}`);
  console.error(`Available models: ${Object.keys(WHISPER_MODELS).join(', ')}`);
  process.exit(1);
}

console.log('\n' + '='.repeat(80));
console.log('VOICE TRANSCRIPTION TOOL (LOCAL EXECUTION)');
console.log('100% Local - No API Keys - No Cloud Services - Completely Free');
console.log('='.repeat(80) + '\n');

try {
  // Step 1: Transcribe audio locally
  const transcription = await transcribeAudio(audioFilePath, modelSize);

  // Step 2: Save transcription
  const transcriptionFile = saveOutputs(audioFilePath, transcription);

  console.log('\n' + '='.repeat(80));
  console.log('TRANSCRIPTION COMPLETED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log(`\nOutput file:`);
  console.log(`  Transcription: ${transcriptionFile}\n`);
  console.log('Next step:');
  console.log('  Use Cursor/Claude to create a comprehensive summary from the transcription\n');
} catch (e) {
  console.error(`\nError: ${e.message}`);
  process.exit(1);
}
