# Walrus Integration Guide

ReelShort uses Walrus decentralized storage for video and thumbnail storage with efficient caching for streaming.

## Overview

**Walrus** is a decentralized storage network built on the Sui blockchain. Videos are stored as immutable blobs and can be retrieved from any Walrus aggregator.

### Key Features
- ✅ Decentralized blob storage (no single point of failure)
- ✅ 10MB blob size limit (perfect for short dramas)
- ✅ Local caching for efficient streaming
- ✅ Range request support (video seeking)
- ✅ Automatic cache management (LRU)

## Architecture

```
Client Upload → API Server → Walrus Publisher → Sui Blockchain
                                                     ↓
Client Stream ← Cache ← API Server ← Walrus Aggregator
```

### Upload Flow
1. Client uploads video to `/api/upload/video` or `/api/upload/drama`
2. API receives file and temporarily saves it
3. API uploads to Walrus Publisher
4. Walrus returns blob ID and Sui object ID
5. API stores blob ID in PostgreSQL
6. Temporary file is deleted
7. Client receives blob ID and stream URL

### Streaming Flow
1. Client requests `/api/stream/{blobId}`
2. API checks local cache
3. If cached → stream from cache
4. If not cached → download from Walrus Aggregator → cache → stream
5. Support range requests for video seeking

## Configuration

### Environment Variables (server/.env)

```bash
# Walrus Publisher (for uploads)
WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space

# Walrus Aggregator (for downloads)
WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space

# Storage duration (in epochs, 1 epoch ≈ 1 day)
WALRUS_EPOCHS=200

# Max file size (10MB limit)
MAX_FILE_SIZE=10485760
```

### Public Walrus Services

**Testnet:**
- Publisher: `https://publisher.walrus-testnet.walrus.space`
- Aggregator: `https://aggregator.walrus-testnet.walrus.space`

**Mainnet:** (requires authentication)
- See official Walrus documentation

## API Endpoints

### Upload Video to Walrus

```bash
POST /api/upload/video
Authorization: Bearer <token>
Content-Type: multipart/form-data

video: <file>
```

**Response:**
```json
{
  "message": "Video uploaded to Walrus successfully",
  "blobId": "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
  "blobObjectId": "0xe91eee8c...",
  "streamUrl": "/api/stream/M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
  "walrusUrl": "https://aggregator.walrus-testnet.walrus.space/v1/blobs/...",
  "size": 5242880,
  "endEpoch": 234,
  "cost": 132300
}
```

### Upload Drama (Video + Thumbnail)

```bash
POST /api/upload/drama
Authorization: Bearer <token>
Content-Type: multipart/form-data

video: <file>
thumbnail: <file>
```

**Response:**
```json
{
  "message": "Drama uploaded to Walrus successfully",
  "video": {
    "blobId": "...",
    "streamUrl": "/api/stream/...",
    "size": 5242880,
    ...
  },
  "thumbnail": {
    "blobId": "...",
    "url": "/api/stream/...",
    "size": 102400,
    ...
  }
}
```

### Stream Video

```bash
GET /api/stream/:blobId
Range: bytes=0-1024 (optional, for seeking)
```

**Response:** Video stream with range support

### Create Drama with Walrus

```bash
POST /api/dramas
Authorization: Bearer <token>

{
  "title": "My Drama",
  "description": "...",
  "duration": 180,
  "category": "Romance",
  "walrusBlobId": "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
  "walrusBlobObjectId": "0xe91eee8c...",
  "walrusThumbnailBlobId": "...",
  "walrusEndEpoch": 234
}
```

## Database Schema

### Dramas Table (Walrus Fields)

```sql
walrus_blob_id VARCHAR(255)           -- Walrus blob ID for video
walrus_blob_object_id VARCHAR(255)    -- Sui object ID
walrus_thumbnail_blob_id VARCHAR(255) -- Walrus blob ID for thumbnail
walrus_end_epoch INTEGER              -- Storage expiration epoch
```

## Caching Strategy

