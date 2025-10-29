# Walrus Quilts: Video Chunking Guide

Complete guide to ReelShort's chunked video upload and progressive streaming using Walrus Quilts.

## Overview

**Quilts** enable efficient storage and streaming of videos by splitting them into chunks. This provides:

- ✅ **400x cost savings** for small files
- ✅ **Progressive loading** - Start playback immediately
- ✅ **Bandwidth efficiency** - Only download what user watches
- ✅ **Seeking support** - Jump to any part instantly
- ✅ **Larger videos** - Support beyond 10MB limit

## Architecture

###  Upload Flow

```
10MB Video File
    ↓
Split into 20 chunks (500KB each)
    ↓
Upload as single Quilt to Walrus
    ↓
Receive 20 QuiltPatchIds
    ↓
Store in PostgreSQL (drama_chunks table)
```

### Streaming Flow

```
User clicks play
    ↓
Download Chunk 0 → Start playback
    ↓
Pre-fetch Chunk 1 in background
    ↓
User seeks to 50%
    ↓
Download Chunk 10 → Continue playback
```

## How It Works

### 1. Video Chunking

Videos are automatically chunked based on size:

- **< 1MB**: Single blob (no chunking)
- **1-10MB**: Chunked into 500KB pieces
- **> 10MB**: Split into multiple quilts (future)

**Chunk Size Strategy:**
```javascript
Video Duration < 60s  → 256KB chunks (fine-grained seeking)
Video Duration 60-180s → 500KB chunks (balanced)
Video Duration > 180s  → 1MB chunks (fewer requests)
```

### 2. Quilt Upload

```javascript
// Upload video
POST /api/upload/video
Content-Type: multipart/form-data
video: <file>

// Response (chunked)
{
  "chunked": true,
  "quiltId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKo",
  "numChunks": 20,
  "patches": [
    { "identifier": "chunk-0", "quiltPatchId": "..." },
    { "identifier": "chunk-1", "quiltPatchId": "..." },
    ...
  ],
  "streamUrl": "/api/stream/quilt/6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKo",
  "cost": 0.084  // 497x cheaper than 20 separate blobs!
}
```

### 3. Create Drama with Quilt

```javascript
POST /api/dramas
Authorization: Bearer <token>

{
  "title": "My Drama",
  "description": "A beautiful story",
  "duration": 180,
  "category": "Romance",
  "walrusQuiltId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKo",
  "walrusQuiltObjectId": "0xe6ac1e...",
  "quiltPatches": [
    { "identifier": "chunk-0", "quiltPatchId": "..." },
    { "identifier": "chunk-1", "quiltPatchId": "..." },
    ...
  ]
}
```

### 4. Progressive Streaming

**Get Chunk Manifest:**
```bash
GET /api/stream/quilt/:dramaId/manifest

Response:
{
  "dramaId": "uuid",
  "totalChunks": 20,
  "chunks": [
    {
      "index": 0,
      "patchId": "...",
      "size": 512000,
      "startTime": 0,
      "endTime": 9,
      "duration": 9,
      "streamUrl": "/api/stream/quilt/uuid/0",
      "cached": false
    },
    ...
  ]
}
```

**Stream Specific Chunk:**
```bash
GET /api/stream/quilt/:dramaId/0  # First chunk
GET /api/stream/quilt/:dramaId/10 # Middle chunk
```

**Pre-fetch Chunks:**
```bash
POST /api/stream/quilt/:dramaId/prefetch
{
  "chunkIndexes": [0, 1, 2]
}
```

## Database Schema

```sql
CREATE TABLE drama_chunks (
  id UUID PRIMARY KEY,
  drama_id UUID REFERENCES dramas(id),
  quilt_id VARCHAR(255),           -- Same for all chunks
  quilt_patch_id VARCHAR(255),     -- Unique per chunk
  chunk_index INTEGER,              -- 0, 1, 2, ...
  chunk_size INTEGER,
  start_time FLOAT,                 -- Seconds
  end_time FLOAT,
  duration FLOAT,
  created_at TIMESTAMP
);
```

