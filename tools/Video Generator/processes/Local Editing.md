# Local Video Editing

Edit videos locally using fluent-ffmpeg without API calls.


## Prerequisites

Run `npm install` in the Video Generator directory. FFmpeg is bundled automatically.


## Basic Usage

```bash
cd "cofounder/tools/Video Generator"
node scripts/local-video-edit.js input.mp4 output.mp4 [options]
```


## Operations

### Trim Video

Extract a portion of video by specifying start and end times (in seconds):

```bash
node scripts/local-video-edit.js input.mp4 output.mp4 --trim 5 15
```

This extracts from 5 seconds to 15 seconds (10 second clip).


### Resize Video

Change video dimensions:

```bash
node scripts/local-video-edit.js input.mp4 output.mp4 --resize 1280 720
```


### Change Speed

Speed up or slow down video:

```bash
# 2x speed
node scripts/local-video-edit.js input.mp4 output.mp4 --speed 2.0

# Half speed (slow motion)
node scripts/local-video-edit.js input.mp4 output.mp4 --speed 0.5
```


### Add Text Overlay

Add text to the video:

```bash
node scripts/local-video-edit.js input.mp4 output.mp4 --text "Hello World" --text-position center
```

Text positions: `top`, `center`, `bottom`


### Remove Audio

Strip audio from video:

```bash
node scripts/local-video-edit.js input.mp4 output.mp4 --remove-audio
```


### Concatenate Videos

Join multiple videos together:

```bash
node scripts/local-video-edit.js video1.mp4 video2.mp4 video3.mp4 --concat output.mp4
```


### Extract Frames

Export frames as images:

```bash
node scripts/local-video-edit.js input.mp4 --extract-frames ./frames/ --fps 1
```

This extracts 1 frame per second.


### Create GIF

Convert video to animated GIF:

```bash
node scripts/local-video-edit.js input.mp4 output.gif --gif --fps 10
```


## Parameters

| Parameter | Description |
|-----------|-------------|
| `input` | Input video file(s) |
| `output` | Output file path |
| `--trim START END` | Trim to time range (seconds) |
| `--resize W H` | Resize to width x height |
| `--speed FACTOR` | Speed multiplier (0.5 = slow, 2.0 = fast) |
| `--text TEXT` | Add text overlay |
| `--text-position POS` | Text position (top/center/bottom) |
| `--remove-audio` | Remove audio track |
| `--concat OUTPUT` | Concatenate multiple inputs |
| `--extract-frames DIR` | Extract frames to directory |
| `--gif` | Output as GIF instead of MP4 |
| `--fps N` | Frames per second (for extraction/GIF) |


## Combining Operations

Multiple operations can be combined:

```bash
node scripts/local-video-edit.js input.mp4 output.mp4 --trim 0 10 --resize 640 360 --speed 1.5
```


## Troubleshooting

**FFmpeg not found:** FFmpeg is bundled via ffmpeg-static. Run `npm install` to ensure it's installed.

**Memory errors with large videos:** Process in smaller chunks or reduce resolution first.

**Import error:** Run `npm install` in the Video Generator directory.


## Output

- Videos saved as MP4 (H.264 codec)
- GIFs saved with optimized palette
- Frames saved as PNG