### Local File Cache
- Downloaded blobs are cached in `server/cache/videos/`
- Automatic LRU (Least Recently Used) eviction
- Default max cache size: 1GB
- Cache cleanup runs every hour

### Cache Management

```javascript
// Manual cache clear
import { clearCache, deleteCachedBlob } from './services/walrus.js';

// Clear cache to 1GB
await clearCache(1024 * 1024 * 1024);

// Delete specific blob from cache
deleteCachedBlob('M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk');
```

## File Size Limits

- **Walrus Limit:** 10MB per blob
- **Configured Limit:** 10MB (matching Walrus)
- **Recommendation:** For longer videos, split into multiple 10MB blobs or use lower quality

## Cost Considerations

### Testnet (Free)
- No cost for uploads and storage
- Use for development and testing

### Mainnet (Coming Soon)
- Costs are calculated based on:
  - Blob size
  - Storage duration (epochs)
  - Network fees

## Troubleshooting

### Upload Fails: "File size exceeds limit"

**Solution:** Reduce video file size or use compression
```bash
ffmpeg -i input.mp4 -vcodec h264 -b:v 1M output.mp4
```

### Streaming is Slow

**Causes:**
1. Blob not cached (first download is slow)
2. Walrus aggregator latency
3. Network issues

**Solutions:**
- Subsequent plays are fast (cached)
- Use public aggregators closer to your region
- Pre-cache popular videos

### "Failed to download from Walrus"

**Causes:**
1. Invalid blob ID
2. Aggregator is down
3. Blob expired (past end epoch)

**Solutions:**
- Verify blob ID
- Try different aggregator
- Re-upload expired blobs

## Best Practices

### For Uploads
1. ✅ Validate file size before upload
2. ✅ Compress videos to < 10MB
3. ✅ Use appropriate storage epochs (200 ≈ 6-7 months)
4. ✅ Store blob IDs in database immediately
5. ✅ Handle upload failures gracefully

### For Streaming
1. ✅ Use range requests for seeking
2. ✅ Implement loading states
3. ✅ Cache popular content
4. ✅ Provide fallback for network errors
5. ✅ Monitor cache size

### For Production
1. ✅ Use multiple aggregators for redundancy
2. ✅ Monitor Walrus network status
3. ✅ Implement retry logic
4. ✅ Set up CDN in front of cache
5. ✅ Track storage costs on Mainnet

## Example: Complete Upload & Play Flow

```javascript
// 1. Upload video
const formData = new FormData();
formData.append('video', videoFile);

const uploadResult = await fetch('/api/upload/video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

const { blobId, streamUrl } = await uploadResult.json();

// 2. Create drama
await fetch('/api/dramas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My Drama',
    description: 'A beautiful story',
    duration: 180,
    walrusBlobId: blobId,
  }),
});

// 3. Play video
<video controls>
  <source src={streamUrl} type="video/mp4" />
</video>
```

## Monitoring

### Check Blob Status

```bash
# Via API
curl http://localhost:5000/api/stream/{blobId}/info

# Direct from Walrus
curl https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}
```

### Cache Statistics

```javascript
import fs from 'fs';
import path from 'path';

const CACHE_DIR = './server/cache/videos';
const files = fs.readdirSync(CACHE_DIR);
const totalSize = files.reduce((sum, file) => {
  const stats = fs.statSync(path.join(CACHE_DIR, file));
  return sum + stats.size;
}, 0);

console.log(`Cached files: ${files.length}`);
console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
```

## Future Enhancements

- [ ] Quilt support (multiple blobs as one unit)
- [ ] CDN integration for global distribution
- [ ] Automatic video compression before upload
- [ ] Progressive upload for better UX
- [ ] Analytics on cache hit rates
- [ ] Multi-aggregator fallback
- [ ] Blockchain verification of blob integrity

## Resources

- [Walrus Documentation](https://docs.walrus.site/)
- [Walrus Testnet](https://testnet.walrus.site/)
- [Sui Blockchain](https://sui.io/)

---

**Need Help?** Check the [main README](README.md) or open an issue.
