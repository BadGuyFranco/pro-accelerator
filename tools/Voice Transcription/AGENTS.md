# Voice Transcription

**100% Local Execution. No API Keys Required. Completely Free.**

Transcribe voice recordings and phone calls locally on your machine using OpenAI Whisper with GPU acceleration.

## Why Python (Not Node.js)

This tool uses Python instead of the standard Node.js stack because:

| | Node.js (@xenova/transformers) | Python (openai-whisper) |
|---|---|---|
| GPU Support | None (CPU only) | CUDA + MPS (Apple Silicon) |
| 60-min audio | ~60+ minutes | ~10 minutes |
| Speed | 1x real-time | 6-10x real-time |

The Node.js Whisper implementation cannot access GPU acceleration, making it 5-10x slower. For a 2-hour recording, that's the difference between 20 minutes and 3+ hours.

**This exception is documented in** `.cursor/rules/Always Apply.mdc` under "Approved Python Exceptions."

## Quick Start

```bash
python transcribe_audio.py <path_to_audio_file>
```

**With specific model:**
```bash
python transcribe_audio.py recording.m4a --model medium
```

**If the command fails,** see "Troubleshooting" section below.


## Key Features

- **GPU Accelerated:** Automatic detection of CUDA (NVIDIA) or MPS (Apple Silicon)
- **100% Local & Private:** Transcription runs on your machine (no data sent to the cloud)
- **Completely Free:** No API costs, no subscriptions, no hidden fees
- **No API Keys Required:** No account setup, no authentication needed
- **High-Quality Transcription:** Uses OpenAI's Whisper model running locally
- **FP16 Inference:** Half-precision for faster GPU processing
- **Progress Feedback:** Shows audio duration, estimated time, and processing speed


## Usage

### Basic Usage

```bash
python transcribe_audio.py <path_to_audio_file>
```

### Model Selection

Choose your Whisper model size (trade-off between speed and accuracy):

```bash
# Fastest, good for quick transcriptions
python transcribe_audio.py recording.m4a --model tiny

# Default - balanced speed and accuracy
python transcribe_audio.py recording.m4a --model base

# Better accuracy
python transcribe_audio.py recording.m4a --model small

# High accuracy (recommended for important meetings)
python transcribe_audio.py recording.m4a --model medium

# Best accuracy (slow but most precise)
python transcribe_audio.py recording.m4a --model large
```

### Model Comparison

| Model  | Size   | RAM   | GPU Speed  | Accuracy |
|--------|--------|-------|------------|----------|
| tiny   | ~75MB  | ~1GB  | ~30x RT    | Good     |
| base   | ~140MB | ~1GB  | ~20x RT    | Better   | (Default)
| small  | ~460MB | ~2GB  | ~10x RT    | Great    |
| medium | ~1.5GB | ~5GB  | ~5x RT     | Excellent|
| large  | ~3GB   | ~10GB | ~2x RT     | Best     |

*RT = Real-Time (e.g., 10x RT means 10 min audio in 1 min)*

### Example

```bash
python transcribe_audio.py ~/Downloads/meeting_recording.m4a --model medium
```


## Performance

### GPU vs CPU

| Device | 60-min audio (medium model) |
|--------|----------------------------|
| Apple Silicon (MPS) | ~10-15 minutes |
| NVIDIA GPU (CUDA) | ~5-10 minutes |
| CPU only | ~60+ minutes |

The script automatically detects and uses the best available device.

### Expected Output

```
Using GPU: Apple Silicon (MPS)
Using FP16 (half-precision) for faster inference

Loading Whisper model 'medium'...
Model loaded in 2.3s

Audio duration: 60.0 minutes
Estimated processing time: 9.0 minutes

Starting transcription of: meeting.m4a
Processing...

Transcription completed in 542.1s
Processing speed: 6.6x real-time
Total time (including model load): 544.4s
```


## Output

### Generated Files

The script generates a transcript file in the same directory as your audio file:

**`[filename]_transcription.txt`** - Full verbatim transcription

### Transcription File Format

```
TRANSCRIPTION

Audio File: meeting_recording.m4a  
Date: 2025-11-02 14:30:00

---

[Full verbatim transcription of the audio content...]
```

### Workflow

1. Run the transcription script on your audio file
2. Script creates the transcript.txt file
3. Use Cursor/Claude to read the transcript and create a comprehensive summary


## Supported Audio Formats

- MP3 (`.mp3`)
- MP4 (`.mp4`)
- MPEG (`.mpeg`)
- MPGA (`.mpga`)
- M4A (`.m4a`)
- WAV (`.wav`)
- WebM (`.webm`)
- OGG (`.ogg`)
- FLAC (`.flac`)


## Troubleshooting

### Setup Issues

**Requirements:** Python 3.8+, 2-3GB disk space (dependencies + models), 4GB+ RAM

**Install dependencies:**
```bash
pip install -r requirements.txt
```

Models download automatically on first use to `~/.cache/whisper/`

### Common Errors

**"Using CPU" when you have a GPU:**
- Mac: Ensure macOS 12.3+ and PyTorch 2.0+
- NVIDIA: Install CUDA toolkit and `pip install torch --index-url https://download.pytorch.org/whl/cu118`

**Slow performance:** Use smaller model (`--model base`), ensure GPU is being used

**Out of memory:** Use smaller model, close other apps

**Module not found:** `pip install -r requirements.txt`

**PyTorch errors:** `pip install torch torchaudio --upgrade`

### Verifying GPU Support

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"MPS available: {torch.backends.mps.is_available()}")
```


## Cost

**$0.00 - Completely Free!**

Unlike cloud services that charge per minute:
- No subscription fees
- No per-use costs
- Unlimited usage
- Complete privacy
