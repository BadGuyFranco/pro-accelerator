#!/usr/bin/env python3
"""
Voice Recording Transcription Tool (LOCAL EXECUTION)

This script transcribes audio files locally using Whisper - NO API KEYS REQUIRED!
After transcription, use Cursor/Claude to analyze and create comprehensive meeting notes.

Usage:
    python transcribe_audio.py <path_to_audio_file> [--model MODEL_SIZE]

Model Sizes (trade-off between speed and accuracy):
    - tiny     : Fastest, least accurate (~1GB RAM)
    - base     : Fast, good for most use cases (~1GB RAM) [DEFAULT]
    - small    : Balanced (~2GB RAM)
    - medium   : High accuracy (~5GB RAM)
    - large    : Best accuracy (~10GB RAM)

Requirements:
    - Python dependencies from requirements.txt
    - No API keys needed - runs 100% locally!
"""

import os
import sys
import argparse
import time
from pathlib import Path
from datetime import datetime
import torch
import whisper

# Supported audio formats (Whisper can handle these)
SUPPORTED_FORMATS = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.flac']

# Available Whisper models
WHISPER_MODELS = ['tiny', 'base', 'small', 'medium', 'large']


def get_device():
    """
    Detect the best available device for inference.
    Priority: CUDA (NVIDIA) > CPU
    
    Note: MPS (Apple Silicon) is disabled because Whisper uses sparse tensors
    which are not fully supported on MPS, causing runtime errors.
    """
    if torch.cuda.is_available():
        device = "cuda"
        device_name = torch.cuda.get_device_name(0)
        print(f"Using GPU: {device_name} (CUDA)")
    else:
        device = "cpu"
        # Note: MPS disabled due to sparse tensor compatibility issues
        if torch.backends.mps.is_available():
            print("Using CPU (MPS available but disabled due to Whisper compatibility)")
        else:
            print("Using CPU")
    return device


def get_audio_duration(audio_file_path):
    """Get audio duration in minutes using whisper's audio loading."""
    try:
        audio = whisper.load_audio(audio_file_path)
        duration_seconds = len(audio) / whisper.audio.SAMPLE_RATE
        return duration_seconds / 60
    except Exception:
        return None


def transcribe_audio(audio_file_path, model_size='base'):
    """
    Transcribe audio file using local Whisper model with GPU acceleration.
    
    Args:
        audio_file_path: Path to the audio file
        model_size: Whisper model size (tiny, base, small, medium, large)
        
    Returns:
        str: Transcribed text
    """
    # Detect best device
    device = get_device()
    
    # Determine if we should use FP16 (only reliable on CUDA)
    use_fp16 = device == "cuda"
    if use_fp16:
        print("Using FP16 (half-precision) for faster inference")
    else:
        print("Using FP32 (full precision)")
    
    print(f"\nLoading Whisper model '{model_size}'...")
    print("(First run will download the model - this may take a few minutes)")
    
    start_time = time.time()
    
    try:
        # Load Whisper model on the best available device
        model = whisper.load_model(model_size, device=device)
        
        load_time = time.time() - start_time
        print(f"Model loaded in {load_time:.1f}s")
        
        # Get audio duration for progress estimation
        duration_min = get_audio_duration(audio_file_path)
        if duration_min:
            print(f"\nAudio duration: {duration_min:.1f} minutes")
            # Estimate processing time (rough: 1 min audio = 5-15 sec processing with GPU)
            if device != "cpu":
                est_time = duration_min * 0.15  # ~15 sec per minute with GPU
            else:
                est_time = duration_min * 1.0   # ~1 min per minute with CPU
            print(f"Estimated processing time: {est_time:.1f} minutes")
        
        print(f"\nStarting transcription of: {audio_file_path}")
        print("Processing...\n")
        
        transcribe_start = time.time()
        
        # Transcribe with optimized parameters
        result = model.transcribe(
            audio_file_path,
            verbose=False,
            language='en',
            fp16=use_fp16,
            # Performance optimizations:
            condition_on_previous_text=True,  # Better coherence
            compression_ratio_threshold=2.4,  # Default, good balance
            logprob_threshold=-1.0,           # Default
            no_speech_threshold=0.6,          # Default
        )
        
        transcribe_time = time.time() - transcribe_start
        total_time = time.time() - start_time
        
        transcription = result['text'].strip()
        
        # Performance summary
        print(f"Transcription completed in {transcribe_time:.1f}s")
        if duration_min:
            speed_ratio = duration_min * 60 / transcribe_time
            print(f"Processing speed: {speed_ratio:.1f}x real-time")
        print(f"Total time (including model load): {total_time:.1f}s")
        
        return transcription
    
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        raise


