# Voice Transcription

**100% Local Execution. No API Keys Required. Completely Free.**

Transcribe voice recordings and phone calls locally on your machine using OpenAI Whisper.

## Quick Start

```bash
node transcribe-audio.js <path_to_audio_file>
```

**With specific model:**
```bash
node transcribe-audio.js recording.m4a --model base
```

**If the command fails,** see "Troubleshooting" section below.


## Key Features

- **100% Local & Private:** Transcription runs on your machine (no data sent to the cloud)
- **Completely Free:** No API costs, no subscriptions, no hidden fees
- **No API Keys Required:** No account setup, no authentication needed
- **High-Quality Transcription:** Uses OpenAI's Whisper model running locally
- **Cursor Integration:** After transcription, use Cursor/Claude for intelligent note-taking
- **Multiple Format Support:** Works with mp3, mp4, m4a, wav, webm, ogg, flac
- **Organized Output:** Saves markdown file in the same directory as the audio file


## Usage

### Basic Usage

```bash
node transcribe-audio.js <path_to_audio_file>
```

### Model Selection

Choose your Whisper model size (trade-off between speed and accuracy):

```bash
# Fastest, good for quick transcriptions
node transcribe-audio.js recording.m4a --model tiny

# Default - balanced speed and accuracy
node transcribe-audio.js recording.m4a --model base

# Better accuracy
node transcribe-audio.js recording.m4a --model small

# High accuracy (recommended for important meetings)
node transcribe-audio.js recording.m4a --model medium
```

### Model Comparison

| Model  | Speed      | Accuracy |
|--------|------------|----------|
| tiny   | Fastest    | Good     |
| base   | Fast       | Better   | (Default)
| small  | Moderate   | Great    |
| medium | Slow       | Excellent|

Note: The `large` model is not available in the Node.js version due to ONNX limitations.

### Example

```bash
node transcribe-audio.js ~/Downloads/meeting_recording.m4a
```


## Output

### Generated Files

The script generates a transcript file in the same directory as your audio file:

**`[filename]_transcription.txt`** - Full verbatim transcription

Example output structure:
```
~/Downloads/
  meeting_recording.m4a
  meeting_recording_transcription.txt
```

### After Transcription

After the script completes, use Cursor/Claude to automatically create a comprehensive summary from the transcription.

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


## Performance & Timing

Typical processing times (using `base` model):

- **10-minute audio:** ~2-3 minutes processing
- **30-minute audio:** ~5-7 minutes processing
- **60-minute audio:** ~10-15 minutes processing

*Times vary based on CPU/GPU and model size chosen*


## Advanced Usage

### Batch Processing Multiple Files

Create a bash script:

```bash
#!/bin/bash
for file in /path/to/recordings/*.m4a; do
    node transcribe-audio.js "$file" --model base
done
```


## FAQ

**Q: Does this work offline?**  
A: Yes! After initial model downloads, it works completely offline.

**Q: How accurate is the transcription?**  
A: Very accurate. Whisper is state-of-the-art. Use `medium` or `large` models for best results.

**Q: Can it handle multiple speakers?**  
A: Yes, it transcribes all audio. The transcript won't label speakers, but all speech is captured.

**Q: What languages are supported?**  
A: Whisper supports 99 languages. The script defaults to English but can auto-detect language.

**Q: Is my data sent anywhere?**  
A: No. Everything runs locally on your machine. Zero data leaves your computer.


## Privacy & Security

✅ **100% Private:** All processing happens on your machine  
✅ **No Cloud Upload:** Your audio never leaves your computer  
✅ **No Accounts:** No sign-ups or tracking  
✅ **Open Source:** Uses open-source Whisper model


## Troubleshooting

### Setup Issues

**Requirements:** Node.js 18+, 2-3GB disk space (dependencies + models), 4GB+ RAM

**Install dependencies:** Run `npm install` in the Voice Transcription directory.

Models download automatically on first use to `~/.cache/huggingface/`

### Common Errors

**Slow performance:** Use smaller model (`--model tiny` or `--model base`), close other apps

**Unsupported file format:** Convert with `ffmpeg -i input.avi output.mp3`

**Poor transcription quality:** Use clear audio, try larger model (`--model medium`)

**Out of memory:** Use smaller model, close other apps, process shorter segments

**Node not found:** Install Node.js from nodejs.org or use `brew install node` (macOS)

**Cannot find module:** Run `npm install` in the Voice Transcription directory

**Model download failed:** Check internet, ensure `~/.cache/` is writable

### System Requirements by Model

| Model | RAM | Disk |
|-------|-----|------|
| tiny/base | 4GB | 2GB |
| medium | 8GB | 5GB |


## Cost

**$0.00 - Completely Free!**

Unlike cloud services that charge per minute:
- No subscription fees
- No per-use costs
- Unlimited usage
- Complete privacy