## Frontend Integration

### Upload with Progress

```javascript
const uploadVideo = async (videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await fetch('/api/upload/video', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  const result = await response.json();

  if (result.chunked) {
    console.log(`Uploaded as quilt: ${result.numChunks} chunks`);
    console.log(`Cost savings: ${result.cost} WAL`);

    // Create drama with quilt
    await createDramaWithQuilt(result);
  } else {
    console.log('Uploaded as single blob');
  }
};
```

### Progressive Video Player

```javascript
const ProgressivePlayer = ({ dramaId }) => {
  const [manifest, setManifest] = useState(null);
  const [currentChunk, setCurrentChunk] = useState(0);
  const videoRef = useRef();

  useEffect(() => {
    // Fetch chunk manifest
    fetch(`/api/stream/quilt/${dramaId}/manifest`)
      .then(res => res.json())
      .then(setManifest);
  }, [dramaId]);

  const playChunk = (index) => {
    const chunkUrl = `/api/stream/quilt/${dramaId}/${index}`;
    videoRef.current.src = chunkUrl;
    videoRef.current.play();

    // Pre-fetch next chunk
    if (index + 1 < manifest.totalChunks) {
      fetch(`/api/stream/quilt/${dramaId}/prefetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkIndexes: [index + 1] }),
      });
    }
  };

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current.currentTime;

    // Find which chunk we should be playing
    const targetChunk = manifest.chunks.find(
      c => currentTime >= c.startTime && currentTime < c.endTime
    );

    if (targetChunk && targetChunk.index !== currentChunk) {
      setCurrentChunk(targetChunk.index);
      playChunk(targetChunk.index);
    }
  };

  return (
    <video
      ref={videoRef}
      controls
      onTimeUpdate={handleTimeUpdate}
    />
  );
};
```

### Simple Playback (Recommended)

For simpler use cases, you can use the quilt ID directly:

```javascript
<video controls>
  <source src={`/api/stream/quilt/${dramaId}/0`} type="video/mp4" />
</video>
```

The API will automatically serve chunks sequentially.

## Cost Comparison

### Example: 600 Small Videos (10KB each)

**Without Quilts:**
- 600 separate blobs
- Cost: 600 × 2.088 WAL = **1,252.8 WAL**
- Sui gas: High (600 transactions)

**With Quilts (1 quilt per video):**
- 600 quilts
- Cost: 600 × 0.005 WAL = **3 WAL**
- Savings: **409x cheaper!**
- Sui gas: **238x cheaper!**

### Example: 10MB Video

**Without Chunking:**
- 1 blob
- Cost: ~2.088 WAL
- User must download entire 10MB before playback

**With Quilt Chunking (20 chunks × 500KB):**
- 1 quilt with 20 chunks
- Cost: ~0.084 WAL (**25x cheaper**)
- User downloads chunk 0 (500KB) → instant playback!
- Total download: Only what they watch

## Best Practices

### 1. Chunk Size Selection

```javascript
// Short videos (< 60s)
CHUNK_SIZE = 256KB  // Better seeking granularity

// Medium videos (60-180s)
CHUNK_SIZE = 500KB  // Balanced performance

// Long videos (> 180s)
CHUNK_SIZE = 1MB    // Fewer HTTP requests
```

### 2. Pre-fetching Strategy

```javascript
// Pre-fetch next 2 chunks while current plays
const preFetchAhead = 2;