def format_transcription(text):
    """
    Format transcription with line breaks for readability.
    Inserts line breaks after sentence-ending punctuation.
    
    Args:
        text: Raw transcription text
        
    Returns:
        str: Formatted text with line breaks
    """
    import re
    
    # Insert line breaks after sentence-ending punctuation followed by space
    # Handles: . ! ? followed by space and capital letter or quote
    formatted = re.sub(r'([.!?])\s+(?=[A-Z"\'])', r'\1\n\n', text)
    
    return formatted


def save_outputs(audio_file_path, transcription):
    """
    Save transcription as text file in the same directory as the audio file.
    
    Args:
        audio_file_path: Original audio file path
        transcription: Full transcription text
    
    Returns:
        Path: transcription_file path
    """
    # Get the base name without extension
    audio_path = Path(audio_file_path)
    base_name = audio_path.stem
    output_dir = audio_path.parent
    
    # Format transcription with line breaks for readability
    formatted_transcription = format_transcription(transcription)
    
    # Save full transcription as plain text in the same directory
    transcription_file = output_dir / f"{base_name}_transcription.txt"
    with open(transcription_file, 'w', encoding='utf-8') as f:
        f.write(f"TRANSCRIPTION\n\n")
        f.write(f"Audio File: {audio_path.name}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"---\n\n")
        f.write(formatted_transcription)
    
    print(f"\nTranscription saved to: {transcription_file}")
    
    return transcription_file


def main():
    """Main execution function."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description='Transcribe and summarize audio files locally (no API keys required)'
    )
    parser.add_argument(
        'audio_file',
        help='Path to the audio file to transcribe'
    )
    parser.add_argument(
        '--model',
        choices=WHISPER_MODELS,
        default='base',
        help='Whisper model size (default: base). Larger = more accurate but slower'
    )
    
    args = parser.parse_args()
    audio_file_path = args.audio_file
    model_size = args.model
    
    # Validate file exists
    if not os.path.exists(audio_file_path):
        print(f"Error: File not found: {audio_file_path}")
        sys.exit(1)
    
    # Validate file format
    file_extension = Path(audio_file_path).suffix.lower()
    if file_extension not in SUPPORTED_FORMATS:
        print(f"Error: Unsupported file format: {file_extension}")
        print(f"Supported formats: {', '.join(SUPPORTED_FORMATS)}")
        sys.exit(1)
    
    print(f"\n{'=' * 80}")
    print("VOICE TRANSCRIPTION TOOL (LOCAL EXECUTION)")
    print("100% Local - No API Keys - No Cloud Services - Completely Free")
    print(f"{'=' * 80}\n")
    
    try:
        # Step 1: Transcribe audio locally
        transcription = transcribe_audio(audio_file_path, model_size)
        
        # Step 2: Save transcription
        transcription_file = save_outputs(audio_file_path, transcription)
        
        print(f"\n{'=' * 80}")
        print("TRANSCRIPTION COMPLETED SUCCESSFULLY")
        print(f"{'=' * 80}")
        print(f"\nOutput file:")
        print(f"  Transcription: {transcription_file}\n")
        print("Next step:")
        print("  Use Cursor/Claude to create a comprehensive summary from the transcription\n")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
