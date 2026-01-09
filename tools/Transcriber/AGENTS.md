# Transcriber

**100% Local Execution. No API Keys Required. Completely Free.**

Transcribe voice recordings and phone calls locally using OpenAI Whisper with GPU acceleration, then optionally produce comprehensive summaries with analysis.

## Objective

Convert audio to text and, when requested, produce summaries that capture every key point, nuanced detail, and emotional context. Summaries should be comprehensive enough that someone who didn't hear the recording understands exactly what happened.

## Pre-Transcription Workflow

**Before running the transcription script, ask the user:**

> "What output do you need?
> 1. **Raw transcript only** - Just the verbatim text
> 2. **Comprehensive summary** - Organized summary with all key points
> 3. **Both** - Transcript file plus summary
> 
> Which would you like?"

**Then run the transcription.** After the script completes, proceed based on their choice.

## Output Modes

### Mode 1: Raw Transcript Only

Run the script, deliver the transcript file. Done.

### Mode 2: Comprehensive Summary

After transcription, read the transcript and produce a summary following the Comprehensive Summary Format below. Analysis is included by default at the top.

### Mode 3: Both

Deliver the transcript file location, then produce the summary with analysis.

## Comprehensive Summary Format

The summary must capture everything important. Missing a key point or nuanced detail is a failure.

**Analysis comes first.** It's the highest-value section; readers should see it immediately.

```markdown
# [Recording Title/Topic]

**Date:** YYYY-MM-DD
**Duration:** [X minutes]
**Participants:** [Names/roles if identifiable]

## Analysis

### Critical Points
[What I consider the most important takeaways and why. What would be costly to miss or forget.]

### Emotional and Motivational Dynamics
[Tone shifts, tension, enthusiasm, hesitation, frustration, agreement patterns. What the emotional subtext reveals about positions and relationships.]

### Fact-Checking and Research

#### Verified
- [Claim]: [Verification source and result]

#### Looked Up
- "[Someone said they needed to look this up]": [What I found]

#### Unverified
- [Claim that couldn't be verified]: [Why, and what would be needed to verify]

### References Mentioned
[Any videos, articles, books, quotes, or sources mentioned in the recording, with links or citations where possible]

## Summary

### Overview
[2-3 sentence summary of what this recording is about and the main outcome]

### Key Points

#### [Topic/Theme 1]
- [Specific point with context]
- [Specific point with context]

#### [Topic/Theme 2]
- [Specific point with context]
- [Specific point with context]

[Continue for all major topics discussed]

### Decisions Made
- [Decision]: [Context and rationale if stated]

### Action Items
| Who | What | When |
|-----|------|------|
| [Name] | [Action] | [Deadline if mentioned] |

### Open Questions
- [Question raised but not resolved]

### Notable Quotes
> "[Exact quote]" - [Speaker]

[Include quotes that capture important positions, commitments, or insights]
```

## Fact-Checking Guidelines

**Actively look up:**
- Statements where someone says "I need to look that up" or "I'm not sure about..."
- Statistics, dates, or numbers that could be verified
- Quotes attributed to specific people
- References to articles, videos, books, or studies
- Claims that seem central to decisions being made

**Use web search** to verify or find information. Include what you found in the Analysis section.

**Be honest about uncertainty.** If you can't verify something, say so. Don't make up confirmations.

## Why Python (Not Node.js)

This tool uses Python instead of the standard Node.js stack because:

| | Node.js (@xenova/transformers) | Python (openai-whisper) |
|---|---|---|
| GPU Support | None (CPU only) | CUDA + MPS (Apple Silicon) |
| 60-min audio | ~60+ minutes | ~10 minutes |
| Speed | 1x real-time | 6-10x real-time |

The Node.js Whisper implementation cannot access GPU acceleration, making it 5-10x slower.

**This exception is documented in** `.cursor/rules/Always Apply.mdc` under "Approved Python Exceptions."

## Quick Start

```bash
python transcribe_audio.py <path_to_audio_file>
```

**With specific model:**
```bash
python transcribe_audio.py recording.m4a --model medium
```

## Model Selection

| Model  | Size   | RAM   | GPU Speed  | Accuracy |
|--------|--------|-------|------------|----------|
| tiny   | ~75MB  | ~1GB  | ~30x RT    | Good     |
| base   | ~140MB | ~1GB  | ~20x RT    | Better   | (Default)
| small  | ~460MB | ~2GB  | ~10x RT    | Great    |
| medium | ~1.5GB | ~5GB  | ~5x RT     | Excellent|
| large  | ~3GB   | ~10GB | ~2x RT     | Best     |

*RT = Real-Time (e.g., 10x RT means 10 min audio in 1 min)*

**Recommendation:** Use `medium` for important recordings where accuracy matters.

## Supported Audio Formats

MP3, MP4, MPEG, MPGA, M4A, WAV, WebM, OGG, FLAC

## Troubleshooting

### Setup

**Requirements:** Python 3.8+, 2-3GB disk space, 4GB+ RAM

```bash
pip install -r requirements.txt
```

Models download automatically on first use to `~/.cache/whisper/`

### Common Issues

**"Using CPU" when you have a GPU:**
- Mac: Ensure macOS 12.3+ and PyTorch 2.0+
- NVIDIA: Install CUDA toolkit

**Slow performance:** Use smaller model, ensure GPU is being used

**Out of memory:** Use smaller model, close other apps

## Cost

**$0.00 - Completely Free!**

No API costs, no subscriptions, unlimited usage, complete privacy.
