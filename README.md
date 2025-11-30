# Verta - Decentralized Short-Form Video Platform

A decentralized ReelShort-like platform for vertical short-form videos, using Walrus for storage and Sui blockchain for metadata. This MVP focuses on core upload and playback functionality.

## 🏗️ Architecture

```
verta/
├── frontend/          # React + TypeScript + Vite + HLS.js
├── backend/           # Hono streaming aggregator
├── processor/         # Express video processing service
└── contracts/         # Sui Move smart contracts
```

### Components

1. **Frontend**: React app with HLS.js video player, upload interface, and vertical feed
2. **Backend (Aggregator)**: Streams video chunks from Walrus, generates HLS manifests, caches chunks
3. **Processor**: Handles video upload, FFmpeg chunking, Walrus publishing, Sui metadata creation
4. **Smart Contract**: Sui Move contract for storing video metadata on-chain

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg installed (for video processing)
- Sui CLI (for contract deployment)
- Funded Sui testnet wallet

### 1. Clone & Install

```bash
git clone <repo-url>
cd verta

# Install dependencies for all services
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd processor && npm install && cd ..
```

### 2. Deploy Sui Smart Contract

```bash
cd contracts

# Build the contract
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000

# Copy the Package ID from the output
```

### 3. Configure Environment Variables

Create `.env` files in each service directory:

#### frontend/.env
```bash
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
VITE_AGGREGATOR_URL=http://localhost:3001
VITE_PROCESSOR_URL=http://localhost:3002
VITE_PACKAGE_ID=<your-sui-package-id>
```

#### backend/.env
```bash
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
WALRUS_NETWORK=testnet
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
PORT=3001
PACKAGE_ID=<your-sui-package-id>
```

#### processor/.env
```bash
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
WALRUS_NETWORK=testnet
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
PORT=3002
TEMP_DIR=./temp
PACKAGE_ID=<your-sui-package-id>
SUI_PRIVATE_KEY=<base64-encoded-private-key>
```

**Generate Sui Private Key:**
```bash
# Create new address
sui client new-address ed25519

# Export private key
sui keytool export --key-identity <address>

# Copy the base64-encoded key to .env
```

### 4. Start All Services

Open 3 terminal windows:

```bash
# Terminal 1: Backend (Aggregator)
cd backend
npm run dev

# Terminal 2: Processor
cd processor
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

## 📖 How It Works

### Video Upload Flow

1. User uploads video via frontend
2. Frontend sends video to **Processor** service
3. Processor:
   - Chunks video into 5-second segments @ 720p using FFmpeg
   - Uploads each chunk to **Walrus** as blobs
   - Extracts thumbnail and uploads to Walrus
   - Creates a video object on **Sui** with metadata
   - Returns video ID and transaction digest

### Video Playback Flow

1. User requests video playback
2. Frontend fetches metadata from **Backend**
3. Backend queries **Sui** for video metadata (chunks, thumbnail)
4. Frontend initializes HLS.js player
5. HLS.js requests manifest from Backend
6. Backend:
   - Generates HLS manifest dynamically
   - Streams chunks from **Walrus**
   - Caches chunks in LRU cache (500MB)
   - Prefetches next 2 chunks

## 🛠️ API Reference

### Processor API

#### POST /api/upload
Upload and process a video

**Request:**
```bash
curl -X POST http://localhost:3002/api/upload \
  -F "video=@video.mp4" \
  -F "title=My Video" \
  -F "description=Video description"
```

**Response:**
```json
{
  "success": true,
  "videoId": "0x...",
  "txDigest": "...",
  "blobIds": ["blob1", "blob2", ...],
  "thumbnailBlobId": "...",
  "chunkCount": 12,
  "duration": 60.5
}
```

### Aggregator API

#### GET /v1/videos/:videoId/metadata
Fetch video metadata from Sui

#### GET /v1/videos/:videoId/manifest.m3u8
Get HLS master manifest

#### GET /v1/videos/:videoId/playlist.m3u8
Get HLS media playlist

#### GET /v1/videos/:videoId/stream/:sequence
Stream video chunk by sequence number

#### GET /v1/videos
Fetch all videos for feed

#### GET /v1/cache/stats
Get cache statistics

## 🧪 Testing

### Test Video Upload

```bash
# Create a test video (requires ffmpeg)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=10 \
  -pix_fmt yuv420p test-video.mp4