onChunkStart(index) {
  const nextIndexes = Array.from(
    { length: preFetchAhead },
    (_, i) => index + i + 1
  ).filter(i => i < totalChunks);

  fetch(`/api/stream/quilt/${dramaId}/prefetch`, {
    method: 'POST',
    body: JSON.stringify({ chunkIndexes: nextIndexes }),
  });
}
```

### 3. Seeking Optimization

```javascript
onSeek(targetTime) => {
  // Calculate target chunk
  const chunkIndex = Math.floor(
    (targetTime / videoDuration) * totalChunks
  );

  // Download target chunk + next 2
  preFetch([chunkIndex, chunkIndex + 1, chunkIndex + 2]);

  // Start playback at target chunk
  playChunk(chunkIndex);
}
```

### 4. Mobile Optimization

```javascript
// On mobile, use smaller chunks for better network handling
const MOBILE_CHUNK_SIZE = 256KB;

// Pre-fetch less aggressively on mobile
const MOBILE_PREFETCH_AHEAD = 1;

// Detect slow connection
if (navigator.connection?.effectiveType === '3g') {
  USE_SMALLER_CHUNKS = true;
  PREFETCH_AHEAD = 1;
}
```

## Monitoring

### Cache Hit Rate

```bash
# Check which chunks are cached
GET /api/stream/quilt/:dramaId/manifest

# Look at "cached" field for each chunk
{
  "chunks": [
    { "index": 0, "cached": true },   // ✅ Fast
    { "index": 1, "cached": false },  // ⏳ Will download
    ...
  ]
}
```

### Download Statistics

```javascript
// Track download performance
const trackChunkDownload = (chunkIndex, startTime) => {
  const downloadTime = Date.now() - startTime;
  const chunkSize = manifest.chunks[chunkIndex].size;
  const speed = (chunkSize / downloadTime) * 1000; // bytes/sec

  console.log(`Chunk ${chunkIndex}: ${downloadTime}ms, ${speed / 1024}KB/s`);
};
```

## Troubleshooting

### Slow Initial Playback

**Cause:** First chunk download
**Solution:**
```javascript
// Pre-load first chunk on page load
useEffect(() => {
  fetch(`/api/stream/quilt/${dramaId}/prefetch`, {
    method: 'POST',
    body: JSON.stringify({ chunkIndexes: [0] }),
  });
}, [dramaId]);
```

### Seeking is Slow

**Cause:** Target chunk not cached
**Solution:** Pre-fetch chunks around seek bar

```javascript
onSeekStart(targetTime) => {
  const targetChunk = calculateChunkIndex(targetTime);
  // Pre-fetch ±2 chunks around target
  preFetch([
    targetChunk - 2,
    targetChunk - 1,
    targetChunk,
    targetChunk + 1,
    targetChunk + 2,
  ].filter(i => i >= 0 && i < totalChunks));
}
```

### Chunks Won't Stream

**Cause:** drama_chunks table not populated
**Solution:** Ensure quiltPatches are passed when creating drama

```javascript
// ❌ Wrong
await createDrama({
  walrusQuiltId: quiltId,
  // Missing quiltPatches!
});

// ✅ Correct
await createDrama({
  walrusQuiltId: result.quiltId,
  quiltPatches: result.patches,  // ← Important!
});
```

## Limitations

1. **Max 666 chunks per quilt** (Walrus limit)
2. **Chunks cannot be deleted individually** (only entire quilt)
3. **QuiltPatchId changes if re-uploaded** (content-addressed but quilt-dependent)

## Future Enhancements

- [ ] Adaptive chunk sizing based on network speed
- [ ] Smart pre-fetching using ML (predict what user will watch)
- [ ] Multi-quilt support for videos > 333MB (666 chunks × 500KB)
- [ ] Chunk deduplication across videos
- [ ] HLS/DASH manifest generation from chunks

## Resources

- [Walrus Quilt Documentation](https://docs.walrus.site/usage/quilts.html)
- [Main Walrus Integration Guide](WALRUS_INTEGRATION.md)
- [ReelShort README](README.md)

---

**Pro Tip:** For videos under 1MB, single blob upload is more efficient. Quilt chunking shines for 1-10MB videos!