# Upload via curl
curl -X POST http://localhost:3002/api/upload \
  -F "video=@test-video.mp4" \
  -F "title=Test Video" \
  -F "description=This is a test"
```

### Test Video Playback

```bash
# Get video metadata
curl http://localhost:3001/v1/videos/<video-id>/metadata

# Get HLS manifest
curl http://localhost:3001/v1/videos/<video-id>/manifest.m3u8

# Stream first chunk
curl http://localhost:3001/v1/videos/<video-id>/stream/0 -o chunk0.mp4
```

## 🔧 Development

### Project Structure Details

#### Frontend (`frontend/`)
- `src/components/video/video-player.tsx` - HLS.js video player
- `src/components/upload/upload-form.tsx` - Upload interface
- `src/lib/sui.ts` - Sui client utilities
- Uses Vite for fast dev server

#### Backend (`backend/src/`)
- `server.ts` - Hono server with all routes
- `streaming.ts` - HLS manifest generation & Walrus streaming
- `cache.ts` - LRU cache implementation
- `metadata.ts` - Sui metadata fetching

#### Processor (`processor/src/`)
- `server.ts` - Express server with upload endpoint
- `chunker.ts` - FFmpeg video chunking logic
- `uploader.ts` - Walrus HTTP API upload & Sui transaction creation

#### Smart Contract (`contracts/sources/`)
- `verta.move` - Video and VideoChunk structs, entry functions

## 📝 Sui Smart Contract

The contract stores video metadata on-chain:

```move
public struct Video {
  id: UID,
  creator: address,
  title: String,
  description: String,
  chunks: vector<VideoChunk>,
  thumbnail_blob_id: String,
  created_at: u64,
  views: u64,
}

public struct VideoChunk {
  blob_id: String,
  sequence: u64,
  duration: u64,
}
```

**Functions:**
- `create_video()` - Create new video object
- `add_chunk()` - Add chunk to video
- `increment_views()` - Increment view count

## 🌐 Walrus Integration

### Publishing Blobs (Processor)

```typescript
const response = await fetch(
  `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=5`,
  {
    method: 'PUT',
    body: fileBuffer
  }
);
```

### Reading Blobs (Aggregator)

```typescript
const response = await fetch(
  `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`
);
```

## 🐛 Troubleshooting

### Video Upload Fails
- Check FFmpeg is installed: `ffmpeg -version`
- Verify processor .env has `SUI_PRIVATE_KEY`
- Check Sui wallet has testnet SUI tokens

### Video Won't Play
- Open browser console for HLS errors
- Verify aggregator can reach Walrus aggregator
- Check video metadata exists on Sui:
  ```bash
  sui client object <video-id>
  ```

### CORS Errors
- Backend and processor have CORS enabled for all origins
- Check firewall/network settings

## 📦 Deployment

### Deploy Smart Contract
```bash
cd contracts
sui client publish --gas-budget 100000000
```

### Run Services in Production
```bash
# Build all services
cd frontend && npm run build
cd ../backend && npm run build
cd ../processor && npm run build

# Run with PM2 or systemd
pm2 start backend/dist/server.js --name verta-backend
pm2 start processor/dist/server.js --name verta-processor
pm2 serve frontend/dist 3000 --name verta-frontend
```

## 🎯 MVP Features

- ✅ Video upload (max 60s for MVP)
- ✅ FFmpeg chunking (5-sec segments @ 720p)
- ✅ Walrus blob storage
- ✅ Sui blockchain metadata
- ✅ HLS adaptive streaming
- ✅ LRU cache (500MB)
- ✅ Vertical video player
- ⏳ Feed with Swiper (pending)
- ⏳ Mobile-responsive design (pending)

## 🚧 Next Steps

1. Deploy smart contract and update all .env files with PACKAGE_ID
2. Get funded Sui testnet wallet and update processor .env
3. Test full upload → playback flow
4. Implement vertical feed with Swiper
5. Add error handling and retry logic
6. Mobile optimization
7. Deploy to cloud (Vercel + Render/Railway)

## 📄 License

MIT

## 🤝 Contributing

PRs welcome! Focus on the MVP features listed above.

---

**Note:** This is an MVP. Production deployment would require:
- Authentication & authorization
- Rate limiting
- Video quality validation
- Content moderation
- Analytics
- Social features (likes, comments, shares)
